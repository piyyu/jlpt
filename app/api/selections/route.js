import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

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

export async function POST(request) {
  const db = getDb();
  const { content_type, content_id, content_ids, selected } = await request.json();

  if (!content_type) {
    return NextResponse.json({ error: 'content_type required' }, { status: 400 });
  }

  const ids = content_ids || (content_id ? [content_id] : []);
  if (!ids.length) {
    return NextResponse.json({ error: 'content_id or content_ids required' }, { status: 400 });
  }

  const insertStmt = db.prepare(`INSERT OR IGNORE INTO user_selections (content_type, content_id) VALUES (?, ?)`);
  const deleteStmt = db.prepare(`DELETE FROM user_selections WHERE content_type = ? AND content_id = ?`);

  const today = new Date().toISOString().split('T')[0];
  const updateSrsStmt = db.prepare(`
    UPDATE srs_cards 
    SET next_review_date = ? 
    WHERE content_type = ? AND content_id = ?
  `);

  db.transaction(() => {
    for (const id of ids) {
      if (selected) {
        insertStmt.run(content_type, id);
        // Force the card to be due today so it appears in the Review list immediately
        updateSrsStmt.run(today, content_type, id);
      } else {
        deleteStmt.run(content_type, id);
      }
    }
  })();

  const count = db.prepare(
    `SELECT COUNT(*) as n FROM user_selections WHERE content_type = ?`
  ).get(content_type);

  return NextResponse.json({ ok: true, selectedCount: count.n });
}

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
