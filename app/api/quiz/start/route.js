import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// For a kanji reading like "た・べる・く" pick the first clean part
function firstReading(yomi) {
  if (!yomi) return null;
  return yomi.split(/[・、/\s]/)[0].trim() || null;
}

function getMasteredIds(db, contentType) {
  return new Set(
    db
      .prepare(
        'SELECT content_id FROM srs_cards WHERE content_type = ? AND interval_days >= 21 AND repetitions >= 3'
      )
      .all(contentType)
      .map((r) => r.content_id)
  );
}

function getVocabQuestions(db, count, selectedOnly = false, masteredOnly = false) {
  const all = db.prepare('SELECT * FROM vocabulary').all();
  let pool = all;
  if (masteredOnly) {
    const ids = getMasteredIds(db, 'vocabulary');
    pool = all.filter((item) => ids.has(item.id));
  } else if (selectedOnly) {
    const ids = db
      .prepare("SELECT content_id FROM user_selections WHERE content_type = 'vocabulary'")
      .all()
      .map((r) => r.content_id);
    pool = all.filter((item) => ids.includes(item.id));
    if (pool.length === 0) pool = all;
  }

  return shuffle(pool).slice(0, count).map((item) => {
    const prompt = item.english;
    const answer = item.reading;
    
    const distractors = shuffle(all.filter((d) => d.id !== item.id))
      .map(d => d.reading)
      .filter(a => a !== answer)
      .slice(0, 3);
      
    return {
      content_type: 'vocabulary',
      content_id: item.id,
      prompt,
      hint: null,
      correct_answer: answer,
      options: shuffle([answer, ...distractors]),
      details: item,
    };
  });
}

function getKanjiQuestions(db, count, selectedOnly = false, masteredOnly = false) {
  const all = db.prepare('SELECT * FROM kanji').all();
  let pool = all;
  if (masteredOnly) {
    const ids = getMasteredIds(db, 'kanji');
    pool = all.filter((item) => ids.has(item.id));
  } else if (selectedOnly) {
    const ids = db
      .prepare("SELECT content_id FROM user_selections WHERE content_type = 'kanji'")
      .all()
      .map((r) => r.content_id);
    pool = all.filter((item) => ids.includes(item.id));
    if (pool.length === 0) pool = all;
  }

  function readingLabel(k) {
    const parts = [k.kun_yomi, k.on_yomi].filter(Boolean);
    return parts.join(' / ') || k.meaning;
  }

  return shuffle(pool).slice(0, count).map((item) => {
    const answer = readingLabel(item);
    const distractors = shuffle(
      all
        .filter((d) => d.id !== item.id)
        .map((d) => readingLabel(d))
        .filter((r) => r !== answer)
    ).slice(0, 3);

    return {
      content_type: 'kanji',
      content_id: item.id,
      prompt: item.character,
      hint: null,
      correct_answer: answer,
      options: shuffle([answer, ...distractors]),
      details: item,
    };
  });
}


function getGrammarQuestions(db, count, selectedOnly = false) {
  const all = db.prepare('SELECT * FROM grammar_points').all();
  let pool = all;
  if (selectedOnly) {
    const ids = db
      .prepare("SELECT content_id FROM user_selections WHERE content_type = 'grammar'")
      .all()
      .map((r) => r.content_id);
    pool = all.filter((item) => ids.includes(item.id));
    if (pool.length === 0) pool = all;
  }

  return shuffle(pool).slice(0, count).map((item) => {
    const prompt = item.meaning;
    const answer = item.pattern;

    const distractors = shuffle(all.filter((d) => d.id !== item.id))
      .map((d) => d.pattern)
      .filter((a) => a !== answer)
      .slice(0, 3);

    return {
      content_type: 'grammar',
      content_id: item.id,
      prompt,
      hint: item.structure || null,
      correct_answer: answer,
      options: shuffle([answer, ...distractors]),
      details: item,
    };
  });
}


export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { quiz_type = 'mixed', count = 10, selected_only = false, mastered_only = false } = body;

  const n = Math.min(count, 30);
  let questions = [];
  // Mastery mode: quiz mastered words only. Isolated by design — the
  // corresponding answer API must be called with practice:true so it never
  // touches srs_cards / weak_items / study_sessions.

  if (quiz_type === 'vocabulary') {
    questions = getVocabQuestions(db, n, selected_only, mastered_only);
  } else if (quiz_type === 'kanji') {
    questions = getKanjiQuestions(db, n, selected_only, mastered_only);
  } else if (quiz_type === 'grammar') {
    questions = getGrammarQuestions(db, n, selected_only);
  } else if (quiz_type === 'mastery') {
    const half = Math.ceil(n / 2);
    questions = shuffle([
      ...getVocabQuestions(db, half, false, true),
      ...getKanjiQuestions(db, n - half, false, true),
    ]).slice(0, n);
  } else {
    const half = Math.ceil(n / 2);
    questions = shuffle([
      ...getVocabQuestions(db, half, selected_only, mastered_only),
      ...getKanjiQuestions(db, n - half, selected_only, mastered_only),
    ]).slice(0, n);
  }

  const masteredVocab = getMasteredIds(db, 'vocabulary').size;
  const masteredKanji = getMasteredIds(db, 'kanji').size;

  const session = db
    .prepare('INSERT INTO quiz_sessions (quiz_type, total_questions, correct_answers) VALUES (?, ?, 0)')
    .run(quiz_type, questions.length);

  return NextResponse.json({
    session_id: session.lastInsertRowid,
    questions,
    mastered_only,
    masteredCounts: { vocabulary: masteredVocab, kanji: masteredKanji },
    isolated: quiz_type === 'mastery' || mastered_only === true,
  });
}
