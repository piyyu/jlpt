'use client';

/**
 * FuriganaText — renders Japanese text with optional furigana (ruby annotation).
 * Accepts an array of { base, furigana } pairs or a plain string.
 *
 * Usage:
 *   <FuriganaText text="日本語" reading="にほんご" show={true} />
 *   <FuriganaText pairs={[{ base: '日本', furigana: 'にほん' }, { base: '語', furigana: 'ご' }]} show={true} />
 */
export default function FuriganaText({ text, reading, pairs, show = true, className = '' }) {
  if (pairs) {
    return (
      <ruby className={`font-japanese ${className}`}>
        {pairs.map(({ base, furigana }, i) => (
          <span key={i}>
            {base}
            {show && furigana && <rt className="text-[0.6em] text-zinc-400">{furigana}</rt>}
          </span>
        ))}
      </ruby>
    );
  }

  if (!show || !reading) {
    return <span className={`font-japanese ${className}`}>{text}</span>;
  }

  return (
    <ruby className={`font-japanese ${className}`}>
      {text}
      <rt className="text-[0.6em] text-zinc-400">{reading}</rt>
    </ruby>
  );
}
