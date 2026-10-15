import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { sm2, qualityFromLabel } from '@/lib/sm2';

const LEECH_THRESHOLD = 8;

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { cardId, label, was_correct_mcq = null } = body; // label: 'again' | 'hard' | 'good' | 'easy'
  // was_correct_mcq: client MCQ result (true/false/null if unknown). Used to
  // enforce SRS integrity: a wrong MCQ answer must be graded Again.

  if (!cardId || !label) {
    return NextResponse.json({ error: 'cardId and label required' }, { status: 400 });
  }

  const card = db.prepare('SELECT * FROM srs_cards WHERE id = ?').get(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Integrity guard: never allow Hard/Good/Easy on a failed MCQ.
  let effectiveLabel = label;
  let forcedAgain = false;
  if (was_correct_mcq === false && label !== 'again') {
    effectiveLabel = 'again';
    forcedAgain = true;
  }

  const quality = qualityFromLabel(effectiveLabel);
  const result = sm2({
    easeFactor: card.ease_factor,
    interval: card.interval_days,
    repetitions: card.repetitions,
    quality,
  });

  const wasCorrect = quality >= 3 ? 1 : 0;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE srs_cards SET
      ease_factor = ?,
      interval_days = ?,
      repetitions = ?,
      next_review_date = ?,
      times_correct = times_correct + ?,
      times_wrong = times_wrong + ?,
      last_reviewed_at = ?
    WHERE id = ?
  `).run(
    result.easeFactor,
    result.interval,
    result.repetitions,
    result.nextReviewDate,
    wasCorrect,
    wasCorrect ? 0 : 1,
    now,
    cardId
  );

  let isLeech = false;
  // Update weak_items if wrong, clear it when recalled correctly
  if (!wasCorrect) {
    const row = db.prepare(`
      INSERT INTO weak_items (content_type, content_id, wrong_count, last_wrong_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(content_type, content_id)
      DO UPDATE SET wrong_count = wrong_count + 1, last_wrong_at = excluded.last_wrong_at
      RETURNING wrong_count
    `).get(card.content_type, card.content_id, now);
    isLeech = (row?.wrong_count ?? 1) >= LEECH_THRESHOLD;
  } else {
    // Forgive: a correct recall removes the card from weak list so the
    // Weak Points page stays actionable instead of growing forever.
    db.prepare(
      'DELETE FROM weak_items WHERE content_type = ? AND content_id = ?'
    ).run(card.content_type, card.content_id);
  }

  // Log study session card
  db.prepare(`
    INSERT INTO study_sessions (section, duration_minutes, cards_reviewed)
    VALUES (?, 0, 1)
  `).run(`review:${card.content_type}`);

  return NextResponse.json({
    success: true,
    nextReviewDate: result.nextReviewDate,
    interval: result.interval,
    easeFactor: result.easeFactor,
    forcedAgain,
    isLeech,
  });
}
