const fs = require('fs');
const text = fs.readFileSync('data/n5.csv', 'utf8').trim().split('\n');
const s = new Set();
for(let i = 1; i < text.length; i++){
  const expr = text[i].split(',')[0].trim();
  if(!expr) continue;
  if(s.has(expr)){
     console.log('Dup expr:', expr);
  }
  s.add(expr);
}
