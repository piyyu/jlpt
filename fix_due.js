const fs = require('fs');

let code = fs.readFileSync('app/api/review/due/route.js', 'utf8');

const injection = `
  // Limit to 50 cards maximum per day
  const reviewsTodayRow = db.prepare(\`
    SELECT sum(cards_reviewed) as total
    FROM study_sessions 
    WHERE date(created_at) = date('now') AND section = 'review'
  \`).get();
  const reviewsToday = reviewsTodayRow?.total || 0;
  const limitRemaining = Math.max(0, 50 - reviewsToday);

  // If daily limit reached, just short-circuit returning 0
  if (limitRemaining === 0) {
    return NextResponse.json({
      cards: [],
      count: 0,
      date: today,
      counts: {},
      pools: { vocabulary: [], kanji: [] },
      selectionActive: selectionCount > 0,
      selectionCount,
    });
  }
`;

code = code.replace("const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';\n\n\n\n", "const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';\n\n" + injection);

fs.writeFileSync('app/api/review/due/route.js', code);
