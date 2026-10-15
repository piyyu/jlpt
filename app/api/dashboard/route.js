import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { todayLocal, addDaysLocal } from '@/lib/date';

const MASTERED_INTERVAL = 21;

function getDailyGoals(db) {
  const goals = { vocabulary: 50, kanji: 20, grammar: 10 };
  try {
    const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?)').all('daily_goal_vocab', 'daily_goal_kanji', 'daily_goal_grammar', 'daily_goal');
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
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

export function GET() {
  const db = getDb();
  const today = todayLocal();
  const dailyGoals = getDailyGoals(db);

  // Cards due today
  const dueToday = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE next_review_date <= ?"
  ).get(today).count;

  // Cards reviewed today
  const reviewedToday = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE date(last_reviewed_at) = ?"
  ).get(today).count;

  // Total cards (vocab + kanji + grammar)
  const totalVocab = db.prepare('SELECT COUNT(*) as count FROM vocabulary').get().count;
  const totalKanji = db.prepare('SELECT COUNT(*) as count FROM kanji').get().count;
  const totalGrammar = db.prepare('SELECT COUNT(*) as count FROM grammar_points').get().count;

  // Mastered cards (interval >= 21 days AND at least 3 successful reps)
  const masteredVocab = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE content_type='vocabulary' AND interval_days >= ? AND repetitions >= 3"
  ).get(MASTERED_INTERVAL).count;
  const masteredKanji = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE content_type='kanji' AND interval_days >= ? AND repetitions >= 3"
  ).get(MASTERED_INTERVAL).count;
  const masteredGrammar = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE content_type='grammar' AND interval_days >= ? AND repetitions >= 3"
  ).get(MASTERED_INTERVAL).count;

  // Selected counts (custom deck size)
  const selectedVocab = db.prepare(
    "SELECT COUNT(*) as count FROM user_selections WHERE content_type='vocabulary'"
  ).get().count;
  const selectedKanji = db.prepare(
    "SELECT COUNT(*) as count FROM user_selections WHERE content_type='kanji'"
  ).get().count;
  const selectedGrammar = db.prepare(
    "SELECT COUNT(*) as count FROM user_selections WHERE content_type='grammar'"
  ).get().count;

  // Study streak (consecutive days with study_sessions, local calendar days)
  const sessions = db.prepare(
    "SELECT DISTINCT date(created_at,'localtime') as day FROM study_sessions ORDER BY day DESC LIMIT 30"
  ).all();

  let streak = 0;
  for (let i = 0; i < sessions.length; i++) {
    const expectedStr = addDaysLocal(-i);
    if (sessions[i]?.day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  // Time studied this week (minutes)
  const weekAgoStr = addDaysLocal(-7);
  const timeStudied = db.prepare(
    "SELECT SUM(duration_minutes) as total FROM study_sessions WHERE date(created_at,'localtime') >= ?"
  ).get(weekAgoStr).total || 0;

  // Quiz stats
  const quizSessions = db.prepare('SELECT * FROM quiz_sessions ORDER BY created_at DESC LIMIT 5').all();

  // Per-type due counts for the dashboard rings
  const dueCounts = db.prepare(`
    SELECT content_type, COUNT(*) as due
    FROM srs_cards WHERE next_review_date <= ?
    GROUP BY content_type
  `).all(today);
  const counts = Object.fromEntries(dueCounts.map((r) => [r.content_type, r.due]));

  return NextResponse.json({
    streak,
    dueToday,
    reviewedToday,
    timeStudiedMinutes: Math.round(timeStudied),
    dailyGoal: dailyGoals,
    dailyGoals,
    masteredInterval: MASTERED_INTERVAL,
    progress: {
      vocabulary: { total: totalVocab, mastered: masteredVocab, selected: selectedVocab },
      kanji: { total: totalKanji, mastered: masteredKanji, selected: selectedKanji },
      grammar: { total: totalGrammar, mastered: masteredGrammar, selected: selectedGrammar },
    },
    counts,
    recentQuizzes: quizSessions,
  });
}
