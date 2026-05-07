import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM reading_passages ORDER BY id').all();
  return NextResponse.json(rows);
}
