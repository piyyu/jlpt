import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

function firstReading(yomi) {
  if (!yomi) return null;
  return yomi.split(/[・、/\s]/)[0].trim() || null;
}

export function GET(request) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'vocabulary' | 'kanji' | null = all

  // Check if the user has any selections for this type (or overall)
  const selectionCountQuery = type
    ? `SELECT COUNT(*) as n FROM user_selections WHERE content_type = '${type}'`
    : `SELECT COUNT(*) as n FROM user_selections`;
  const { n: selectionCount } = db.prepare(selectionCountQuery).get();

  // Always filter by due date (like Anki).
  // If user has selections, it acts as a "custom deck" filter.
  const whereClauses = [];
  whereClauses.push('s.next_review_date <= ?');

  if (selectionCount > 0) {
    whereClauses.push(`EXISTS (
        SELECT 1 FROM user_selections us2
        WHERE us2.content_type = s.content_type AND us2.content_id = s.content_id
      )`);
  }
  if (type) {
    whereClauses.push(`s.content_type = '${type}'`);
  }
  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Main cards query — pull ALL columns from vocabulary/kanji for the details panel
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
        WHEN 'kanji' THEN
          TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, ''))
      END AS drill_answer,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.reading
        WHEN 'kanji'      THEN k.kun_yomi
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
      END AS stroke_count,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.type
        WHEN 'kanji' THEN NULL
      END AS word_type,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.example_jp
        WHEN 'kanji' THEN NULL
      END AS example_jp,
      CASE s.content_type
        WHEN 'vocabulary' THEN v.example_en
        WHEN 'kanji' THEN NULL
      END AS example_en,
      CASE s.content_type
        WHEN 'vocabulary' THEN NULL
        WHEN 'kanji' THEN k.example_word1
      END AS example_word1,
      CASE s.content_type
        WHEN 'vocabulary' THEN NULL
        WHEN 'kanji' THEN k.example_word2
      END AS example_word2
    FROM srs_cards s
    LEFT JOIN vocabulary v ON s.content_type = 'vocabulary' AND s.content_id = v.id
    LEFT JOIN kanji k ON s.content_type = 'kanji' AND s.content_id = k.id
    ${whereStr}
    ORDER BY s.next_review_date ASC
    LIMIT 50
  `;

  const cards = db.prepare(queryStr).all(today);

  // Distractor pools: vocab → readings, kanji → first kun/on reading
  const vocabPoolQuery = selectionCount > 0
    ? `SELECT v.reading AS answer FROM vocabulary v
       INNER JOIN user_selections us ON us.content_type = 'vocabulary' AND us.content_id = v.id
       WHERE v.reading IS NOT NULL AND v.reading != ''
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT reading AS answer FROM vocabulary WHERE reading IS NOT NULL AND reading != '' ORDER BY RANDOM() LIMIT 40`;

  const kanjiPoolQuery = selectionCount > 0
    ? `SELECT TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, '')) AS answer FROM kanji k
       INNER JOIN user_selections us ON us.content_type = 'kanji' AND us.content_id = k.id
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT TRIM(COALESCE(kun_yomi, '') || CASE WHEN kun_yomi IS NOT NULL AND kun_yomi != '' AND on_yomi IS NOT NULL AND on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(on_yomi, '')) AS answer FROM kanji ORDER BY RANDOM() LIMIT 40`;

  const vocabPool = db.prepare(vocabPoolQuery).all().map((r) => r.answer);
  const kanjiPool = db.prepare(kanjiPoolQuery).all().map((r) => r.answer).filter(Boolean);

  // Due counts
  const countsQuery = `
    SELECT s.content_type, COUNT(*) as due
    FROM srs_cards s
    ${whereStr}
    GROUP BY s.content_type
  `;
  const counts = db.prepare(countsQuery).all(today);

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
