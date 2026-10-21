import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { toRomaji } from '@/lib/toRomaji';
import { todayLocal } from '@/lib/date';

export function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type     = searchParams.get('type')     || '';
  const category = searchParams.get('category') || '';

  let query = `
    SELECT v.*,
      CASE WHEN us.content_id IS NOT NULL THEN 1 ELSE 0 END AS is_selected,
      s.next_review_date,
      s.repetitions AS repetitions
    FROM vocabulary v
    LEFT JOIN user_selections us
      ON us.content_type = 'vocabulary' AND us.content_id = v.id
    LEFT JOIN srs_cards s
      ON s.content_type = 'vocabulary' AND s.content_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (v.japanese LIKE ? OR v.reading LIKE ? OR v.meaning LIKE ? OR v.romaji LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (type) {
    query += ' AND v.type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND v.category = ?';
    params.push(category);
  }
  query += ' ORDER BY v.sort_order ASC, v.importance ASC, v.id ASC';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const db = getDb();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const japanese = (body.japanese || '').trim();
  const reading = (body.reading || '').trim();
  const meaning = (body.meaning || body.english || '').trim();
  if (!japanese || !reading || !meaning) {
    return NextResponse.json({ error: 'japanese, reading, and meaning are required' }, { status: 400 });
  }
  const category = (body.category || '').trim() || 'Other';
  const example_jp = (body.example_jp || '').trim() || null;
  const example_en = (body.example_en || '').trim() || null;

  // Never create a second row for an existing japanese + reading pair.
  const existing = db.prepare(
    'SELECT id FROM vocabulary WHERE japanese = ? AND reading = ?'
  ).get(japanese, reading);
  if (existing) {
    return NextResponse.json({ error: 'That word already exists', id: existing.id }, { status: 409 });
  }

  // level / study / lesson stay empty: user-added words have no lesson.
  const { lastInsertRowid: id } = db.prepare(`
    INSERT INTO vocabulary
      (japanese, reading, romaji, meaning, level, study, lesson, type, category, importance, example_jp, example_en, sort_order)
    VALUES (?, ?, ?, ?, NULL, NULL, NULL, 'word', ?, 100, ?, ?, 999999)
  `).run(japanese, reading, toRomaji(reading) || null, meaning, category, example_jp, example_en);

  // Mark for review unless the caller opts out, so the word is
  // immediately studyable (matches the bulk "Mark all" behaviour).
  let selected = false;
  if (body.selected !== false) {
    db.prepare(`INSERT OR IGNORE INTO user_selections (content_type, content_id) VALUES ('vocabulary', ?)`)
      .run(id);
    db.prepare(`INSERT OR IGNORE INTO srs_cards (content_type, content_id, next_review_date) VALUES ('vocabulary', ?, ?)`)
      .run(id, todayLocal());
    selected = true;
  }

  return NextResponse.json({ ok: true, id, selected }, { status: 201 });
}

// Remove a word that was added by hand. Words from the imported list carry a
// level and a study priority, so they are protected: the CSV is the source of
// truth for them and re-importing would just bring them back.
export async function DELETE(request) {
  const db = getDb();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const word = db.prepare(
    'SELECT id, japanese, reading, level, study FROM vocabulary WHERE id = ?'
  ).get(id);
  if (!word) {
    return NextResponse.json({ error: 'That word no longer exists' }, { status: 404 });
  }
  if (word.level || word.study) {
    return NextResponse.json(
      { error: 'Imported words cannot be removed here' },
      { status: 409 }
    );
  }

  db.transaction(() => {
    db.prepare("DELETE FROM user_selections WHERE content_type = 'vocabulary' AND content_id = ?").run(id);
    db.prepare("DELETE FROM srs_cards WHERE content_type = 'vocabulary' AND content_id = ?").run(id);
    db.prepare("DELETE FROM weak_items WHERE content_type = 'vocabulary' AND content_id = ?").run(id);
    db.prepare('DELETE FROM vocabulary WHERE id = ?').run(id);
  })();

  return NextResponse.json({ ok: true, id });
}
