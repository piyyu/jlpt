const fs = require('fs');

const missing = [
  { expr: "ごめんなさい", reading: "ごめんなさい", meaning: "I'm sorry", tags: "Genki Genki_Ln.1 JLPT JLPT_5 JLPT_N5", guid: "x1" },
  { expr: "おめでとう", reading: "おめでとう", meaning: "congratulations", tags: "Genki Genki_Ln.1 JLPT_N5", guid: "x2" },
  { expr: "どういたしまして", reading: "どういたしまして", meaning: "you're welcome", tags: "Genki Genki_Ln.1 JLPT_N5", guid: "x3" },
  { expr: "パソコン", reading: "ぱそこん", meaning: "personal computer", tags: "Genki Genki_Ln.2 JLPT_N5", guid: "x4" },
  { expr: "スマホ", reading: "すまほ", meaning: "smartphone", tags: "Genki JLPT_N5", guid: "x5" },
  { expr: "エアコン", reading: "えあこん", meaning: "air conditioner", tags: "Genki JLPT_N5", guid: "x6" },
  { expr: "インターネット", reading: "いんたーねっと", meaning: "internet", tags: "Genki JLPT_N5", guid: "x7" },
  { expr: "スマートフォン", reading: "すまーとふぉん", meaning: "smartphone", tags: "Genki JLPT_N5", guid: "x8" },
  { expr: "スーパー", reading: "すーぱー", meaning: "supermarket", tags: "Genki JLPT_N5", guid: "x9" },
  { expr: "パン", reading: "ぱん", meaning: "bread", tags: "Genki JLPT_N5", guid: "x10" },
  { expr: "ハンバーガー", reading: "はんばーがー", meaning: "hamburger", tags: "Genki JLPT_N5", guid: "x11" },
  { expr: "アイスクリーム", reading: "あいすくりーむ", meaning: "ice cream", tags: "Genki JLPT_N5", guid: "x12" }
];

const text = fs.readFileSync('data/n5.csv', 'utf8');
let out = '';
for (const add of missing) {
  if (!text.includes(add.expr + ',')) {
    out += `${add.expr},${add.reading},${add.meaning},${add.tags},${add.guid}\n`;
  }
}
fs.appendFileSync('data/n5.csv', out);
console.log('Appended vocab');
