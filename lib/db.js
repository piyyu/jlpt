import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.JLPT_DB_PATH || path.join(process.cwd(), 'jlpt.db');

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

// Columns of the current vocabulary table. The word list was replaced with
// the Minna no Nihongo import, which renamed `english` to `meaning` and added
// `level`, `study` and `lesson`.
const VOCAB_COLUMNS = [
  'id', 'japanese', 'reading', 'romaji', 'meaning', 'level', 'study', 'lesson',
  'type', 'category', 'importance', 'example_jp', 'example_en', 'sort_order',
];

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY,
      japanese TEXT NOT NULL,
      reading TEXT NOT NULL,
      romaji TEXT,
      meaning TEXT NOT NULL,
      level TEXT,
      study TEXT,
      lesson INTEGER,
      type TEXT NOT NULL DEFAULT 'word',
      category TEXT DEFAULT 'Other',
      importance INTEGER DEFAULT 100,
      example_jp TEXT,
      example_en TEXT,
      sort_order INTEGER DEFAULT 1000
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

    CREATE TABLE IF NOT EXISTS grammar_points (
      id INTEGER PRIMARY KEY,
      pattern TEXT NOT NULL,
      structure TEXT,
      meaning TEXT NOT NULL,
      category TEXT DEFAULT 'Other',
      example_jp TEXT,
      example_en TEXT,
      example_romaji TEXT,
      source_url TEXT,
      sort_order INTEGER DEFAULT 1000
    );

    CREATE TABLE IF NOT EXISTS grammar_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grammar_id INTEGER NOT NULL,
      example_jp TEXT NOT NULL,
      example_en TEXT,
      explanation TEXT,
      sort_order INTEGER DEFAULT 1000,
      FOREIGN KEY (grammar_id) REFERENCES grammar_points(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_grammar_examples_gid ON grammar_examples(grammar_id);

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

    CREATE TABLE IF NOT EXISTS user_selections (
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      PRIMARY KEY (content_type, content_id)
    );

    CREATE INDEX IF NOT EXISTS idx_srs_cards_next_review ON srs_cards(next_review_date);
    CREATE INDEX IF NOT EXISTS idx_srs_mastered ON srs_cards(content_type, interval_days);
    CREATE INDEX IF NOT EXISTS idx_srs_overdue ON srs_cards(content_type, next_review_date, times_wrong);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(created_at, section);
    CREATE INDEX IF NOT EXISTS idx_kanji_char ON kanji(character);
  `);

  // Older databases still have the previous vocabulary shape, so rebuild the
  // table there before creating indexes against the new columns.
  migrateVocabulary(db);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_vocab_jp ON vocabulary(japanese);
    CREATE INDEX IF NOT EXISTS idx_vocab_meaning ON vocabulary(meaning);
    CREATE INDEX IF NOT EXISTS idx_vocab_romaji ON vocabulary(romaji);
    CREATE INDEX IF NOT EXISTS idx_vocab_lesson ON vocabulary(lesson);
    CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocabulary(level);
    CREATE INDEX IF NOT EXISTS idx_vocab_study ON vocabulary(study);
  `);

  // Lightweight migrations for existing databases (CREATE TABLE IF NOT
  // EXISTS above won't add columns to tables created by older versions).
  try {
    const cols = db.prepare(`PRAGMA table_info(grammar_points)`).all().map((c) => c.name);
    if (cols.length > 0 && !cols.includes('example_romaji')) {
      db.exec(`ALTER TABLE grammar_points ADD COLUMN example_romaji TEXT`);
    }
  } catch {
    // best-effort; routes select explicit columns and tolerate absence
  }
}

// Rebuilds the vocabulary table when it still has the pre-import shape
// (`english` instead of `meaning`, no `level`/`study`/`lesson`). Existing rows
// are carried over so nothing is lost before the new list is imported.
function migrateVocabulary(db) {
  const cols = db.prepare('PRAGMA table_info(vocabulary)').all().map((c) => c.name);
  if (cols.length === 0) return;

  const legacy = cols.includes('english');
  const missing = VOCAB_COLUMNS.filter((c) => c !== 'id' && !cols.includes(c));
  if (!legacy && missing.length === 0) return;

  const source = (name) => {
    if (legacy && name === 'meaning') return 'COALESCE(english, japanese)';
    if (cols.includes(name)) return name;
    if (name === 'type') return "'word'";
    if (name === 'category') return "'Other'";
    if (name === 'importance') return '100';
    if (name === 'sort_order') return '1000';
    return 'NULL';
  };
  const exprs = VOCAB_COLUMNS.map(source).join(', ');
  const columnList = VOCAB_COLUMNS.join(', ');

  db.transaction(() => {
    db.prepare('DROP TABLE IF EXISTS vocabulary__new').run();
    db.prepare(`
      CREATE TABLE vocabulary__new (
        id INTEGER PRIMARY KEY,
        japanese TEXT NOT NULL,
        reading TEXT NOT NULL,
        romaji TEXT,
        meaning TEXT NOT NULL,
        level TEXT,
        study TEXT,
        lesson INTEGER,
        type TEXT NOT NULL DEFAULT 'word',
        category TEXT DEFAULT 'Other',
        importance INTEGER DEFAULT 100,
        example_jp TEXT,
        example_en TEXT,
        sort_order INTEGER DEFAULT 1000
      )
    `).run();
    db.prepare(
      `INSERT INTO vocabulary__new (${columnList}) SELECT ${exprs} FROM vocabulary`
    ).run();
    db.prepare('DROP TABLE vocabulary').run();
    db.prepare('ALTER TABLE vocabulary__new RENAME TO vocabulary').run();
  })();
}

export default getDb;
