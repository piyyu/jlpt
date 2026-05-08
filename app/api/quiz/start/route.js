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

function getVocabQuestions(db, count, selectedOnly = false) {
  const all = db.prepare('SELECT * FROM vocabulary').all();
  let pool = all;
  if (selectedOnly) {
    const ids = db
      .prepare("SELECT content_id FROM user_selections WHERE content_type = 'vocabulary'")
      .all()
      .map((r) => r.content_id);
    pool = all.filter((item) => ids.includes(item.id));
    if (pool.length === 0) pool = all;
  }

  return shuffle(pool).slice(0, count).map((item) => {
    const distractors = shuffle(all.filter((d) => d.id !== item.id && d.reading !== item.reading))
      .slice(0, 3)
      .map((d) => d.reading);
    return {
      content_type: 'vocabulary',
      content_id: item.id,
      prompt: item.japanese,
      hint: null,
      correct_answer: item.reading,
      options: shuffle([item.reading, ...distractors]),
      details: item,
    };
  });
}

function getKanjiQuestions(db, count, selectedOnly = false) {
  const all = db.prepare('SELECT * FROM kanji').all();
  let pool = all;
  if (selectedOnly) {
    const ids = db
      .prepare("SELECT content_id FROM user_selections WHERE content_type = 'kanji'")
      .all()
      .map((r) => r.content_id);
    pool = all.filter((item) => ids.includes(item.id));
    if (pool.length === 0) pool = all;
  }

  return shuffle(pool).slice(0, count).map((item) => {
    const answer = firstReading(item.kun_yomi) || firstReading(item.on_yomi) || item.meaning;
    const distractors = shuffle(
      all
        .filter((d) => d.id !== item.id)
        .map((d) => firstReading(d.kun_yomi) || firstReading(d.on_yomi))
        .filter(Boolean)
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

function getGrammarQuestions(db, count) {
  const all = db.prepare('SELECT * FROM grammar ORDER BY RANDOM() LIMIT ?').all(count * 3);
  return all.slice(0, count).map((item) => {
    const distractors = shuffle(all.filter((d) => d.id !== item.id))
      .slice(0, 3)
      .map((d) => d.pattern);
    return {
      content_type: 'grammar',
      content_id: item.id,
      prompt: item.meaning,
      hint: null,
      correct_answer: item.pattern,
      options: shuffle([item.pattern, ...distractors]),
      details: item,
    };
  });
}

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { quiz_type = 'mixed', count = 10, selected_only = false } = body;

  const n = Math.min(count, 30);
  let questions = [];

  if (quiz_type === 'vocabulary') {
    questions = getVocabQuestions(db, n, selected_only);
  } else if (quiz_type === 'kanji') {
    questions = getKanjiQuestions(db, n, selected_only);
  } else if (quiz_type === 'grammar') {
    questions = getGrammarQuestions(db, n);
  } else {
    const third = Math.ceil(n / 3);
    questions = shuffle([
      ...getVocabQuestions(db, third),
      ...getKanjiQuestions(db, third),
      ...getGrammarQuestions(db, n - third * 2),
    ]).slice(0, n);
  }

  const session = db
    .prepare('INSERT INTO quiz_sessions (quiz_type, total_questions, correct_answers) VALUES (?, ?, 0)')
    .run(quiz_type, questions.length);

  return NextResponse.json({ session_id: session.lastInsertRowid, questions });
}
