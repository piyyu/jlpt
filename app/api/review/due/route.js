import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Get all cards due today or overdue
  const cards = db.prepare(`
    SELECT s.*, 
      CASE s.content_type
        WHEN 'vocabulary' THEN v.japanese
        WHEN 'kanji' THEN k.character
      END AS front,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.english
        WHEN 'kanji' THEN k.meaning
      END AS back,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.reading
        WHEN 'kanji' THEN k.kun_yomi
      END AS reading,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.example_jp
        WHEN 'kanji' THEN k.example_word1
      END AS hint
    FROM srs_cards s
    LEFT JOIN vocabulary v ON s.content_type = 'vocabulary' AND s.content_id = v.id
    LEFT JOIN kanji k ON s.content_type = 'kanji' AND s.content_id = k.id
    WHERE s.next_review_date <= ?
    ORDER BY s.next_review_date ASC
    LIMIT 50
  `).all(today);

  return NextResponse.json({ cards, count: cards.length, date: today });
}
