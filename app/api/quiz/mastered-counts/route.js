import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const vocab = db
    .prepare(
      'SELECT COUNT(*) as n FROM srs_cards WHERE content_type = ? AND interval_days >= 21 AND repetitions >= 3'
    )
    .get('vocabulary')?.n ?? 0;
  const kanji = db
    .prepare(
      'SELECT COUNT(*) as n FROM srs_cards WHERE content_type = ? AND interval_days >= 21 AND repetitions >= 3'
    )
    .get('kanji')?.n ?? 0;
  return NextResponse.json({ vocabulary: vocab, kanji });
}
