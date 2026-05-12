import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'vocabulary' | 'kanji' | null = all

  // Check if the user has any selections
  const selectionCountQuery = type
    ? 'SELECT COUNT(*) as n FROM user_selections WHERE content_type = ?'
    : 'SELECT COUNT(*) as n FROM user_selections';
  const { n: selectionCount } = type 
    ? db.prepare(selectionCountQuery).get(type)
    : db.prepare(selectionCountQuery).get();

  const whereClauses = ['s.next_review_date <= ?'];
  const queryParams = [today];

  if (selectionCount > 0) {
    whereClauses.push(`EXISTS (
        SELECT 1 FROM user_selections us2
        WHERE us2.content_type = s.content_type AND us2.content_id = s.content_id
      )`);
  }
  
  const whereStrBase = `WHERE ${whereClauses.join(' AND ')}`;

  // Available counts per type
  const availableCounts = Object.fromEntries(db.prepare(`
    SELECT content_type, COUNT(*) as due
    FROM srs_cards s
    ${whereStrBase}
    GROUP BY content_type
  `).all(...queryParams).map((r) => [r.content_type, r.due]));

  // Daily limits (50 per type)
  const kanjiReviewedToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions WHERE date(created_at) = date('now') AND section = 'review:kanji'
  `).get()?.total || 0;
  const vocabReviewedToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions WHERE date(created_at) = date('now') AND section = 'review:vocabulary'
  `).get()?.total || 0;

  const limits = {
    kanji: Math.max(0, 50 - kanjiReviewedToday),
    vocabulary: Math.max(0, 50 - vocabReviewedToday)
  };

  // Helper to build the main card query for a specific type and limit
  const buildQuery = (ctype, limit) => {
    if (limit <= 0) return null;
    let where = whereStrBase + ` AND s.content_type = '${ctype}'`;
    return `
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
          WHEN 'vocabulary' THEN v.romaji
          WHEN 'kanji' THEN NULL
        END AS romaji,
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
      ${where}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  };

  let cards = [];
  if (type === 'vocabulary') {
    const q = buildQuery('vocabulary', limits.vocabulary);
    if (q) cards = db.prepare(q).all(...queryParams);
  } else if (type === 'kanji') {
    const q = buildQuery('kanji', limits.kanji);
    if (q) cards = db.prepare(q).all(...queryParams);
  } else {
    // Mixed: Pull from both, respecting individual limits
    const qv = buildQuery('vocabulary', limits.vocabulary);
    const qk = buildQuery('kanji', limits.kanji);
    if (qv) cards.push(...db.prepare(qv).all(...queryParams));
    if (qk) cards.push(...db.prepare(qk).all(...queryParams));
    // Shuffle the mixed results
    cards.sort(() => Math.random() - 0.5);
  }

  // Distractor pools
  const vocabPoolQuery = selectionCount > 0
    ? `SELECT v.reading AS answer FROM vocabulary v
       INNER JOIN user_selections us ON us.content_type = 'vocabulary' AND us.content_id = v.id
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT reading AS answer FROM vocabulary ORDER BY RANDOM() LIMIT 40`;

  const kanjiPoolQuery = selectionCount > 0
    ? `SELECT TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, '')) AS answer FROM kanji k
       INNER JOIN user_selections us ON us.content_type = 'kanji' AND us.content_id = k.id
       ORDER BY RANDOM() LIMIT 40`
    : `SELECT TRIM(COALESCE(kun_yomi, '') || CASE WHEN kun_yomi IS NOT NULL AND kun_yomi != '' AND on_yomi IS NOT NULL AND on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(on_yomi, '')) AS answer FROM kanji ORDER BY RANDOM() LIMIT 40`;

  const vocabPool = db.prepare(vocabPoolQuery).all().map((r) => r.answer).filter(Boolean);
  const kanjiPool = db.prepare(kanjiPoolQuery).all().map((r) => r.answer).filter(Boolean);

  return NextResponse.json({
    cards,
    count: cards.length,
    date: today,
    counts: availableCounts,
    available: availableCounts,
    limits,
    pools: { vocabulary: vocabPool, kanji: kanjiPool },
    selectionActive: selectionCount > 0,
    selectionCount,
  });
}
