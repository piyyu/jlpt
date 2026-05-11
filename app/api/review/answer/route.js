import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { sm2, qualityFromLabel } from '@/lib/sm2';

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const { cardId, label } = body; // label: 'again' | 'hard' | 'good' | 'easy'

  if (!cardId || !label) {
    return NextResponse.json({ error: 'cardId and label required' }, { status: 400 });
  }

  const card = db.prepare('SELECT * FROM srs_cards WHERE id = ?').get(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const quality = qualityFromLabel(label);
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

  // Update weak_items if wrong
  if (!wasCorrect) {
    db.prepare(`
      INSERT INTO weak_items (content_type, content_id, wrong_count, last_wrong_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(content_type, content_id)
      DO UPDATE SET wrong_count = wrong_count + 1, last_wrong_at = excluded.last_wrong_at
    `).run(card.content_type, card.content_id, now);
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
  });
}
