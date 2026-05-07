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
        WHEN 'vocabulary' THEN v.english
        WHEN 'kanji' THEN k.meaning
        WHEN 'grammar' THEN g.meaning
      END AS answer,
      CASE w.content_type
        WHEN 'vocabulary' THEN v.reading
        WHEN 'kanji' THEN k.kun_yomi
      END AS reading
    FROM weak_items w
    LEFT JOIN vocabulary v ON w.content_type = 'vocabulary' AND w.content_id = v.id
    LEFT JOIN kanji k ON w.content_type = 'kanji' AND w.content_id = k.id
    LEFT JOIN grammar g ON w.content_type = 'grammar' AND w.content_id = g.id
    ORDER BY w.wrong_count DESC, w.last_wrong_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json(weakItems);
}
