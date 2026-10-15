import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  let query = `
    SELECT g.*,
      CASE WHEN us.content_id IS NOT NULL THEN 1 ELSE 0 END AS is_selected,
      s.next_review_date
    FROM grammar_points g
    LEFT JOIN user_selections us
      ON us.content_type = 'grammar' AND us.content_id = g.id
    LEFT JOIN srs_cards s
      ON s.content_type = 'grammar' AND s.content_id = g.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (g.pattern LIKE ? OR g.meaning LIKE ? OR g.structure LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (category) {
    query += ' AND g.category = ?';
    params.push(category);
  }
  query += ' ORDER BY g.sort_order ASC, g.id ASC';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}
