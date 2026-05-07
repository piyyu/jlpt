import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request, { params }) {
  const db = getDb();
  const { id } = params;

  const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const answers = db.prepare(`
    SELECT qa.*,
      CASE qa.content_type
        WHEN 'vocabulary' THEN v.japanese
        WHEN 'kanji' THEN k.character
        WHEN 'grammar' THEN g.pattern
      END AS prompt,
      CASE qa.content_type
        WHEN 'vocabulary' THEN v.english
        WHEN 'kanji' THEN k.meaning
        WHEN 'grammar' THEN g.meaning
      END AS correct_answer
    FROM quiz_answers qa
    LEFT JOIN vocabulary v ON qa.content_type = 'vocabulary' AND qa.content_id = v.id
    LEFT JOIN kanji k ON qa.content_type = 'kanji' AND qa.content_id = k.id
    LEFT JOIN grammar g ON qa.content_type = 'grammar' AND qa.content_id = g.id
    WHERE qa.session_id = ?
  `).all(id);

  const score = session.total_questions > 0
    ? Math.round((session.correct_answers / session.total_questions) * 100)
    : 0;

  return NextResponse.json({ session, answers, score });
}
