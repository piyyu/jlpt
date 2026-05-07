import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT k.*,
      CASE WHEN us.content_id IS NOT NULL THEN 1 ELSE 0 END AS is_selected
    FROM kanji k
    LEFT JOIN user_selections us
      ON us.content_type = 'kanji' AND us.content_id = k.id
    ORDER BY k.id
  `).all();
  return NextResponse.json(rows);
}
