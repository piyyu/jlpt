// Import: reads data/kotoba_import.csv into the vocabulary table.
//
// The CSV is the source of truth for the word list. Rows are keyed on
// japanese + reading + meaning, so re-running the import never duplicates a
// word: missing rows are inserted, existing rows are refreshed with their
// level / study / lesson metadata.
//
// Run:      npm run import:vocab
// Replace:  npm run import:vocab -- --reset   (wipe the old list and all
//                                                vocabulary progress first)
import getDb from '../lib/db.js';
import Papa from 'papaparse';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = process.env.KOTOBA_CSV || path.join(root, 'data/kotoba_import.csv');
const reset = process.argv.includes('--reset');

// "MnN I L7" -> 7, anything else (e.g. "Added (community N5 list)") -> null
function parseLesson(source) {
  const m = /MnN\s+[IVX]+\s+L(\d+)/i.exec(source || '');
  return m ? parseInt(m[1], 10) : null;
}

if (!fs.existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const { data, errors } = Papa.parse(raw, { header: true, skipEmptyLines: true });
if (errors.length) {
  console.error('CSV parse errors:', errors);
  process.exit(1);
}

const db = getDb(); // runs initSchema (CREATE TABLE IF NOT EXISTS + migrations) first

if (reset) {
  // Remove the old word list together with every trace of the progress that
  // belonged to it: marks, SM-2 cards, weak points, quiz answers and the
  // vocabulary review log. Kanji and grammar progress are left alone.
  const wipe = db.transaction(() => {
    const removed = {
      vocabulary: db.prepare('DELETE FROM vocabulary').run().changes,
      selections: db.prepare("DELETE FROM user_selections WHERE content_type = 'vocabulary'").run().changes,
      srs_cards: db.prepare("DELETE FROM srs_cards WHERE content_type = 'vocabulary'").run().changes,
      weak_items: db.prepare("DELETE FROM weak_items WHERE content_type = 'vocabulary'").run().changes,
      quiz_answers: db.prepare("DELETE FROM quiz_answers WHERE content_type = 'vocabulary'").run().changes,
      study_sessions: db.prepare("DELETE FROM study_sessions WHERE section = 'review:vocabulary'").run().changes,
    };
    return removed;
  });
  const removed = wipe();
  console.log(
    'Reset: removed ' +
      `${removed.vocabulary} words, ${removed.selections} marks, ` +
      `${removed.srs_cards} SM-2 cards, ${removed.weak_items} weak items, ` +
      `${removed.quiz_answers} quiz answers, ${removed.study_sessions} review log rows.`
  );
}

const find = db.prepare(`
  SELECT id FROM vocabulary WHERE japanese = ? AND reading = ? AND meaning = ?
`);
const insert = db.prepare(`
  INSERT INTO vocabulary
    (japanese, reading, romaji, meaning, level, study, lesson, type, category, importance, sort_order)
  VALUES (@japanese, @reading, @romaji, @meaning, @level, @study, @lesson, 'word', 'Other', 100, @sort_order)
`);
const update = db.prepare(`
  UPDATE vocabulary
  SET romaji = @romaji, level = @level, study = @study, lesson = @lesson
  WHERE id = @id
`);

let inserted = 0;
let updated = 0;
let skipped = 0;
const seen = new Set();

const tx = db.transaction((rows) => {
  rows.forEach((r, index) => {
    const japanese = (r.japanese || '').trim();
    const reading = (r.reading || '').trim();
    const meaning = (r.meaning || '').trim();
    if (!japanese || !reading || !meaning) {
      skipped++;
      console.warn('Skipping row with missing japanese/reading/meaning:', r);
      return;
    }

    const row = {
      japanese,
      reading,
      romaji: (r.romaji || '').trim() || null,
      meaning,
      level: (r.level || '').trim() || null,
      study: (r.study || '').trim() || null,
      lesson: parseLesson(r.source),
      sort_order: index + 1,
    };

    // Duplicates inside the CSV itself are ignored.
    const key = `${japanese}\u0000${reading}\u0000${meaning}`;
    if (seen.has(key)) {
      skipped++;
      return;
    }
    seen.add(key);

    const existing = find.get(japanese, reading, meaning);
    if (existing) {
      update.run({ ...row, id: existing.id });
      updated++;
    } else {
      insert.run(row);
      inserted++;
    }
  });
});
tx(data);

const total = db.prepare('SELECT COUNT(*) AS n FROM vocabulary').get().n;
console.log(`Vocabulary import: ${data.length} rows read from ${path.relative(root, csvPath)}.`);
console.log(
  `  inserted ${inserted}, updated ${updated}, skipped ${skipped} (exact duplicates or incomplete rows).`
);
console.log(`  ${total} words in the vocabulary table.`);

const lessons = db.prepare(`
  SELECT lesson, COUNT(*) AS n FROM vocabulary GROUP BY lesson ORDER BY lesson
`).all();
const lessonTotal = lessons.filter((l) => l.lesson !== null).reduce((sum, l) => sum + l.n, 0);
const added = lessons.find((l) => l.lesson === null)?.n ?? 0;
console.log(
  `  lessons 1-25: ${lessonTotal} words, added words: ${added}, total: ${lessonTotal + added}.`
);
