import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { session_id, answers, time_taken_seconds } = body;

  if (!session_id || !answers) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let vocabScore = 0;
  let vocabTotal = 0;

  for (const ans of answers) {
    const correct = ans.was_correct ? 1 : 0;
    if (ans.type === 'vocabulary' || ans.type === 'kanji') { 
      vocabScore += correct; 
      vocabTotal++; 
    }
  }

  const totalScore = vocabTotal > 0 ? Math.round((vocabScore / vocabTotal) * 100) : 0;

  db.prepare(`
    UPDATE mock_test_results SET
      vocab_score = ?,
      total_score = ?
    WHERE id = ?
  `).run(
    totalScore,
    totalScore,
    session_id
  );

  // Track weak items
  const now = new Date().toISOString();
  for (const ans of answers) {
    if (!ans.was_correct) {
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
    breakdown: { vocabScore, totalScore },
    passed: totalScore >= 60,
  });
}
