const fs = require('fs');

const text = fs.readFileSync('data/kanji.csv', 'utf8');
const lines = text.trim().split('\n');
const lastId = parseInt(lines[lines.length - 1].split(',')[0], 10);

const additions = [
  { char: '古', on: 'コ', kun: 'ふる・い', meaning: 'old', stroke: 5, ex1: '古い (ふるい)', ex2: '中古 (ちゅうこ)' },
  { char: '後', on: 'ゴ・コウ', kun: 'のち・うし・ろ・あと', meaning: 'behind / after', stroke: 9, ex1: '後ろ (うしろ)', ex2: '午後 (ごご)' },
  { char: '教', on: 'キョウ', kun: 'おし・える', meaning: 'teach', stroke: 11, ex1: '教える (おしえる)', ex2: '教室 (きょうしつ)' },
  { char: '先', on: 'セン', kun: 'さき', meaning: 'previous / ahead', stroke: 6, ex1: '先生 (せんせい)', ex2: '先週 (せんしゅう)' },
  { char: '友', on: 'ユウ', kun: 'とも', meaning: 'friend', stroke: 4, ex1: '友達 (ともだち)', ex2: '友人 (ゆうじん)' },
  { char: '毎', on: 'マイ', kun: 'ごと', meaning: 'every', stroke: 6, ex1: '毎日 (まいにち)', ex2: '毎週 (まいしゅう)' },
  { char: '朝', on: 'チョウ', kun: 'あさ', meaning: 'morning', stroke: 12, ex1: '朝 (あさ)', ex2: '今朝 (けさ)' },
  { char: '昼', on: 'チュウ', kun: 'ひる', meaning: 'noon / daytime', stroke: 9, ex1: '昼休み (ひるやすみ)', ex2: '昼ごはん (ひるごはん)' },
  { char: '夜', on: 'ヤ', kun: 'よる・よ', meaning: 'night', stroke: 8, ex1: '夜 (よる)', ex2: '今夜 (こんや)' },
  { char: '明', on: 'メイ・ミョウ', kun: 'あか・るい', meaning: 'bright / light', stroke: 8, ex1: '明るい (あかるい)', ex2: '明日 (あした)' },
  { char: '道', on: 'ドウ', kun: 'みち', meaning: 'road / street', stroke: 12, ex1: '道 (みち)', ex2: '水道 (すいどう)' },
  { char: '知', on: 'チ', kun: 'し・る', meaning: 'know', stroke: 8, ex1: '知る (しる)', ex2: '知らせる (しらせる)' },
  { char: '少', on: 'ショウ', kun: 'すく・ない、すこ・し', meaning: 'few / little', stroke: 4, ex1: '少し (すこし)', ex2: '少ない (すくない)' },
];

let id = lastId;
let out = '';
for (const add of additions) {
  if (!text.includes(add.char + ',')) {
    id++;
    out += `${id},${add.char},${add.on},${add.kun},${add.meaning},${add.stroke},${add.ex1},${add.ex2}\n`;
  }
}
fs.appendFileSync('data/kanji.csv', out);
console.log('Appended kanji');
