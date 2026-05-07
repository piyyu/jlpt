#!/usr/bin/env node
/**
 * setup-selections-and-examples.js
 *
 * 1. Creates user_selections table (tracks which vocab/kanji the user has ticked)
 * 2. Populates hiragana-only example sentences for ~200 core N5 vocabulary words
 *
 * Run: node scripts/setup-selections-and-examples.js
 */

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(process.cwd(), 'jlpt.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── 1. user_selections table ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS user_selections (
    content_type TEXT NOT NULL,   -- 'vocabulary' | 'kanji'
    content_id   INTEGER NOT NULL,
    PRIMARY KEY (content_type, content_id)
  );
`);
console.log('✓ user_selections table ready');

// ── 2. Hiragana-only example sentences ───────────────────────────────────────
// Key = reading (hiragana/katakana), value = { jp, en }
// Sentences use ONLY hiragana + katakana + basic punctuation. No kanji.
const EXAMPLES = {
  'あう':       { jp: 'まいにち ともだちに あいます。',           en: 'I meet my friend every day.' },
  'あおい':     { jp: 'そらは あおい です。',                     en: 'The sky is blue.' },
  'あかい':     { jp: 'りんごは あかい です。',                   en: 'The apple is red.' },
  'あかるい':   { jp: 'この へやは あかるい です。',              en: 'This room is bright.' },
  'あき':       { jp: 'あきは すずしい です。',                   en: 'Autumn is cool.' },
  'あく':       { jp: 'まどが あきます。',                        en: 'The window opens.' },
  'あける':     { jp: 'とを あけて ください。',                   en: 'Please open the door.' },
  'あげる':     { jp: 'てを あげて ください。',                   en: 'Please raise your hand.' },
  'あさ':       { jp: 'まいあさ はやく おきます。',               en: 'I wake up early every morning.' },
  'あさごはん': { jp: 'あさごはんは パン です。',                 en: 'Breakfast is bread.' },
  'あさって':   { jp: 'あさって ともだちに あいます。',           en: 'I will meet my friend the day after tomorrow.' },
  'あし':       { jp: 'あしが いたい です。',                     en: 'My leg hurts.' },
  'あした':     { jp: 'あした がっこうに いきます。',             en: 'I will go to school tomorrow.' },
  'あそこ':     { jp: 'あそこに コンビニが あります。',           en: 'There is a convenience store over there.' },
  'あそぶ':     { jp: 'こうえんで あそびます。',                  en: 'I play in the park.' },
  'あたたかい': { jp: 'はるは あたたかい です。',                 en: 'Spring is warm.' },
  'あたま':     { jp: 'あたまが いたい です。',                   en: 'I have a headache.' },
  'あたらしい': { jp: 'あたらしい ほんを かいました。',           en: 'I bought a new book.' },
  'あつい':     { jp: 'きょうは あつい です。',                   en: 'Today is hot.' },
  'あなた':     { jp: 'あなたの なまえは なんですか。',           en: 'What is your name?' },
  'あに':       { jp: 'あには だいがくせい です。',               en: 'My older brother is a university student.' },
  'あね':       { jp: 'あねは せんせい です。',                   en: 'My older sister is a teacher.' },
  'アパート':   { jp: 'わたしは アパートに すんでいます。',        en: 'I live in an apartment.' },
  'あぶない':   { jp: 'あぶない！きを つけて ください。',         en: 'Dangerous! Please be careful.' },
  'あまい':     { jp: 'このケーキは あまい です。',               en: 'This cake is sweet.' },
  'あまり':     { jp: 'あまり たべません。',                      en: 'I do not eat much.' },
  'あめ':       { jp: 'きょう あめが ふっています。',             en: 'It is raining today.' },
  'あらう':     { jp: 'てを あらいます。',                        en: 'I wash my hands.' },
  'ある':       { jp: 'つくえの うえに ほんが あります。',        en: 'There is a book on the desk.' },
  'あるく':     { jp: 'まいにち さんぽします。',                  en: 'I take a walk every day.' },
  'いい':       { jp: 'てんきが いい です。',                     en: 'The weather is good.' },
  'いう':       { jp: 'にほんごで いって ください。',             en: 'Please say it in Japanese.' },
  'いく':       { jp: 'がっこうに いきます。',                    en: 'I go to school.' },
  'いくら':     { jp: 'これは いくら ですか。',                   en: 'How much is this?' },
  'いし':       { jp: 'みちに いしが あります。',                 en: 'There is a stone on the road.' },
  'いそがしい': { jp: 'きょうは いそがしい です。',               en: 'I am busy today.' },
  'いた':       { jp: 'かべに えが ありました。',                 en: 'There was a picture on the wall.' },
  'いたい':     { jp: 'あしが いたい です。',                     en: 'My leg hurts.' },
  'いち':       { jp: 'いちから じゅうまで かぞえます。',         en: 'I count from one to ten.' },
  'いっしょ':   { jp: 'いっしょに いきましょう。',                en: 'Let\'s go together.' },
  'いつ':       { jp: 'いつ きますか。',                          en: 'When will you come?' },
  'いつも':     { jp: 'いつも にほんごを べんきょうします。',      en: 'I always study Japanese.' },
  'いぬ':       { jp: 'いぬが にわに います。',                   en: 'The dog is in the garden.' },
  'いま':       { jp: 'いまは なんじ ですか。',                   en: 'What time is it now?' },
  'いる':       { jp: 'ねこが います。',                          en: 'There is a cat.' },
  'いれる':     { jp: 'コーヒーを カップに いれます。',            en: 'I put coffee in the cup.' },
  'うえ':       { jp: 'つくえの うえに ほんが あります。',        en: 'The book is on top of the desk.' },
  'うしろ':     { jp: 'わたしの うしろに だれが いますか。',       en: 'Who is behind me?' },
  'うた':       { jp: 'うたを うたいます。',                      en: 'I sing a song.' },
  'うたう':     { jp: 'いっしょに うたいましょう。',              en: 'Let\'s sing together.' },
  'うち':       { jp: 'うちに かえります。',                      en: 'I return home.' },
  'うみ':       { jp: 'なつは うみで およぎます。',               en: 'In summer, I swim in the sea.' },
  'うる':       { jp: 'このみせは やさいを うります。',           en: 'This shop sells vegetables.' },
  'うるさい':   { jp: 'うるさい です。しずかに して ください。',  en: 'It\'s noisy. Please be quiet.' },
  'えいが':     { jp: 'えいがを みます。',                        en: 'I watch a movie.' },
  'えき':       { jp: 'えきまで あるきます。',                    en: 'I walk to the station.' },
  'おおい':     { jp: 'このまちは ひとが おおい です。',          en: 'This town has many people.' },
  'おおきい':   { jp: 'ぞうは おおきい です。',                   en: 'The elephant is big.' },
  'おかあさん': { jp: 'おかあさんは りょうりが じょうずです。',   en: 'My mother is good at cooking.' },
  'おとうさん': { jp: 'おとうさんは まいにち しごとに いきます。', en: 'My father goes to work every day.' },
  'おなか':     { jp: 'おなかが すきました。',                    en: 'I am hungry.' },
  'おなじ':     { jp: 'ふたりは おなじ クラス です。',            en: 'The two of them are in the same class.' },
  'おぼえる':   { jp: 'たんごを おぼえます。',                    en: 'I memorize vocabulary.' },
  'おもい':     { jp: 'このかばんは おもい です。',               en: 'This bag is heavy.' },
  'おもしろい': { jp: 'この えいがは おもしろい です。',          en: 'This movie is interesting.' },
  'およぐ':     { jp: 'うみで およぎます。',                      en: 'I swim in the sea.' },
  'おりる':     { jp: 'つぎの えきで おります。',                 en: 'I get off at the next station.' },
  'おわる':     { jp: 'しごとが おわりました。',                  en: 'Work has ended.' },
  'おんがく':   { jp: 'おんがくを ききます。',                    en: 'I listen to music.' },
  'かいもの':   { jp: 'かいものに いきます。',                    en: 'I go shopping.' },
  'かう':       { jp: 'パンを かいます。',                        en: 'I buy bread.' },
  'かえる':     { jp: 'うちに かえります。',                      en: 'I return home.' },
  'かかる':     { jp: 'いちじかん かかります。',                  en: 'It takes one hour.' },
  'かく':       { jp: 'てがみを かきます。',                      en: 'I write a letter.' },
  'がくせい':   { jp: 'わたしは がくせい です。',                 en: 'I am a student.' },
  'かける':     { jp: 'でんわを かけます。',                      en: 'I make a phone call.' },
  'かさ':       { jp: 'あめですね。かさを もって ください。',      en: 'It\'s raining. Please take an umbrella.' },
  'かす':       { jp: 'ともだちに ほんを かします。',             en: 'I lend a book to my friend.' },
  'かぜ':       { jp: 'きょうは かぜが つよい です。',            en: 'Today the wind is strong.' },
  'かぞく':     { jp: 'わたしの かぞくは さんにん です。',        en: 'My family has three people.' },
  'かたち':     { jp: 'まるい かたち です。',                     en: 'It is a round shape.' },
  'かなしい':   { jp: 'その はなしは かなしい です。',            en: 'That story is sad.' },
  'かばん':     { jp: 'あたらしい かばんを かいました。',         en: 'I bought a new bag.' },
  'からい':     { jp: 'このカレーは からい です。',               en: 'This curry is spicy.' },
  'かりる':     { jp: 'ともだちから ほんを かります。',           en: 'I borrow a book from my friend.' },
  'かわいい':   { jp: 'この ねこは かわいい です。',              en: 'This cat is cute.' },
  'きく':       { jp: 'おんがくを ききます。',                    en: 'I listen to music.' },
  'きれい':     { jp: 'はなは きれい です。',                     en: 'The flower is pretty.' },
  'きをつける': { jp: 'きを つけて ください。',                   en: 'Please be careful.' },
  'くる':       { jp: 'ともだちが きます。',                      en: 'My friend is coming.' },
  'くるま':     { jp: 'くるまで いきます。',                      en: 'I go by car.' },
  'こうえん':   { jp: 'こうえんで あそびます。',                  en: 'I play in the park.' },
  'ごはん':     { jp: 'ごはんを たべます。',                      en: 'I eat rice.' },
  'こども':     { jp: 'こどもが こうえんで あそんでいます。',      en: 'The children are playing in the park.' },
  'こんにちは': { jp: 'こんにちは！おげんきですか。',             en: 'Hello! How are you?' },
  'さむい':     { jp: 'ふゆは さむい です。',                     en: 'Winter is cold.' },
  'さんぽ':     { jp: 'まいにち こうえんを さんぽします。',       en: 'I take a walk in the park every day.' },
  'しごと':     { jp: 'まいにち しごとを します。',               en: 'I work every day.' },
  'しずか':     { jp: 'この へやは しずか です。',               en: 'This room is quiet.' },
  'しずかな':   { jp: 'しずかな まちに すんでいます。',           en: 'I live in a quiet town.' },
  'した':       { jp: 'つくえの したに ねこが います。',          en: 'There is a cat under the desk.' },
  'すき':       { jp: 'わたしは ねこが すき です。',              en: 'I like cats.' },
  'すぐ':       { jp: 'すぐ もどります。',                        en: 'I\'ll be right back.' },
  'すごい':     { jp: 'すごい！よく できました。',                en: 'Amazing! You did well.' },
  'すずしい':   { jp: 'あきは すずしい です。',                   en: 'Autumn is cool.' },
  'すむ':       { jp: 'わたしは とうきょうに すんでいます。',      en: 'I live in Tokyo.' },
  'する':       { jp: 'べんきょうを します。',                    en: 'I study.' },
  'せんせい':   { jp: 'わたしの せんせいは やさしい です。',      en: 'My teacher is kind.' },
  'そと':       { jp: 'そとは さむい です。',                     en: 'It is cold outside.' },
  'たかい':     { jp: 'このかばんは たかい です。',               en: 'This bag is expensive.' },
  'たべる':     { jp: 'ごはんを たべます。',                      en: 'I eat rice.' },
  'ちいさい':   { jp: 'この ねこは ちいさい です。',              en: 'This cat is small.' },
  'ちかい':     { jp: 'えきに ちかい です。',                     en: 'It is close to the station.' },
  'つかう':     { jp: 'パソコンを つかいます。',                  en: 'I use a computer.' },
  'つかれる':   { jp: 'きょうは つかれました。',                  en: 'I got tired today.' },
  'つくる':     { jp: 'ごはんを つくります。',                    en: 'I make rice/food.' },
  'つめたい':   { jp: 'このみずは つめたい です。',               en: 'This water is cold.' },
  'でんしゃ':   { jp: 'でんしゃで いきます。',                    en: 'I go by train.' },
  'でんわ':     { jp: 'でんわを かけます。',                      en: 'I make a phone call.' },
  'ともだち':   { jp: 'ともだちと あそびます。',                  en: 'I play with my friend.' },
  'とる':       { jp: 'しゃしんを とります。',                    en: 'I take a photo.' },
  'なまえ':     { jp: 'わたしの なまえは たなかです。',           en: 'My name is Tanaka.' },
  'にほんご':   { jp: 'にほんごを べんきょうします。',             en: 'I study Japanese.' },
  'ねこ':       { jp: 'いえに ねこが います。',                   en: 'There is a cat at my house.' },
  'ねる':       { jp: 'よる じゅうじに ねます。',                 en: 'I go to sleep at ten at night.' },
  'のむ':       { jp: 'みずを のみます。',                        en: 'I drink water.' },
  'のる':       { jp: 'バスに のります。',                        en: 'I ride the bus.' },
  'はいる':     { jp: 'へやに はいります。',                      en: 'I enter the room.' },
  'はなす':     { jp: 'にほんごで はなします。',                  en: 'I speak in Japanese.' },
  'はやい':     { jp: 'でんしゃは はやい です。',                 en: 'The train is fast.' },
  'はる':       { jp: 'はるは あたたかい です。',                 en: 'Spring is warm.' },
  'ひと':       { jp: 'あのひとは だれ ですか。',                 en: 'Who is that person?' },
  'ひろい':     { jp: 'この こうえんは ひろい です。',            en: 'This park is spacious.' },
  'ふゆ':       { jp: 'ふゆは さむい です。',                     en: 'Winter is cold.' },
  'ほん':       { jp: 'ほんを よみます。',                        en: 'I read a book.' },
  'まいにち':   { jp: 'まいにち べんきょうします。',              en: 'I study every day.' },
  'まえ':       { jp: 'えきの まえで まって ください。',          en: 'Please wait in front of the station.' },
  'みず':       { jp: 'みずを のみます。',                        en: 'I drink water.' },
  'みせ':       { jp: 'あの みせで かいます。',                   en: 'I buy at that shop.' },
  'みる':       { jp: 'テレビを みます。',                        en: 'I watch TV.' },
  'むずかしい': { jp: 'にほんごは むずかしい です。',             en: 'Japanese is difficult.' },
  'めがね':     { jp: 'めがねを かけます。',                      en: 'I wear glasses.' },
  'もつ':       { jp: 'かばんを もちます。',                      en: 'I carry a bag.' },
  'やさしい':   { jp: 'せんせいは やさしい です。',               en: 'The teacher is kind.' },
  'やすい':     { jp: 'この ほんは やすい です。',                en: 'This book is cheap.' },
  'やすむ':     { jp: 'きょう やすみます。',                      en: 'I will rest today.' },
  'ゆっくり':   { jp: 'ゆっくり はなして ください。',             en: 'Please speak slowly.' },
  'よむ':       { jp: 'ほんを よみます。',                        en: 'I read a book.' },
  'よる':       { jp: 'よるは すずしい です。',                   en: 'It is cool at night.' },
  'わかる':     { jp: 'にほんごが わかります。',                  en: 'I understand Japanese.' },
  'わたし':     { jp: 'わたしは がくせい です。',                 en: 'I am a student.' },
  'ひく':       { jp: 'ピアノを ひきます。',                      en: 'I play the piano.' },
  'でる':       { jp: 'うちを でます。',                          en: 'I leave the house.' },
  'きく':       { jp: 'せんせいに ききます。',                    en: 'I ask the teacher.' },
  'おく':       { jp: 'ほんを つくえの うえに おきます。',        en: 'I put the book on the desk.' },
  'もらう':     { jp: 'ともだちから プレゼントを もらいました。',  en: 'I received a present from a friend.' },
  'あげる':     { jp: 'ともだちに プレゼントを あげます。',       en: 'I give a present to my friend.' },
  'くれる':     { jp: 'ともだちが プレゼントを くれました。',      en: 'My friend gave me a present.' },
  'かけ': { jp: 'めがねを かけます。', en: 'I put on glasses.' },
  'おきる':     { jp: 'まいあさ しちじに おきます。',             en: 'I wake up at 7 every morning.' },
  'ねむい':     { jp: 'ねむい です。ねます。',                    en: 'I am sleepy. I will sleep.' },
  'たのしい':   { jp: 'パーティーは たのしかった です。',          en: 'The party was fun.' },
  'いそぐ':     { jp: 'いそいで ください。',                      en: 'Please hurry.' },
  'ちょっと':   { jp: 'ちょっと まって ください。',               en: 'Please wait a moment.' },
  'もう':       { jp: 'もう たべました。',                        en: 'I already ate.' },
  'まだ':       { jp: 'まだ おきています。',                      en: 'I am still awake.' },
  'もちろん':   { jp: 'もちろん いきます。',                      en: 'Of course I will go.' },
  'たぶん':     { jp: 'たぶん あめが ふります。',                 en: 'It will probably rain.' },
  'すこし':     { jp: 'すこし まって ください。',                 en: 'Please wait a little.' },
  'とても':     { jp: 'とても たのしかった です。',               en: 'It was very fun.' },
  'でも':       { jp: 'いきたい です。でも あめです。',           en: 'I want to go. But it is raining.' },
  'そして':     { jp: 'ごはんを たべます。そして ねます。',       en: 'I eat. Then I sleep.' },
  'だから':     { jp: 'あめです。だから いきません。',            en: 'It is raining. So I won\'t go.' },
  'でんき':     { jp: 'でんきを けして ください。',               en: 'Please turn off the light.' },
  'ドア':       { jp: 'ドアを あけて ください。',                 en: 'Please open the door.' },
  'テレビ':     { jp: 'テレビを みます。',                        en: 'I watch TV.' },
  'ラジオ':     { jp: 'ラジオを ききます。',                      en: 'I listen to the radio.' },
  'バス':       { jp: 'バスに のります。',                        en: 'I ride the bus.' },
  'タクシー':   { jp: 'タクシーで いきます。',                    en: 'I go by taxi.' },
  'レストラン': { jp: 'レストランで たべます。',                   en: 'I eat at a restaurant.' },
  'コーヒー':   { jp: 'コーヒーを のみます。',                    en: 'I drink coffee.' },
  'パン':       { jp: 'あさ パンを たべます。',                   en: 'I eat bread in the morning.' },
  'ケーキ':     { jp: 'ケーキを たべます。',                      en: 'I eat cake.' },
  'ジュース':   { jp: 'ジュースを のみます。',                    en: 'I drink juice.' },
  'カメラ':     { jp: 'カメラで しゃしんを とります。',           en: 'I take photos with a camera.' },
};

// Update vocabulary table with examples, matching on the reading column
const update = db.prepare(`
  UPDATE vocabulary SET example_jp = ?, example_en = ? WHERE reading = ? AND example_jp IS NULL
`);

let updated = 0;
const applyExamples = db.transaction(() => {
  for (const [reading, ex] of Object.entries(EXAMPLES)) {
    const result = update.run(ex.jp, ex.en, reading);
    updated += result.changes;
  }
});
applyExamples();
console.log(`✓ Populated ${updated} example sentences (hiragana-only)`);

// Also try matching on the expression itself for kana-only words
const updateByExpr = db.prepare(`
  UPDATE vocabulary SET example_jp = ?, example_en = ? WHERE japanese = ? AND example_jp IS NULL
`);
let updated2 = 0;
const applyByExpr = db.transaction(() => {
  for (const [reading, ex] of Object.entries(EXAMPLES)) {
    const result = updateByExpr.run(ex.jp, ex.en, reading);
    updated2 += result.changes;
  }
});
applyByExpr();
console.log(`✓ Populated ${updated2} more via expression match`);

const total = db.prepare('SELECT COUNT(*) as n FROM vocabulary WHERE example_jp IS NOT NULL').get().n;
console.log(`\n✅ Done! ${total} / ${db.prepare('SELECT COUNT(*) as n FROM vocabulary').get().n} words have examples.`);
db.close();
