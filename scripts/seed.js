#!/usr/bin/env node

/**
 * Seed script — reads all CSV files and populates the SQLite database.
 * Run with: node scripts/seed.js  OR  npm run seed
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const Papa = require('papaparse');

const DB_PATH = path.join(process.cwd(), 'jlpt.db');
const DATA_DIR = path.join(process.cwd(), 'data');

// ── helpers ───────────────────────────────────────────────────────────────────

function readCsv(filename) {
  const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  if (result.errors.length) {
    console.error(`CSV parse errors in ${filename}:`, result.errors);
  }
  return result.data;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── schema ────────────────────────────────────────────────────────────────────

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY,
      japanese TEXT NOT NULL,
      reading TEXT NOT NULL,
      english TEXT NOT NULL,
      type TEXT NOT NULL,
      example_jp TEXT,
      example_en TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar (
      id INTEGER PRIMARY KEY,
      pattern TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example1_jp TEXT,
      example1_en TEXT,
      example2_jp TEXT,
      example2_en TEXT,
      example3_jp TEXT,
      example3_en TEXT
    );

    CREATE TABLE IF NOT EXISTS kanji (
      id INTEGER PRIMARY KEY,
      character TEXT NOT NULL,
      on_yomi TEXT,
      kun_yomi TEXT,
      meaning TEXT NOT NULL,
      stroke_count INTEGER,
      example_word1 TEXT,
      example_word2 TEXT
    );

    CREATE TABLE IF NOT EXISTS particles (
      id INTEGER PRIMARY KEY,
      particle TEXT NOT NULL,
      usage_type TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example_jp TEXT,
      example_en TEXT,
      blank_sentence TEXT,
      blank_answer TEXT
    );

    CREATE TABLE IF NOT EXISTS numbers_drills (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      display_value TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT
    );

    CREATE TABLE IF NOT EXISTS reading_passages (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      passage TEXT NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listening_scripts (
      id INTEGER PRIMARY KEY,
      script_jp TEXT NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS srs_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 1,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review_date TEXT NOT NULL,
      times_correct INTEGER NOT NULL DEFAULT 0,
      times_wrong INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at TEXT,
      UNIQUE(content_type, content_id)
    );

    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_type TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      time_taken_seconds INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      was_correct INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS mock_test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocab_score INTEGER NOT NULL DEFAULT 0,
      grammar_score INTEGER NOT NULL DEFAULT 0,
      reading_score INTEGER NOT NULL DEFAULT 0,
      listening_score INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      taken_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      duration_minutes REAL NOT NULL DEFAULT 0,
      cards_reviewed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weak_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      wrong_count INTEGER NOT NULL DEFAULT 1,
      last_wrong_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(content_type, content_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// ── seeders ───────────────────────────────────────────────────────────────────

function seedTable(db, tableName, rows, insertFn) {
  const stmt = db.prepare(`DELETE FROM ${tableName}`);
  stmt.run();
  let count = 0;
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertFn(row);
      count++;
    }
  });
  insertMany(rows);
  console.log(`  ✓ Seeded ${count} rows into ${tableName}`);
}

function guessType(meaning, expression) {
  const m = (meaning || '').toLowerCase();
  const e = (expression || '');
  if (/^to\s/.test(m) || /\bto\s\w/.test(m) || /\bv\.\w*\)/.test(m)) return 'verb';
  if (/い$/.test(e) && !/[をにはがでもの]/.test(e)) return 'adjective';
  if (/\(na\b/.test(m) || /\bna-adj/.test(m)) return 'adjective';
  if (/^～/.test(e) || /counter/.test(m) || /\bnumber of\b/.test(m)) return 'expression';
  if (/\b(conjunction|particle|interjection|suffix|prefix|auxiliary)\b/.test(m)) return 'expression';
  if (/\b(always|never|often|sometimes|already|still|soon|again|also|only|just|very|really|quite)\b/.test(m)) return 'adverb';
  return 'noun';
}

function seedVocabulary(db) {
  // n5.csv columns: expression, reading, meaning, tags, guid
  const rows = readCsv('n5.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vocabulary (id, japanese, reading, english, type, example_jp, example_en)
    VALUES (?, ?, ?, ?, ?, NULL, NULL)
  `);

  db.prepare('DELETE FROM vocabulary').run();
  let count = 0;
  const insertAll = db.transaction(() => {
    for (const [i, r] of rows.entries()) {
      const expr    = (r.expression || '').trim();
      const reading = (r.reading    || '').trim();
      const meaning = (r.meaning    || '').trim();
      if (!expr || !meaning) continue;
      const type = guessType(meaning, expr);
      stmt.run(i + 1, expr, reading, meaning, type);
      count++;
    }
  });
  insertAll();
  console.log(`  ✓ Seeded ${count} rows into vocabulary (from n5.csv)`);
}


function seedGrammar(db) {
  const rows = readCsv('grammar.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO grammar
      (id, pattern, meaning, example1_jp, example1_en, example2_jp, example2_en, example3_jp, example3_en)
    VALUES
      (@id, @pattern, @meaning, @example1_jp, @example1_en, @example2_jp, @example2_en, @example3_jp, @example3_en)
  `);
  seedTable(db, 'grammar', rows, (r) => stmt.run(r));
}

function seedKanji(db) {
  const rows = readCsv('kanji.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO kanji
      (id, character, on_yomi, kun_yomi, meaning, stroke_count, example_word1, example_word2)
    VALUES
      (@id, @character, @on_yomi, @kun_yomi, @meaning, @stroke_count, @example_word1, @example_word2)
  `);
  seedTable(db, 'kanji', rows, (r) => stmt.run(r));
}

function seedParticles(db) {
  const rows = readCsv('particles.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO particles
      (id, particle, usage_type, meaning, example_jp, example_en, blank_sentence, blank_answer)
    VALUES
      (@id, @particle, @usage_type, @meaning, @example_jp, @example_en, @blank_sentence, @blank_answer)
  `);
  seedTable(db, 'particles', rows, (r) => stmt.run(r));
}

function seedNumbers(db) {
  const rows = readCsv('numbers_drills.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO numbers_drills (id, type, display_value, answer, hint)
    VALUES (@id, @type, @display_value, @answer, @hint)
  `);
  seedTable(db, 'numbers_drills', rows, (r) => stmt.run(r));
}

function seedReading(db) {
  const rows = readCsv('reading_passages.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO reading_passages
      (id, title, passage, question, option_a, option_b, option_c, option_d, correct_option)
    VALUES
      (@id, @title, @passage, @question, @option_a, @option_b, @option_c, @option_d, @correct_option)
  `);
  seedTable(db, 'reading_passages', rows, (r) => stmt.run(r));
}

function seedListening(db) {
  const rows = readCsv('listening_scripts.csv');
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO listening_scripts
      (id, script_jp, question, option_a, option_b, option_c, option_d, correct_option)
    VALUES
      (@id, @script_jp, @question, @option_a, @option_b, @option_c, @option_d, @correct_option)
  `);
  seedTable(db, 'listening_scripts', rows, (r) => stmt.run(r));
}

function seedSrsCards(db) {
  const todayStr = today();
  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO srs_cards
      (content_type, content_id, ease_factor, interval_days, repetitions, next_review_date)
    VALUES
      (@content_type, @content_id, 2.5, 1, 0, @next_review_date)
  `);

  const vocab = db.prepare('SELECT id FROM vocabulary').all();
  const kanji = db.prepare('SELECT id FROM kanji').all();

  let count = 0;
  const insertAll = db.transaction(() => {
    for (const v of vocab) {
      insertCard.run({ content_type: 'vocabulary', content_id: v.id, next_review_date: todayStr });
      count++;
    }
    for (const k of kanji) {
      insertCard.run({ content_type: 'kanji', content_id: k.id, next_review_date: todayStr });
      count++;
    }
  });
  insertAll();
  console.log(`  ✓ Initialized ${count} SRS cards (vocabulary + kanji)`);
}

function seedSettings(db) {
  const defaults = [
    ['daily_goal', '20'],
    ['furigana', 'true'],
    ['romaji', 'false'],
    ['audio_speed', '1.0'],
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  const insertAll = db.transaction(() => {
    for (const [k, v] of defaults) stmt.run(k, v);
  });
  insertAll();
  console.log(`  ✓ Initialized default settings`);
}

// ── main ──────────────────────────────────────────────────────────────────────

console.log('🌱 Seeding JLPT database...\n');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

initSchema(db);

seedVocabulary(db);
seedGrammar(db);
seedKanji(db);
seedParticles(db);
seedNumbers(db);
seedReading(db);
seedListening(db);
seedSrsCards(db);
seedSettings(db);

db.close();

console.log('\n✅ Database seeded successfully!');
console.log(`   Location: ${DB_PATH}`);
