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
  const { content_type, content_id, content_ids, selected, starter_pack = false } = await request.json();

  const today = new Date().toISOString().split('T')[0];
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO user_selections (content_type, content_id) VALUES (?, ?)`);
  const insertSrsStmt = db.prepare(`
    INSERT OR IGNORE INTO srs_cards (content_type, content_id, next_review_date)
    VALUES (?, ?, ?)
  `);
  const updateSrsStmt = db.prepare(`
    UPDATE srs_cards
    SET next_review_date = ?
    WHERE content_type = ? AND content_id = ?
  `);

  // Starter pack: first 20 vocabulary + first 10 kanji, for fresh installs
  // with zero cards. One click, no manual selecting needed to begin.
  if (starter_pack) {
    const vocabIds = db.prepare(
      'SELECT id FROM vocabulary ORDER BY sort_order ASC, importance ASC, id ASC LIMIT 20'
    ).all().map((r) => r.id);
    const kanjiIds = db.prepare('SELECT id FROM kanji ORDER BY id ASC LIMIT 10').all().map((r) => r.id);
    db.transaction(() => {
      for (const id of vocabIds) {
        insertStmt.run('vocabulary', id);
        insertSrsStmt.run('vocabulary', id, today);
        updateSrsStmt.run(today, 'vocabulary', id);
      }
      for (const id of kanjiIds) {
        insertStmt.run('kanji', id);
        insertSrsStmt.run('kanji', id, today);
        updateSrsStmt.run(today, 'kanji', id);
      }
    })();
    return NextResponse.json({ ok: true, starter_pack: true, vocabulary: vocabIds.length, kanji: kanjiIds.length });
  }

  if (!content_type) {
    return NextResponse.json({ error: 'content_type required' }, { status: 400 });
  }

  const ids = content_ids || (content_id ? [content_id] : []);
  if (!ids.length) {
    return NextResponse.json({ error: 'content_id or content_ids required' }, { status: 400 });
  }

  const deleteStmt = db.prepare(`DELETE FROM user_selections WHERE content_type = ? AND content_id = ?`);
  const deleteSrsStmt = db.prepare(`
    DELETE FROM srs_cards
    WHERE content_type = ? AND content_id = ?
  `);

  db.transaction(() => {
    for (const id of ids) {
      if (selected) {
        insertStmt.run(content_type, id);
        // Ensure srs_card exists and is due today
        insertSrsStmt.run(content_type, id, today);
        updateSrsStmt.run(today, content_type, id);
      } else {
        deleteStmt.run(content_type, id);
        // Remove from SRS as well if user deselects
        deleteSrsStmt.run(content_type, id);
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
