/**
 * Converts hiragana/katakana to romaji.
 * Handles: basic kana, dakuten, combination chars (きゃ→kya), っ (double consonant), ん.
 */

// Katakana → hiragana (Unicode offset 0x60)
function toHiragana(str) {
  return str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// Multi-char combinations must come first
const MAP = {
  // ── Combinations ──────────────────────────────────
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja', 'じゅ':'ju', 'じょ':'jo',
  'ぢゃ':'ja', 'ぢゅ':'ju', 'ぢょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  // ── Basic ─────────────────────────────────────────
  'あ':'a',  'い':'i',  'う':'u',  'え':'e',  'お':'o',
  'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi','す':'su', 'せ':'se', 'そ':'so',
  'た':'ta', 'ち':'chi','つ':'tsu','て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
  'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
  'や':'ya', 'ゆ':'yu', 'よ':'yo',
  'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  'わ':'wa', 'を':'wo', 'ん':'n',
  // ── Dakuten ───────────────────────────────────────
  'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
  'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do',
  'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
  // ── Small vowels ──────────────────────────────────
  'ぁ':'a',  'ぃ':'i',  'ぅ':'u',  'ぇ':'e',  'ぉ':'o',
  'ゃ':'ya', 'ゅ':'yu', 'ょ':'yo',
};

export function toRomaji(input) {
  if (!input) return '';
  // Convert katakana → hiragana first
  const str = toHiragana(input);
  let result = '';
  let i = 0;
  while (i < str.length) {
    // Double-consonant small tsu
    if (str[i] === 'っ') {
      const next = MAP[str.slice(i + 1, i + 3)] || MAP[str[i + 1]] || '';
      result += next[0] || '';
      i++;
      continue;
    }
    // Long vowel mark ー
    if (str[i] === 'ー') {
      result += result.slice(-1);
      i++;
      continue;
    }
    // Try 2-char combo first
    const two = str.slice(i, i + 2);
    if (MAP[two]) {
      result += MAP[two];
      i += 2;
      continue;
    }
    // Single char
    const one = str[i];
    const code = one.charCodeAt(0);
    if (MAP[one]) {
      result += MAP[one];
    } else if (one === '・' || one === '　' || one === ' ') {
      result += ' ';
    } else if (one === '。' || one === '、' || one === '！' || one === '？') {
      // Skip Japanese punctuation in romaji
    } else if (
      // Skip CJK kanji (U+4E00–U+9FFF) — no romaji without dictionary
      code >= 0x4e00 && code <= 0x9fff
    ) {
      // silently skip — kanji cannot be converted without a dictionary
    } else {
      result += one;
    }
    i++;
  }
  // Clean up multiple spaces
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Takes a reading like "せんせい" or "セン・ジ" and returns "sensei" or "sen / ji"
 * Splits on ・ or / and converts each part.
 */
export function toRomajiParts(input) {
  if (!input) return '';
  return input
    .split(/[・／/]/)
    .map((part) => toRomaji(part.trim()))
    .filter(Boolean)
    .join(' · ');
}
