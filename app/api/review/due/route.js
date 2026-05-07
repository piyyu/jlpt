import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'vocabulary' | 'kanji' | null = all

  const typeFilter = type ? `AND s.content_type = '${type}'` : '';

  // Check if the user has any selections for this type (or overall)
  const selectionCountQuery = type
    ? `SELECT COUNT(*) as n FROM user_selections WHERE content_type = '${type}'`
    : `SELECT COUNT(*) as n FROM user_selections`;
  const { n: selectionCount } = db.prepare(selectionCountQuery).get();

  // If user has made selections, filter to only those and IGNORE due dates. Otherwise show all due cards.
  const whereClauses = [];
  if (selectionCount === 0) {
    whereClauses.push("s.next_review_date <= ?");
  } else {
    whereClauses.push(`EXISTS (
        SELECT 1 FROM user_selections us2
        WHERE us2.content_type = s.content_type AND us2.content_id = s.content_id
      )`);
  }
  if (type) {
    whereClauses.push(`s.content_type = '${type}'`);
  }
  
  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const queryStr = `
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
      END AS hint,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.example_en
        WHEN 'kanji' THEN k.example_word2
      END AS hint2,
      CASE s.content_type
        WHEN 'vocabulary' THEN NULL
        WHEN 'kanji' THEN k.on_yomi
      END AS on_yomi,
      CASE s.content_type
        WHEN 'vocabulary' THEN NULL
        WHEN 'kanji' THEN k.stroke_count
      END AS stroke_count
    FROM srs_cards s
    LEFT JOIN vocabulary v ON s.content_type = 'vocabulary' AND s.content_id = v.id
    LEFT JOIN kanji k ON s.content_type = 'kanji' AND s.content_id = k.id
    ${whereStr}
    ORDER BY s.next_review_date ASC
    LIMIT 50
  `;

  const cards = selectionCount === 0 ? db.prepare(queryStr).all(today) : db.prepare(queryStr).all();

  // Pool of answers for distractors (filtered to selections if active)
  const vocabPoolQuery = selectionCount > 0
    ? `SELECT v.english AS answer FROM vocabulary v
       INNER JOIN user_selections us ON us.content_type = 'vocabulary' AND us.content_id = v.id
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT english AS answer FROM vocabulary ORDER BY RANDOM() LIMIT 40`;

  const kanjiPoolQuery = selectionCount > 0
    ? `SELECT k.meaning AS answer FROM kanji k
       INNER JOIN user_selections us ON us.content_type = 'kanji' AND us.content_id = k.id
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT meaning AS answer FROM kanji ORDER BY RANDOM() LIMIT 40`;

  const vocabPool = db.prepare(vocabPoolQuery).all().map((r) => r.answer);
  const kanjiPool = db.prepare(kanjiPoolQuery).all().map((r) => r.answer);

  // Per-type due counts (respecting selections)
  // Per-type due counts (respecting selections)
  const countWhereStr = whereStr; // Reuse the exact same WHERE clause from above, which already handles date/selections

  const countsQuery = `
    SELECT s.content_type, COUNT(*) as due
    FROM srs_cards s
    ${countWhereStr}
    GROUP BY s.content_type
  `;
  
  const counts = selectionCount === 0 
    ? db.prepare(countsQuery).all(today)
    : db.prepare(countsQuery).all();

  return NextResponse.json({
    cards,
    count: cards.length,
    date: today,
    counts: Object.fromEntries(counts.map((r) => [r.content_type, r.due])),
    pools: { vocabulary: vocabPool, kanji: kanjiPool },
    selectionActive: selectionCount > 0,
    selectionCount,
  });
}
