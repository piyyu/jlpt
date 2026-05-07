import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET /api/selections — returns all selected IDs grouped by type
// GET /api/selections?type=vocabulary — returns selected IDs for one type
export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  let rows;
  if (type) {
    rows = db.prepare(
      `SELECT content_id FROM user_selections WHERE content_type = ?`
    ).all(type);
    return NextResponse.json(rows.map((r) => r.content_id));
  }

  rows = db.prepare(`SELECT content_type, content_id FROM user_selections`).all();
  const result = {};
  for (const row of rows) {
    if (!result[row.content_type]) result[row.content_type] = [];
    result[row.content_type].push(row.content_id);
  }
  return NextResponse.json(result);
}

// POST /api/selections — toggle or set selection
// Body: { content_type: 'vocabulary'|'kanji', content_id: number, selected: boolean }
export async function POST(request) {
  const db = getDb();
  const { content_type, content_id, selected } = await request.json();

  if (!content_type || !content_id) {
    return NextResponse.json({ error: 'content_type and content_id required' }, { status: 400 });
  }

  if (selected) {
    db.prepare(`
      INSERT OR IGNORE INTO user_selections (content_type, content_id) VALUES (?, ?)
    `).run(content_type, content_id);
  } else {
    db.prepare(`
      DELETE FROM user_selections WHERE content_type = ? AND content_id = ?
    `).run(content_type, content_id);
  }

  const count = db.prepare(
    `SELECT COUNT(*) as n FROM user_selections WHERE content_type = ?`
  ).get(content_type);

  return NextResponse.json({ ok: true, selectedCount: count.n });
}

// DELETE /api/selections — clear all selections for a type
// Body: { content_type: 'vocabulary'|'kanji' }
export async function DELETE(request) {
  const db = getDb();
  const { content_type } = await request.json();
  if (content_type) {
    db.prepare(`DELETE FROM user_selections WHERE content_type = ?`).run(content_type);
  } else {
    db.prepare(`DELETE FROM user_selections`).run();
  }
  return NextResponse.json({ ok: true });
}
