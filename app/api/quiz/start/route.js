import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function getVocabQuestions(db, count) {
  const all = db.prepare('SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT ?').all(count * 3);
  const selected = all.slice(0, count);
  return selected.map((item) => {
    const distractors = all
      .filter((d) => d.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((d) => d.english);
    const options = shuffle([item.english, ...distractors]);
    return {
      content_type: 'vocabulary',
      content_id: item.id,
      prompt: item.japanese,
      hint: item.reading,
      correct_answer: item.english,
      options,
    };
  });
}

function getKanjiQuestions(db, count) {
  const all = db.prepare('SELECT * FROM kanji ORDER BY RANDOM() LIMIT ?').all(count * 3);
  const selected = all.slice(0, count);
  return selected.map((item) => {
    const distractors = all
      .filter((d) => d.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((d) => d.meaning);
    const options = shuffle([item.meaning, ...distractors]);
    return {
      content_type: 'kanji',
      content_id: item.id,
      prompt: item.character,
      hint: item.on_yomi,
      correct_answer: item.meaning,
      options,
    };
  });
}

function getGrammarQuestions(db, count) {
  const all = db.prepare('SELECT * FROM grammar ORDER BY RANDOM() LIMIT ?').all(count * 3);
  const selected = all.slice(0, count);
  return selected.map((item) => {
    const distractors = all
      .filter((d) => d.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((d) => d.meaning);
    const options = shuffle([item.meaning, ...distractors]);
    return {
      content_type: 'grammar',
      content_id: item.id,
      prompt: item.pattern,
      hint: item.example1_jp,
      correct_answer: item.meaning,
      options,
    };
  });
}

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { quiz_type = 'mixed', count = 10 } = body;

  let questions = [];
  const n = Math.min(count, 30);

  if (quiz_type === 'vocabulary') {
    questions = getVocabQuestions(db, n);
  } else if (quiz_type === 'kanji') {
    questions = getKanjiQuestions(db, n);
  } else if (quiz_type === 'grammar') {
    questions = getGrammarQuestions(db, n);
  } else {
    // mixed
    const third = Math.ceil(n / 3);
    questions = shuffle([
      ...getVocabQuestions(db, third),
      ...getKanjiQuestions(db, third),
      ...getGrammarQuestions(db, n - third * 2),
    ]).slice(0, n);
  }

  const session = db.prepare(`
    INSERT INTO quiz_sessions (quiz_type, total_questions, correct_answers)
    VALUES (?, ?, 0)
  `).run(quiz_type, questions.length);

  return NextResponse.json({
    session_id: session.lastInsertRowid,
    questions,
  });
}
