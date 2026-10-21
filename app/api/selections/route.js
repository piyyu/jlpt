import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { todayLocal } from '@/lib/date';

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

  const today = todayLocal();
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO user_selections (content_type, content_id) VALUES (?, ?)`);
  const insertSrsStmt = db.prepare(`
    INSERT OR IGNORE INTO srs_cards (content_type, content_id, next_review_date)
    VALUES (?, ?, ?)
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
      }
      for (const id of kanjiIds) {
        insertStmt.run('kanji', id);
        insertSrsStmt.run('kanji', id, today);
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
        // Ensure an srs_card exists (due today for genuinely new cards).
        // Never touch existing cards: re-marking must keep its schedule.
        insertSrsStmt.run(content_type, id, today);
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
    // Clear the deck properly: the marks and their SM-2 cards go together,
    // otherwise the cards linger as orphans outside the review deck.
    db.transaction(() => {
      db.prepare('DELETE FROM user_selections WHERE content_type = ?').run(content_type);
      db.prepare('DELETE FROM srs_cards WHERE content_type = ?').run(content_type);
    })();
  } else {
    db.prepare('DELETE FROM user_selections').run();
    db.prepare('DELETE FROM srs_cards').run();
  }
  return NextResponse.json({ ok: true });
}
