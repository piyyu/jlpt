import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'jlpt.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY,
      japanese TEXT NOT NULL,
      reading TEXT NOT NULL,
      english TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      importance INTEGER DEFAULT 100,
      example_jp TEXT,
      example_en TEXT,
      sort_order INTEGER DEFAULT 1000,
      romaji TEXT
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

export default getDb;
