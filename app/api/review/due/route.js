import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { todayLocal } from '@/lib/date';

const MASTERED_INTERVAL = 21;
const LEECH_THRESHOLD = 8;

function getDailyGoals(db) {
  const goals = { vocabulary: 50, kanji: 20, grammar: 10 };
  try {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?)').all('daily_goal_vocab', 'daily_goal_kanji', 'daily_goal_grammar', 'daily_goal');
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    // Per-type goals take precedence; fall back to legacy single daily_goal.
    const legacy = parseInt(map.daily_goal, 10);
    const v = parseInt(map.daily_goal_vocab, 10);
    const k = parseInt(map.daily_goal_kanji, 10);
    const g = parseInt(map.daily_goal_grammar, 10);
    goals.vocabulary = Number.isFinite(v) && v > 0 ? Math.min(v, 200) : (Number.isFinite(legacy) && legacy > 0 ? Math.min(legacy, 200) : 50);
    goals.kanji = Number.isFinite(k) && k > 0 ? Math.min(k, 200) : (Number.isFinite(legacy) && legacy > 0 ? Math.min(legacy, 200) : 20);
    goals.grammar = Number.isFinite(g) && g > 0 ? Math.min(g, 200) : 10;
  } catch {
    // defaults above
  }
  return goals;
}

export function GET(request) {
  const db = getDb();
  const today = todayLocal();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'vocabulary' | 'kanji' | 'grammar' | null = vocab+kanji mixed
  const mode = searchParams.get('mode') || 'recognition'; // recognition | production | listening | mixed
  const source = searchParams.get('source'); // null | 'weak' = only weak_items

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

  // Weak-only drill: restrict to items in weak_items (actionable weak points)
  if (source === 'weak') {
    whereClauses.push(`EXISTS (
        SELECT 1 FROM weak_items w
        WHERE w.content_type = s.content_type AND w.content_id = s.content_id
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

  // Daily limits per type (already-reviewed-today counts toward the goal)
  const dailyGoals = getDailyGoals(db);
  const kanjiReviewedToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions WHERE date(created_at,'localtime') = date('now','localtime') AND section = 'review:kanji'
  `).get()?.total || 0;
  const vocabReviewedToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions WHERE date(created_at,'localtime') = date('now','localtime') AND section = 'review:vocabulary'
  `).get()?.total || 0;
  const grammarReviewedToday = db.prepare(`
    SELECT sum(cards_reviewed) as total FROM study_sessions WHERE date(created_at,'localtime') = date('now','localtime') AND section = 'review:grammar'
  `).get()?.total || 0;

  const limits = {
    kanji: Math.max(0, dailyGoals.kanji - kanjiReviewedToday),
    vocabulary: Math.max(0, dailyGoals.vocabulary - vocabReviewedToday),
    grammar: Math.max(0, dailyGoals.grammar - grammarReviewedToday),
  };

  // Helper to build the main card query for a specific type and limit.
  // Prioritise most-overdue + most-wrong first (desirable difficulty),
  // instead of pure RANDOM(). Keeps interleaving via mixed shuffle below.
  const buildQuery = (ctype, limit) => {
    if (limit <= 0) return null;
    let where = whereStrBase + ` AND s.content_type = '${ctype}'`;
    return `
      SELECT s.*,
        CAST(julianday(date('now','localtime')) - julianday(s.next_review_date) AS INTEGER) AS overdue_days,
        COALESCE(w.wrong_count, 0) AS weak_count,
        CASE WHEN COALESCE(w.wrong_count, 0) >= ${LEECH_THRESHOLD} THEN 1 ELSE 0 END AS is_leech,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.japanese
          WHEN 'kanji' THEN k.character
          WHEN 'grammar' THEN g.pattern
        END AS front,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.meaning
          WHEN 'kanji' THEN k.meaning
          WHEN 'grammar' THEN g.meaning
        END AS back,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.reading
          WHEN 'grammar' THEN g.pattern
          WHEN 'kanji' THEN
            TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, ''))
        END AS drill_answer,
        -- Production direction: JP -> EN (vocab) / char -> meaning (kanji) / pattern -> meaning (grammar)
        CASE s.content_type
          WHEN 'vocabulary' THEN v.japanese
          WHEN 'kanji' THEN k.character
          WHEN 'grammar' THEN g.pattern
        END AS prod_prompt,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.meaning
          WHEN 'kanji' THEN k.meaning
          WHEN 'grammar' THEN g.meaning
        END AS prod_answer,
        -- Listening: audio source text (hide written prompt client-side)
        CASE s.content_type
          WHEN 'vocabulary' THEN v.japanese
          WHEN 'kanji' THEN k.example_word1
          WHEN 'grammar' THEN g.example_jp
        END AS listen_audio,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.reading
          WHEN 'kanji'      THEN k.kun_yomi
        END AS reading,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.example_jp
          WHEN 'kanji' THEN k.example_word1
          WHEN 'grammar' THEN g.example_jp
        END AS hint,
        CASE s.content_type
          WHEN 'vocabulary' THEN v.example_en
          WHEN 'kanji' THEN k.example_word2
          WHEN 'grammar' THEN g.example_en
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
          WHEN 'grammar' THEN g.structure
          ELSE NULL
        END AS structure,
        CASE s.content_type
          WHEN 'grammar' THEN g.source_url
          ELSE NULL
        END AS source_url,
        CASE s.content_type
          WHEN 'grammar' THEN g.example_romaji
          ELSE NULL
        END AS example_romaji,
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
      LEFT JOIN grammar_points g ON s.content_type = 'grammar' AND s.content_id = g.id
      LEFT JOIN weak_items w ON w.content_type = s.content_type AND w.content_id = s.content_id
      ${where}
      ORDER BY overdue_days DESC, s.times_wrong DESC, RANDOM()
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
  } else if (type === 'grammar') {
    const q = buildQuery('grammar', limits.grammar);
    if (q) cards = db.prepare(q).all(...queryParams);
  } else {
    // Mixed: Pull from both, respecting individual limits, then interleave
    const qv = buildQuery('vocabulary', limits.vocabulary);
    const qk = buildQuery('kanji', limits.kanji);
    if (qv) cards.push(...db.prepare(qv).all(...queryParams));
    if (qk) cards.push(...db.prepare(qk).all(...queryParams));
    // Shuffle the mixed results for interleaving (Fisher-Yates)
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  // Distractor pools for all modes (recognition + production + listening)
  const selJoin = (alias, ctype) =>
    selectionCount > 0
      ? `INNER JOIN user_selections us ON us.content_type = '${ctype}' AND us.content_id = ${alias}.id`
      : '';
  const vocabPoolBase = `FROM vocabulary v ${selJoin('v', 'vocabulary')}`;
  const kanjiPoolBase = `FROM kanji k ${selJoin('k', 'kanji')}`;

  const vocabReading = db.prepare(`SELECT v.reading AS answer ${vocabPoolBase} ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);
  const vocabEnglish = db.prepare(`SELECT v.meaning AS answer ${vocabPoolBase} ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);
  const kanjiReading = db.prepare(`SELECT TRIM(COALESCE(k.kun_yomi, '') || CASE WHEN k.kun_yomi IS NOT NULL AND k.kun_yomi != '' AND k.on_yomi IS NOT NULL AND k.on_yomi != '' THEN ' / ' ELSE '' END || COALESCE(k.on_yomi, '')) AS answer ${kanjiPoolBase} ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);
  const kanjiMeaning = db.prepare(`SELECT k.meaning AS answer ${kanjiPoolBase} ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);
  const grammarPattern = db.prepare(`SELECT g.pattern AS answer FROM grammar_points g ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);
  const grammarMeaning = db.prepare(`SELECT g.meaning AS answer FROM grammar_points g ORDER BY RANDOM() LIMIT 40`).all().map((r) => r.answer).filter(Boolean);

  return NextResponse.json({
    cards,
    count: cards.length,
    date: today,
    counts: availableCounts,
    available: availableCounts,
    limits,
    dailyGoal: dailyGoals,
    dailyGoals,
    mode,
    source: source || null,
    pools: {
      vocabulary: vocabReading, // backwards-compat: recognition pool
      kanji: kanjiReading,
      vocabReading,
      vocabEnglish,
      kanjiReading,
      kanjiMeaning,
      grammarPattern,
      grammarMeaning,
    },
    selectionActive: selectionCount > 0,
    selectionCount,
    masteredInterval: MASTERED_INTERVAL,
    leechThreshold: LEECH_THRESHOLD,
  });
}
