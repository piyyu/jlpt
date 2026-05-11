import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'vocabulary' | 'kanji'

  // Check if the user has any selections for this type (or overall)
  const selectionCountQuery = type
    ? `SELECT COUNT(*) as n FROM user_selections WHERE content_type = '${type}'`
    : `SELECT COUNT(*) as n FROM user_selections`;
  const { n: selectionCount } = db.prepare(selectionCountQuery).get();

  // SRS filter logic — ALWAYS filter by due date
  const whereClauses = ['s.next_review_date <= ?'];
  const whereParams = [today];

  // If user has selections, only review those.
  if (selectionCount > 0) {
    whereClauses.push(`EXISTS (
        SELECT 1 FROM user_selections us2
        WHERE us2.content_type = s.content_type AND us2.content_id = s.content_id
      )`);
  }
  
  if (type) {
    whereClauses.push(`s.content_type = ?`);
    whereParams.push(type);
  }
  const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

  // Separate limits: 50 cards per category per day
  const vocabToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions 
    WHERE date(created_at) = date('now') AND (section = 'review:vocabulary' OR section = 'review')
  `).get()?.total || 0;

  const kanjiToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions 
    WHERE date(created_at) = date('now') AND section = 'review:kanji'
  `).get()?.total || 0;

  const vocabRemaining = Math.max(0, 50 - vocabToday);
  const kanjiRemaining = Math.max(0, 50 - kanjiToday);

  // If specific type requested, check its limit
  if (type) {
    const limitRemaining = type === 'kanji' ? kanjiRemaining : vocabRemaining;
    if (limitRemaining === 0) {
      return NextResponse.json({
        cards: [],
        count: 0,
        date: today,
        counts: {},
        available: {},
        limits: { vocabulary: vocabRemaining, kanji: kanjiRemaining },
        limitReached: true
      });
    }
  }

  // Calculate counts for Category Picker (Filtered by Selection if active)
  const dueCounts = { vocabulary: 0, kanji: 0 };
  const countsQueryStr = `
    SELECT s.content_type, COUNT(*) as n
    FROM srs_cards s
    ${whereStr.replace(/s\.content_type = \?/, '1=1')}
    GROUP BY s.content_type
  `;
  const allDueRows = db.prepare(countsQueryStr).all(...whereParams.filter((_, i) => i === 0));
  allDueRows.forEach(r => dueCounts[r.content_type] = r.n);

  const availableCounts = {
    vocabulary: Math.min(dueCounts.vocabulary, vocabRemaining),
    kanji: Math.min(dueCounts.kanji, kanjiRemaining)
  };

  // Drills fetch cards if type is provided
  let cards = [];
  if (type) {
    const limitForFetch = type === 'kanji' ? kanjiRemaining : vocabRemaining;
    const drillQueryStr = `
      SELECT sub.*,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.japanese
          WHEN 'kanji' THEN k.character
        END AS front,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.english
          WHEN 'kanji' THEN k.meaning
        END AS back,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.reading
          WHEN 'kanji' THEN
            TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, ''))
        END AS drill_answer,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.reading
          WHEN 'kanji'      THEN k.kun_yomi
        END AS reading,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.example_jp
          WHEN 'kanji' THEN k.example_word1
        END AS hint,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.example_en
          WHEN 'kanji' THEN k.example_word2
        END AS hint2,
        CASE sub.content_type
          WHEN 'vocabulary' THEN NULL
          WHEN 'kanji' THEN k.on_yomi
        END AS on_yomi,
        CASE sub.content_type
          WHEN 'vocabulary' THEN NULL
          WHEN 'kanji' THEN k.stroke_count
        END AS stroke_count,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.type
          WHEN 'kanji' THEN NULL
        END AS word_type,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.example_jp
          WHEN 'kanji' THEN NULL
        END AS example_jp,
        CASE sub.content_type
          WHEN 'vocabulary' THEN v.example_en
          WHEN 'kanji' THEN NULL
        END AS example_en,
        CASE sub.content_type
          WHEN 'vocabulary' THEN NULL
          WHEN 'kanji' THEN k.example_word1
        END AS example_word1,
        CASE sub.content_type
          WHEN 'vocabulary' THEN NULL
          WHEN 'kanji' THEN k.example_word2
        END AS example_word2
      FROM (
        SELECT s.*, (ABS(RANDOM()) % 2) as rnd
        FROM srs_cards s
        ${whereStr}
        ORDER BY s.next_review_date ASC
        LIMIT ?
      ) sub
      LEFT JOIN vocabulary v ON sub.content_type = 'vocabulary' AND sub.content_id = v.id
      LEFT JOIN kanji k ON sub.content_type = 'kanji' AND sub.content_id = k.id
    `;
    cards = db.prepare(drillQueryStr).all(...whereParams, limitForFetch);
  }

  // Distractor pools
  const vocabReadingPool = db.prepare(`SELECT reading AS answer FROM vocabulary WHERE reading IS NOT NULL AND reading != '' ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer);
  const vocabEnglishPool = db.prepare(`SELECT english AS answer FROM vocabulary WHERE english IS NOT NULL AND english != '' ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer);
  const kanjiPool = db.prepare(`SELECT TRIM(COALESCE(kun_yomi, '') || CASE WHEN kun_yomi IS NOT NULL AND kun_yomi != '' AND on_yomi IS NOT NULL AND on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(on_yomi, '')) AS answer FROM kanji ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);

  return NextResponse.json({
    cards,
    count: cards.length,
    date: today,
    counts: dueCounts,
    available: availableCounts,
    limits: { vocabulary: vocabRemaining, kanji: kanjiRemaining },
    pools: { 
      vocabulary_reading: vocabReadingPool, 
      vocabulary_english: vocabEnglishPool, 
      kanji: kanjiPool 
    },
    selectionActive: selectionCount > 0,
    selectionCount
  });
}
