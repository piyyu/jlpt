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
  'ぴゃ':'pya','ぴゅ':'pu','ぴょ':'pyo',
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

// Particles mapping
const PARTICLES = {
  'は': 'wa',
  'が': 'ga',
  'に': 'ni',
  'を': 'o',
  'へ': 'e',
  'と': 'to',
  'で': 'de',
  'も': 'mo',
  'か': 'ka',
};

export function toRomaji(input) {
  if (!input) return '';
  const str = toHiragana(input);
  const isSentence = str.length > 6 || /[\u4e00-\u9fff]/.test(input) || /[。、！？]/.test(str);
  
  let result = '';
  let i = 0;
  while (i < str.length) {
    const char = str[i];

    // CHECK FOR COMMON SUFFIXES FIRST (to ensure proper spacing)
    const next2 = str.slice(i, i + 2);
    const next3 = str.slice(i, i + 3);
    const next4 = str.slice(i, i + 4);
    
    if (isSentence) {
      if (next4 === 'ました' || next4 === 'ましょう') {
        if (result.length > 0 && !result.endsWith(' ')) result += ' ';
        result += (next4 === 'ました' ? 'mashita' : 'mashou') + ' ';
        i += 4; continue;
      }
      if (next3 === 'でした' || next3 === 'なさい') {
        if (result.length > 0 && !result.endsWith(' ')) result += ' ';
        result += (next3 === 'でした' ? 'deshita' : 'nasai') + ' ';
        i += 3; continue;
      }
      if (next2 === 'です' || next2 === 'ます') {
        if (result.length > 0 && !result.endsWith(' ')) result += ' ';
        result += (next2 === 'です' ? 'desu' : 'masu') + ' ';
        i += 2; continue;
      }
    }

    // If it's a particle and we are in a sentence context, add spaces
    if (PARTICLES[char] && isSentence) {
      // HEURISTIC: A particle in a sentence is usually:
      // 1. Preceded by a non-space character (the word it attaches to)
      // 2. Followed by a space, punctuation, or end of string.
      const nextChar = str[i + 1] || '';
      const prevChar = i > 0 ? str[i - 1] : '';
      
      const isActuallyParticle = 
        (prevChar && prevChar !== ' ' && prevChar !== '　') && // Must be attached to a word
        (!nextChar || nextChar === ' ' || nextChar === '　' || '。、！？'.includes(nextChar));

      if (isActuallyParticle) {
        // Logic: add space before if not at start, add space after if not at end
        if (result.length > 0 && !result.endsWith(' ')) result += ' ';
        result += PARTICLES[char];
        if (i < str.length - 1 && str[i+1] !== ' ') result += ' ';
        i++;
        continue;
      }
    }
    
    // Special case for particles even in short strings ONLY if they are likely particles
    // For single vocab words, we should generally NOT treat the first char as a particle 
    // unless the entire input is just the particle itself.
    if (PARTICLES[char] && str.length === 1) {
       result += PARTICLES[char];
       i++;
       continue;
    }

    if (char === 'っ') {
      const next = MAP[str.slice(i + 1, i + 3)] || MAP[str[i + 1]] || '';
      result += next[0] || '';
      i++;
      continue;
    }
    if (char === 'ー') {
      result += result.slice(-1);
      i++;
      continue;
    }
    const two = str.slice(i, i + 2);
    if (MAP[two]) {
      result += MAP[two];
      i += 2;
      continue;
    }
    const one = char;
    const code = one.charCodeAt(0);
    if (MAP[one]) {
      result += MAP[one];
    } else if (one === '・' || one === '　' || one === ' ') {
      result += ' ';
    } else if (one === '。' || one === '、' || one === '！' || one === '？') {
      result += ' ';
    } else if (code >= 0x4e00 && code <= 0x9fff) {
      // skip kanji
    } else {
      result += one;
    }
    i++;
  }
  
  // Standardize particles that were converted as basic kana if not caught above
  // (e.g. 'は' -> 'wa' instead of 'ha')
  // We'll do this in the result string for simplicity
  // But wait, 'ha' could be part of a word like 'ohayou'
  
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
