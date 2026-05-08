const fs = require('fs');
const text = fs.readFileSync('data/n5.csv', 'utf8');

const checkWords = [
  'ありがとう', 'おはよう', 'こんにちは', 'こんばんは', 'さようなら',
  'すみません', 'おねがいします', 'いただきます', 'ごちそうさま', 'ごめんなさい',
  'おやすみなさい', 'おめでとう', 'どういたしまして', 'パソコン', 'スマホ',
  'エアコン', 'カメラ', 'テレビ', 'ラジオ', 'インターネット'
];

const missing = [];
for (const word of checkWords) {
  if (!text.includes(word)) {
    missing.push(word);
  }
}
console.log('Missing vocab:', missing);
