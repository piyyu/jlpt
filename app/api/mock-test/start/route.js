import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

export async function POST() {
  const db = getDb();

  // Language & vocabulary (10 questions)
  const vocabAll = db.prepare('SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT 30').all();
  const vocabQ = vocabAll.slice(0, 10).map((item) => {
    const opts = shuffle([
      item.english,
      ...vocabAll.filter((d) => d.id !== item.id).slice(0, 3).map((d) => d.english),
    ]);
    return { type: 'vocabulary', id: item.id, prompt: item.japanese, hint: item.reading, correct: item.english, options: opts };
  });

  // Grammar (5 questions)
  const grammarAll = db.prepare('SELECT * FROM grammar ORDER BY RANDOM() LIMIT 15').all();
  const grammarQ = grammarAll.slice(0, 5).map((item) => {
    const opts = shuffle([
      item.meaning,
      ...grammarAll.filter((d) => d.id !== item.id).slice(0, 3).map((d) => d.meaning),
    ]);
    return { type: 'grammar', id: item.id, prompt: item.pattern, hint: item.example1_jp, correct: item.meaning, options: opts };
  });

  // Reading (5 questions)
  const readingAll = db.prepare('SELECT * FROM reading_passages ORDER BY RANDOM() LIMIT 5').all();
  const readingQ = readingAll.map((item) => ({
    type: 'reading',
    id: item.id,
    prompt: item.title,
    passage: item.passage,
    question: item.question,
    correct: item[`option_${item.correct_option}`],
    options: [item.option_a, item.option_b, item.option_c, item.option_d],
  }));

  // Listening (5 questions)
  const listeningAll = db.prepare('SELECT * FROM listening_scripts ORDER BY RANDOM() LIMIT 5').all();
  const listeningQ = listeningAll.map((item) => ({
    type: 'listening',
    id: item.id,
    prompt: item.script_jp,
    question: item.question,
    correct: item[`option_${item.correct_option}`],
    options: [item.option_a, item.option_b, item.option_c, item.option_d],
  }));

  const session = db.prepare(`
    INSERT INTO mock_test_results (vocab_score, grammar_score, reading_score, listening_score, total_score)
    VALUES (0, 0, 0, 0, 0)
  `).run();

  return NextResponse.json({
    session_id: session.lastInsertRowid,
    sections: {
      vocabulary: vocabQ,
      grammar: grammarQ,
      reading: readingQ,
      listening: listeningQ,
    },
    time_limits: { language_reading_minutes: 25, listening_minutes: 30 },
  });
}
