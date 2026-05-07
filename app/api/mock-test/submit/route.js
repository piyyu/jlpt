import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { session_id, answers, time_taken_seconds } = body;

  if (!session_id || !answers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let vocabScore = 0, grammarScore = 0, readingScore = 0, listeningScore = 0;
  let vocabTotal = 0, grammarTotal = 0, readingTotal = 0, listeningTotal = 0;

  for (const ans of answers) {
    const correct = ans.was_correct ? 1 : 0;
    if (ans.type === 'vocabulary') { vocabScore += correct; vocabTotal++; }
    if (ans.type === 'grammar') { grammarScore += correct; grammarTotal++; }
    if (ans.type === 'reading') { readingScore += correct; readingTotal++; }
    if (ans.type === 'listening') { listeningScore += correct; listeningTotal++; }
  }

  const total = answers.length;
  const totalCorrect = vocabScore + grammarScore + readingScore + listeningScore;
  const totalScore = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  db.prepare(`
    UPDATE mock_test_results SET
      vocab_score = ?, grammar_score = ?, reading_score = ?, listening_score = ?,
      total_score = ?
    WHERE id = ?
  `).run(
    Math.round((vocabScore / Math.max(vocabTotal, 1)) * 100),
    Math.round((grammarScore / Math.max(grammarTotal, 1)) * 100),
    Math.round((readingScore / Math.max(readingTotal, 1)) * 100),
    Math.round((listeningScore / Math.max(listeningTotal, 1)) * 100),
    totalScore,
    session_id
  );

  // Track weak items
  const now = new Date().toISOString();
  for (const ans of answers) {
    if (!ans.was_correct && ans.type !== 'reading' && ans.type !== 'listening') {
      db.prepare(`
        INSERT INTO weak_items (content_type, content_id, wrong_count, last_wrong_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(content_type, content_id)
        DO UPDATE SET wrong_count = wrong_count + 1, last_wrong_at = excluded.last_wrong_at
      `).run(ans.type, ans.id, now);
    }
  }

  const result = db.prepare('SELECT * FROM mock_test_results WHERE id = ?').get(session_id);

  return NextResponse.json({
    result,
    breakdown: { vocabScore, grammarScore, readingScore, listeningScore, totalScore },
    passed: totalScore >= 60,
  });
}
