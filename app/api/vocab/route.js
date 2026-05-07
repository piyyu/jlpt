import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';

  let query = 'SELECT * FROM vocabulary WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (japanese LIKE ? OR reading LIKE ? OR english LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  query += ' ORDER BY id';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}
