const db = require('./lib/db.js')();
console.log(
  db.prepare(`
    SELECT sum(cards_reviewed) as total
    FROM study_sessions 
    WHERE date(created_at) = date('now') AND section = 'review'
  `).get()
);
