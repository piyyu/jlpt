'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, CheckSquare, Square } from 'lucide-react';
import { toRomajiParts, toRomaji } from '@/lib/toRomaji';
import AudioButton from '@/components/AudioButton';

export default function QuizCard({
  prompt,
  hint,
  options = [],
  correctAnswer,
  onAnswer,
  index,
  total,
  details,
  content_type,
}) {
  const [selected, setSelected] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const answered = selected !== null;

  /* ------------------------------------------------------------------
   * Load saved-state once an answer is given
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (answered && details && content_type) {
      fetch(`/api/selections?type=${content_type}`)
        .then((r) => r.json())
        .then((ids) => setIsSaved(ids.includes(details.id)))
        .catch(() => {});
    }
  }, [answered, details, content_type]);

  async function toggleSelection(e) {
    e.stopPropagation();
    if (!details) return;
    const next = !isSaved;
    setIsSaved(next);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type, content_id: details.id, selected: next }),
    });
  }

  /* ------------------------------------------------------------------
   * Answer handler (only once per question)
   * ------------------------------------------------------------------ */
  const handleSelect = useCallback(
    (option) => {
      if (answered) return;
      setSelected(option);
      // if no details panel → auto-advance immediately
      if (!details) onAnswer(option === correctAnswer);
    },
    [answered, details, correctAnswer, onAnswer],
  );

  /* ------------------------------------------------------------------
   * Keyboard: 1-4 to pick, Enter to advance
   * ------------------------------------------------------------------ */
  useEffect(() => {
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (answered && details && e.key === 'Enter') {
        onAnswer(selected === correctAnswer);
        setSelected(null);
        return;
      }

      if (!answered && options.length > 0) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < options.length) handleSelect(options[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, details, options, selected, correctAnswer, onAnswer, handleSelect]);

  /* ------------------------------------------------------------------
   * Option button style
   * ------------------------------------------------------------------ */
  function optionStyle(option) {
    if (!answered) {
      return {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-1)',
        cursor: 'pointer',
      };
    }
    if (option === correctAnswer) {
      return { background: 'rgba(68,221,170,0.12)', border: '1px solid #44ddaa', color: '#44ddaa' };
    }
    if (option === selected) {
      return { background: 'rgba(255,60,80,0.1)', border: '1px solid rgba(255,60,80,0.5)', color: '#ff3c50' };
    }
    return {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      color: 'var(--text-3)',
      opacity: 0.4,
    };
  }

  /* ------------------------------------------------------------------
   * Helper: parse "word (reading)" example strings
   * ------------------------------------------------------------------ */
  function parseExWord(ex) {
    if (!ex) return null;
    const m = ex.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { word: m[1], reading: m[2] } : { word: ex, reading: null };
  }

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <div className="rounded-xl p-8 max-w-xl mx-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

      {/* Progress bar */}
      {index != null && total != null && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((index - 1) / total) * 100}%`, background: 'var(--pink)' }}
            />
          </div>
          <span className="text-xs shrink-0 font-mono" style={{ color: 'var(--text-3)' }}>{index}/{total}</span>
        </div>
      )}

      {/* Prompt */}
      <div className="text-center mb-8 px-4">
        <p
          className="font-japanese font-bold mb-2"
          style={{ fontSize: content_type === 'grammar' ? '28px' : '72px', lineHeight: 1.1, color: 'var(--text-1)' }}
        >
          {prompt}
        </p>
        {hint && <p className="font-japanese text-sm mt-2" style={{ color: 'var(--text-3)' }}>{hint}</p>}
      </div>

      {/* Options */}
      <div className="space-y-2 mb-6">
        {options.map((option, i) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            className="w-full flex items-center justify-between px-4 py-4 rounded-lg font-japanese text-lg font-medium transition-all text-left"
            style={optionStyle(option)}
          >
            <span className="flex items-center gap-3">
              <span
                className="shrink-0 w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'inherit', minWidth: 24 }}
              >
                {i + 1}
              </span>
              {option}
            </span>
            {answered && option === correctAnswer && <CheckCircle size={16} style={{ color: '#44ddaa' }} />}
            {answered && option === selected && option !== correctAnswer && <XCircle size={16} style={{ color: '#ff6666' }} />}
          </button>
        ))}
      </div>

      {/* ── Detail panel (after answering) ───────────────────────────── */}
      {answered && details && (
        <div className="rounded-xl p-6 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,0,128,0.2)' }}>
          <div className="flex items-start gap-6">

            {/* Left: big character + controls */}
            <div className="text-center shrink-0 w-24">
              <p className="font-japanese font-bold leading-none" style={{ fontSize: '56px', color: 'var(--text-1)' }}>
                {content_type === 'kanji' ? details.character : details.japanese}
              </p>

              {content_type === 'kanji' && details.stroke_count && (
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--pink)' }}>{details.stroke_count} strokes</p>
              )}
              {content_type === 'vocabulary' && details.type && (
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-3)' }}>{details.type}</p>
              )}

              <div className="mt-3 flex flex-col gap-2 items-center">
                <button
                  onClick={toggleSelection}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-all font-medium"
                  style={
                    isSaved
                      ? { background: 'rgba(255,0,128,0.15)', border: '1px solid rgba(255,0,128,0.4)', color: 'var(--pink)' }
                      : { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-3)' }
                  }
                >
                  {isSaved ? <><CheckSquare size={11} /> Selected</> : <><Square size={11} /> Select</>}
                </button>
                <AudioButton text={content_type === 'kanji' ? details.character : details.japanese} />
              </div>
            </div>

            {/* Right: details grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">

              {/* ── Vocabulary ── */}
              {content_type === 'vocabulary' && (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Reading</p>
                    <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>{details.reading}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomaji(details.reading)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Meaning</p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{details.english}</p>
                  </div>
                  {(details.example_jp || details.example_en) && (
                    <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Example</p>
                      <p className="font-japanese font-medium" style={{ color: 'var(--text-1)' }}>{details.example_jp}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{details.example_en}</p>
                    </div>
                  )}
                </>
              )}

              {/* ── Kanji ── */}
              {content_type === 'kanji' && (
                <>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Meaning</p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{details.meaning}</p>
                  </div>
                  {details.on_yomi && (
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>
                        On-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(音読み)</span>
                      </p>
                      <p className="font-japanese font-semibold" style={{ color: 'var(--text-1)' }}>{details.on_yomi}</p>
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(details.on_yomi)}</p>
                    </div>
                  )}
                  {details.kun_yomi && (
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>
                        Kun-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(訓読み)</span>
                      </p>
                      <p className="font-japanese font-semibold" style={{ color: 'var(--text-1)' }}>{details.kun_yomi}</p>
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(details.kun_yomi)}</p>
                    </div>
                  )}
                  {(details.example_word1 || details.example_word2) && (
                    <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Example Words</p>
                      <div className="flex flex-wrap gap-6">
                        {[details.example_word1, details.example_word2].filter(Boolean).map((ex, i) => {
                          const parsed = parseExWord(ex);
                          return (
                            <div key={i} className="flex flex-col">
                              <span className="font-japanese text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{parsed.word}</span>
                              {parsed.reading && (
                                <>
                                  <span className="font-japanese text-xs" style={{ color: 'var(--text-3)' }}>{parsed.reading}</span>
                                  <span className="font-mono text-xs" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(parsed.reading)}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Grammar ── */}
              {content_type === 'grammar' && (
                <>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Pattern</p>
                    <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>{details.pattern}</p>
                  </div>
                  {(details.example1_jp || details.example1_en) && (
                    <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Example 1</p>
                      <p className="font-japanese font-medium" style={{ color: 'var(--text-1)' }}>{details.example1_jp}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{details.example1_en}</p>
                    </div>
                  )}
                  {(details.example2_jp || details.example2_en) && (
                    <div className="col-span-2" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Example 2</p>
                      <p className="font-japanese font-medium" style={{ color: 'var(--text-1)' }}>{details.example2_jp}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{details.example2_en}</p>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Next Question button */}
      {answered && details && (
        <button
          onClick={() => { onAnswer(selected === correctAnswer); setSelected(null); }}
          className="w-full py-3 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--text-1)', color: 'var(--bg-base)' }}
        >
          Next Question → <span className="opacity-50 text-xs font-normal ml-2">Press Enter ↵</span>
        </button>
      )}
    </div>
  );
}
