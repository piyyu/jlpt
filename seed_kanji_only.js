const Database = require('better-sqlite3');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const db = new Database('jlpt.db');
const content = fs.readFileSync('data/kanji.csv', 'utf-8');
const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });

const stmt = db.prepare(`
    INSERT OR REPLACE INTO kanji
      (id, character, on_yomi, kun_yomi, meaning, stroke_count, example_word1, example_word2)
    VALUES
      (@id, @character, @on_yomi, @kun_yomi, @meaning, @stroke_count, @example_word1, @example_word2)
`);

db.transaction(() => {
  for (const row of data) {
    stmt.run(row);
  }
})();

// Create SRS cards for new kanji
const getCards = db.prepare("SELECT content_id FROM srs_cards WHERE content_type = 'kanji'").all().map(r => r.content_id);
const srsSet = new Set(getCards);

const insertSRS = db.prepare(`
  INSERT INTO srs_cards (content_type, content_id, ease_factor, interval_days, repetitions, next_review_date)
  VALUES ('kanji', ?, 2.5, 1, 0, date('now'))
`);

let c = 0;
db.transaction(() => {
  for (const row of data) {
    if (!srsSet.has(parseInt(row.id, 10))) {
      insertSRS.run(row.id);
      c++;
    }
  }
})();

console.log('Seeded kanji. New SRS cards:', c);
