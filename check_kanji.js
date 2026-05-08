const fs = require('fs');

const text = fs.readFileSync('data/kanji.csv', 'utf8');
const n5Kanji = '一二三四五六七八九十百千万円日月火水木金土年時間分半大小高安新古長多少上下左右中前後外行来食飲見聞書読話買教学校生仙人男女子父母手足目口耳山川田天気車電語白黒赤青北南東西名本何休';

const missing = [];
for (const char of n5Kanji) {
  if (!text.includes(char)) {
    missing.push(char);
  }
}
console.log('Missing kanji:', missing.join(''));
