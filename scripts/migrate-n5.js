#!/usr/bin/env node
/**
 * migrate-n5.js
 * Replaces the vocabulary table with data from n5.csv (718 words).
 * Preserves SRS card IDs where the Japanese expression already exists.
 * New words get fresh SRS cards due today.
 *
 * Run: node scripts/migrate-n5.js
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const Papa = require('papaparse');

const DB_PATH   = path.join(process.cwd(), 'jlpt.db');
const N5_CSV    = path.join(process.cwd(), 'data', 'n5.csv');

// ── Type guesser ──────────────────────────────────────────────────────────────
// Derives a broad word-type tag from the meaning string heuristics.
function guessType(meaning, expression) {
  const m = (meaning || '').toLowerCase();
  const e = (expression || '');

  // Verb patterns: meaning starts with "to " or contains "(v." or "(v.i.)" etc.
  if (/^to\s/.test(m) || /\bto\s\w/.test(m) || /\bv\.\w*\)/.test(m)) return 'verb';

  // い-adjectives: expression ends in い and meaning = descriptive
  if (/い$/.test(e) && !/[をにはがでもの]/.test(e)) {
    if (/\b(bright|clean|tall|cold|hot|big|small|young|old|long|short|heavy|light|warm|cool|new|old|black|white|red|blue|green|cheap|expensive|fast|slow|good|bad|near|far|busy|interesting|fun|easy|difficult|kind|scary|lonely|noisy|quiet|delicious|bitter|sweet|sour|salty|thin|thick|weak|strong|beautiful|cute|fresh|dark)/.test(m)) {
      return 'adjective';
    }
    if (/い$/.test(e)) return 'adjective';
  }

  // な-adjectives often have "na-adj" in tags or meanings like "quiet; peaceful"
  if (/\(na\b/.test(m) || /\bna-adj/.test(m)) return 'adjective';

  // Counter words
  if (/^～/.test(e) || /counter/.test(m) || /\bnumber of\b/.test(m)) return 'expression';

  // Expressions / conjunctions / particles
  if (/\b(conjunction|particle|interjection|suffix|prefix|auxiliary)\b/.test(m)) return 'expression';

  // Adverbs
  if (/\b(always|never|often|sometimes|already|still|soon|again|also|only|just|very|really|quite|too|more|most|well|badly|quickly|slowly|almost|nearly|about|around|suddenly|immediately|perhaps|probably|certainly|definitely|especially|mostly|finally|at last|a little|a lot|not at all)\b/.test(m)) {
    return 'adverb';
  }

  // Default: noun
  return 'noun';
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('🔄 Migrating vocabulary from n5.csv...\n');

const content = fs.readFileSync(N5_CSV, 'utf-8');
const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });

console.log(`  Parsed ${data.length} rows from n5.csv`);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF'); // temporarily off during migration

// Build a lookup of existing vocab by japanese expression so we can reuse IDs
const existing = db.prepare('SELECT id, japanese FROM vocabulary').all();
const existingMap = new Map(existing.map(r => [r.japanese, r.id]));
console.log(`  Existing vocab: ${existing.length} words`);

// We'll do a full replace of the vocabulary table, preserving SRS card content_id
// by keeping the same id for matching words and issuing new ids for new ones.

// First, find the max id currently in use
const { maxId } = db.prepare('SELECT COALESCE(MAX(id), 0) AS maxId FROM vocabulary').get();
let nextId = maxId + 1;

const migrate = db.transaction(() => {
  // Clear old vocab
  db.prepare('DELETE FROM vocabulary').run();

  const insert = db.prepare(`
    INSERT INTO vocabulary (id, japanese, reading, english, type, example_jp, example_en)
    VALUES (?, ?, ?, ?, ?, NULL, NULL)
  `);

  let reused = 0, created = 0;
  const newIds = new Set(); // track ids used in this migration

  for (const row of data) {
    const expr    = (row.expression || '').trim().replace(/\r/g, '');
    const reading = (row.reading    || '').trim().replace(/\r/g, '');
    const meaning = (row.meaning    || '').trim().replace(/^"|"$/g, '').replace(/\r/g, '');

    if (!expr || !meaning) continue;

    const type = guessType(meaning, expr);

    // Reuse existing id if the word already existed (preserves SRS card links)
    let id;
    if (existingMap.has(expr)) {
      id = existingMap.get(expr);
      reused++;
    } else {
      // Find a free id
      while (newIds.has(nextId) || existingMap.values().includes?.(nextId)) nextId++;
      id = nextId++;
      created++;
    }
    newIds.add(id);

    insert.run(id, expr, reading, meaning, type);
  }

  return { reused, created };
});

const { reused, created } = migrate();
console.log(`  ✓ Inserted ${reused + created} words (${reused} reused IDs, ${created} new)`);

// Now create SRS cards for any vocab words that don't have one yet
const todayStr = new Date().toISOString().split('T')[0];
const insertSRS = db.prepare(`
  INSERT OR IGNORE INTO srs_cards
    (content_type, content_id, ease_factor, interval_days, repetitions, next_review_date)
  VALUES ('vocabulary', ?, 2.5, 1, 0, ?)
`);

const allVocab = db.prepare('SELECT id FROM vocabulary').all();
let newCards = 0;
const addCards = db.transaction(() => {
  for (const { id } of allVocab) {
    const result = insertSRS.run(id, todayStr);
    if (result.changes > 0) newCards++;
  }
});
addCards();
console.log(`  ✓ Created ${newCards} new SRS cards`);

// Update the API distractor pool will now have 718 words
const finalCount = db.prepare('SELECT COUNT(*) as n FROM vocabulary').get().n;
const srsCount   = db.prepare("SELECT COUNT(*) as n FROM srs_cards WHERE content_type='vocabulary'").get().n;

db.close();

console.log(`\n✅ Migration complete!`);
console.log(`   Vocabulary words : ${finalCount}`);
console.log(`   SRS cards (vocab): ${srsCount}`);
