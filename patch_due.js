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

code = code.replace("const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';", "const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';\n" + injection);

// Fix the query limit and order
code = code.replace("ORDER BY s.next_review_date ASC\n    LIMIT 9999", "ORDER BY RANDOM()\n    LIMIT ${limitRemaining}");

// Wait, the "counts" query at the bottom counts ALL due cards.
// If we want it to reflect the leftover limit, we should cap the max count across all categories to limitRemaining.
// Actually, it's easier to just do: `counts: Object.fromEntries(...)`
// But we want the sum of counts to not exceed limitRemaining. Let's just adjust the counts array dynamically.
code = code.replace("const counts = db.prepare(countsQuery).all(today);", `
  const allCounts = db.prepare(countsQuery).all(today);
  
  // Distribute the remaining limit across categories proportionally (or just cap the display sum so we don't exceed limit)
  // For simplicity, just return the actual length of cards retrieved per category!
  const counts = [];
  const countMap = {};
  for (const c of cards) {
    countMap[c.content_type] = (countMap[c.content_type] || 0) + 1;
  }
  for (const [ctype, due] of Object.entries(countMap)) {
    counts.push({ content_type: ctype, due });
  }
`);

fs.writeFileSync('app/api/review/due/route.js', code);
