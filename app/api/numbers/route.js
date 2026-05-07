import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';

  let query = 'SELECT * FROM numbers_drills WHERE 1=1';
  const params = [];
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' ORDER BY id';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}
