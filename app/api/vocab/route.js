import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type     = searchParams.get('type')     || '';
  const category = searchParams.get('category') || '';

  let query = `
    SELECT v.*,
      CASE WHEN us.content_id IS NOT NULL THEN 1 ELSE 0 END AS is_selected
    FROM vocabulary v
    LEFT JOIN user_selections us
      ON us.content_type = 'vocabulary' AND us.content_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (v.japanese LIKE ? OR v.reading LIKE ? OR v.english LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (type) {
    query += ' AND v.type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND v.category = ?';
    params.push(category);
  }
  query += ' ORDER BY v.importance ASC, v.id ASC';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}
