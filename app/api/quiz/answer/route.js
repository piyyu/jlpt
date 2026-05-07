import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { session_id, content_type, content_id, was_correct } = body;

  if (!session_id || !content_type || content_id == null || was_correct == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO quiz_answers (session_id, content_type, content_id, was_correct)
    VALUES (?, ?, ?, ?)
  `).run(session_id, content_type, content_id, was_correct ? 1 : 0);

  if (was_correct) {
    db.prepare(`
      UPDATE quiz_sessions SET correct_answers = correct_answers + 1 WHERE id = ?
    `).run(session_id);
  } else {
    // Track as weak item
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO weak_items (content_type, content_id, wrong_count, last_wrong_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(content_type, content_id)
      DO UPDATE SET wrong_count = wrong_count + 1, last_wrong_at = excluded.last_wrong_at
    `).run(content_type, content_id, now);
  }

  return NextResponse.json({ success: true });
}
