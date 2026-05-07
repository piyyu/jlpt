import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request) {
  const db = getDb();
  let questionCount = 20;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.questionCount) questionCount = Math.min(50, Math.max(5, body.questionCount));
  } catch (_) {}

  const half = Math.floor(questionCount / 2);
  const vocabCount = half;
  const kanjiCount = questionCount - half;

  // ── Vocabulary questions ────────────────────────────────────────────────────
  const vocabPool = db.prepare('SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT ?').all(vocabCount + 20);
  const vocabQ = fisherYates(vocabPool).slice(0, vocabCount).map((item) => {
    const distractors = fisherYates(
      vocabPool.filter((d) => d.id !== item.id && d.english !== item.english)
    ).slice(0, 3).map((d) => d.english);
    return {
      type: 'vocabulary',
      id: item.id,
      prompt: item.japanese,
      hint: item.reading,
      question: 'What does this word mean?',
      correct: item.english,
      options: fisherYates([item.english, ...distractors]),
    };
  });

  // ── Kanji questions ─────────────────────────────────────────────────────────
  const kanjiPool = db.prepare('SELECT * FROM kanji ORDER BY RANDOM() LIMIT ?').all(kanjiCount + 20);
  const kanjiQ = fisherYates(kanjiPool).slice(0, kanjiCount).map((item) => {
    const distractors = fisherYates(
      kanjiPool.filter((d) => d.id !== item.id && d.meaning !== item.meaning)
    ).slice(0, 3).map((d) => d.meaning);
    return {
      type: 'kanji',
      id: item.id,
      prompt: item.character,
      hint: item.kun_yomi || item.on_yomi || '',
      question: 'What does this kanji mean?',
      correct: item.meaning,
      options: fisherYates([item.meaning, ...distractors]),
    };
  });

  // Interleave vocab and kanji for a mixed feel
  const allQ = [];
  const maxLen = Math.max(vocabQ.length, kanjiQ.length);
  for (let i = 0; i < maxLen; i++) {
    if (vocabQ[i]) allQ.push(vocabQ[i]);
    if (kanjiQ[i]) allQ.push(kanjiQ[i]);
  }

  const session = db.prepare(
    'INSERT INTO mock_test_results (vocab_score, grammar_score, reading_score, listening_score, total_score) VALUES (0, 0, 0, 0, 0)'
  ).run();

  return NextResponse.json({
    session_id: session.lastInsertRowid,
    questions: allQ,
    totalQuestions: allQ.length,
    timeLimitSeconds: allQ.length * 30, // 30 seconds per question
  });
}
