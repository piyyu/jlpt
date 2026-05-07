import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Cards due today
  const dueToday = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE next_review_date <= ?"
  ).get(today).count;

  // Cards reviewed today
  const reviewedToday = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE date(last_reviewed_at) = ?"
  ).get(today).count;

  // Total cards (vocab + kanji)
  const totalVocab = db.prepare('SELECT COUNT(*) as count FROM vocabulary').get().count;
  const totalKanji = db.prepare('SELECT COUNT(*) as count FROM kanji').get().count;

  // Mastered cards (interval >= 21 days)
  const masteredVocab = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE content_type='vocabulary' AND interval_days >= 21"
  ).get().count;
  const masteredKanji = db.prepare(
    "SELECT COUNT(*) as count FROM srs_cards WHERE content_type='kanji' AND interval_days >= 21"
  ).get().count;

  // Study streak (consecutive days with study_sessions)
  const sessions = db.prepare(
    "SELECT DISTINCT date(created_at) as day FROM study_sessions ORDER BY day DESC LIMIT 30"
  ).all();

  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < sessions.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (sessions[i]?.day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  // Time studied this week (minutes)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const timeStudied = db.prepare(
    "SELECT SUM(duration_minutes) as total FROM study_sessions WHERE date(created_at) >= ?"
  ).get(weekAgoStr).total || 0;

  // Quiz stats
  const quizSessions = db.prepare('SELECT * FROM quiz_sessions ORDER BY created_at DESC LIMIT 5').all();
  const lastMockTest = db.prepare('SELECT * FROM mock_test_results ORDER BY taken_at DESC LIMIT 1').get();

  // Per-type due counts for the dashboard rings
  const dueCounts = db.prepare(`
    SELECT content_type, COUNT(*) as due
    FROM srs_cards WHERE next_review_date <= ?
    GROUP BY content_type
  `).all(today);
  const counts = Object.fromEntries(dueCounts.map((r) => [r.content_type, r.due]));

  // Use selected items count for the progress rings instead of mastered
  const selectedVocab = db.prepare(
    "SELECT COUNT(*) as count FROM user_selections WHERE content_type='vocabulary'"
  ).get().count;
  const selectedKanji = db.prepare(
    "SELECT COUNT(*) as count FROM user_selections WHERE content_type='kanji'"
  ).get().count;

  return NextResponse.json({
    streak,
    dueToday,
    reviewedToday,
    timeStudiedMinutes: Math.round(timeStudied),
    progress: {
      vocabulary: { total: totalVocab, mastered: selectedVocab },
      kanji: { total: totalKanji, mastered: selectedKanji },
    },
    counts,
    recentQuizzes: quizSessions,
    lastMockTest,
  });
}
