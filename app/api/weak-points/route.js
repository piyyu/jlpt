import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();

  const weakItems = db.prepare(`
    SELECT w.*,
      CASE w.content_type
        WHEN 'vocabulary' THEN v.japanese
        WHEN 'kanji' THEN k.character
        WHEN 'grammar' THEN g.pattern
      END AS prompt,
      CASE w.content_type
        WHEN 'vocabulary' THEN v.meaning
        WHEN 'kanji' THEN k.meaning
        WHEN 'grammar' THEN g.meaning
      END AS answer,
      CASE w.content_type
        WHEN 'vocabulary' THEN v.reading
        WHEN 'kanji' THEN k.kun_yomi
        ELSE NULL
      END AS reading
    FROM weak_items w
    LEFT JOIN vocabulary v ON w.content_type = 'vocabulary' AND w.content_id = v.id
    LEFT JOIN kanji k ON w.content_type = 'kanji' AND w.content_id = k.id
    LEFT JOIN grammar_points g ON w.content_type = 'grammar' AND w.content_id = g.id
    ORDER BY w.wrong_count DESC, w.last_wrong_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json(weakItems);
}

// Resolve (forgive) a weak item — e.g. after focused practice.
// Body: { content_type, content_id } — both required; no body clears nothing.
export async function DELETE(request) {
  const db = getDb();
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }
  const { content_type, content_id } = body;
  if (!content_type || content_id == null) {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }
  db.prepare(
    'DELETE FROM weak_items WHERE content_type = ? AND content_id = ?'
  ).run(content_type, content_id);
  return NextResponse.json({ success: true });
}
