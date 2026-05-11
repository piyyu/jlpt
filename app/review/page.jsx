'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import AudioButton from '@/components/AudioButton';
import { CheckCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { useSettings } from '@/lib/useSettings';
import { toRomaji, toRomajiParts } from '@/lib/toRomaji';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fisherYates(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct, pool) {
  const distractors = fisherYates(pool.filter((ans) => ans !== correct)).slice(0, 3);
  return fisherYates([correct, ...distractors]);
}

// SM-2 interval preview (client-side estimate so user sees what will happen)
function previewInterval(label, card) {
  const ef    = card?.ease_factor ?? 2.5;
  const rep   = card?.repetitions ?? 0;
  const inter = card?.interval_days ?? 1;
  if (label === 'again') return '1 day';
  if (label === 'hard')  return `${Math.max(1, Math.round(inter * 1.2))} days`;
  if (label === 'good') {
    if (rep === 0) return '1 day';
    if (rep === 1) return '6 days';
    return `${Math.round(inter * ef)} days`;
  }
  if (label === 'easy') {
    if (rep === 0) return '4 days';
    if (rep === 1) return '9 days';
    return `${Math.round(inter * ef * 1.3)} days`;
  }
  return '?';
}

// ─── Difficulty button config ─────────────────────────────────────────────────
const RATINGS = [
  { label: 'again', jp: 'もう一度', key: '1', color: '#ff3c50', bg: 'rgba(255,60,80,0.1)',   border: 'rgba(255,60,80,0.4)'   },
  { label: 'hard',  jp: '難しい',   key: '2', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.4)' },
  { label: 'good',  jp: 'よかった', key: '3', color: '#44ddaa', bg: 'rgba(68,221,170,0.1)', border: 'rgba(68,221,170,0.4)' },
  { label: 'easy',  jp: '簡単',     key: '4', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.4)' },
];

// ─── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  { type: 'vocabulary', jp: '単語', label: 'Vocabulary', sub: 'N5 words', icon: '言' },
  { type: 'kanji',      jp: '漢字', label: 'Kanji',      sub: 'N5 characters', icon: '字' },
];

// ─── Category Picker ──────────────────────────────────────────────────────────
function CategoryPicker({ counts, available, limits, onSelect }) {
  const totalDue = (counts.vocabulary || 0) + (counts.kanji || 0);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--text-1)' }}>復習</h1>
        <p className="text-sm mt-2 opacity-60" style={{ color: 'var(--text-2)' }}>
          Review your cards to strengthen your memory
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-8">
        {CATEGORIES.map((cat) => {
          const due = counts[cat.type] || 0;
          const avail = available[cat.type] || 0;
          const limit = limits[cat.type] || 0;

          return (
            <button
              key={cat.label}
              onClick={() => onSelect(cat)}
              disabled={avail === 0 || limit === 0}
              className="rounded-2xl p-8 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { if (avail > 0 && limit > 0) { e.currentTarget.style.borderColor = 'rgba(255,0,128,0.4)'; e.currentTarget.style.background = 'rgba(255,0,128,0.05)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center font-japanese font-bold text-3xl"
                  style={{ background: avail > 0 && limit > 0 ? 'rgba(255,0,128,0.1)' : 'var(--bg-elevated)', color: avail > 0 && limit > 0 ? 'var(--pink)' : 'var(--text-3)', border: `1px solid ${avail > 0 && limit > 0 ? 'rgba(255,0,128,0.25)' : 'var(--border)'}` }}>
                  {cat.icon}
                </div>
                {avail > 0 && limit > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Available</p>
                    <p className="text-xl font-bold font-mono">{Math.min(avail, limit)}</p>
                  </div>
                )}
                {limit === 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Done Today</p>
                    <p className="text-xl font-bold font-mono">50/50</p>
                  </div>
                )}
              </div>

              <p className="font-japanese text-sm mb-1" style={{ color: 'var(--text-3)' }}>{cat.jp}</p>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>{cat.label} Review</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>{cat.sub}</p>

              <div className="flex items-center justify-between pt-4 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-japanese" style={{ color: due > 0 ? 'var(--pink)' : 'var(--text-3)' }}>{due}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>Total Due</span>
                </div>
                <div className="text-[10px] opacity-60">{50 - limit}/50 reviewed</div>
              </div>
            </button>
          );
        })}
      </div>

      {limits.vocabulary === 0 && limits.kanji === 0 && (
        <div className="mt-8 text-center max-w-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <p className="font-japanese text-xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>今日の目標達成！</p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            You have reached your 50-card limit for both categories. <br/>
            Excellent work! Please <strong>try again tomorrow</strong>.
          </p>
        </div>
      )}

      {totalDue === 0 && (
        <div className="mt-8 text-center max-w-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <p className="font-japanese text-xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>完璧！</p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>You have no cards due for review today. Come back tomorrow!</p>
        </div>
      )}
    </div>
  );
}

// ─── Detail panel (shown after answering) ─────────────────────────────────────
function DetailPanel({ card, isCorrect, onRate, showEnglish }) {
  const isKanji = card.content_type === 'kanji';

  function parseExample(ex) {
    if (!ex) return null;
    const m = ex.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { word: m[1], reading: m[2] } : { word: ex, reading: null };
  }

  const ex1 = parseExample(card.hint);
  const ex2 = parseExample(card.hint2);

  return (
    <div className="mt-4 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${isCorrect ? 'rgba(68,221,170,0.3)' : 'rgba(255,60,80,0.3)'}` }}>
      {/* Result bar */}
      <div className="px-5 py-3 flex items-center gap-3"
        style={{ background: isCorrect ? 'rgba(68,221,170,0.08)' : 'rgba(255,60,80,0.08)' }}>
        <span className="text-sm font-semibold" style={{ color: isCorrect ? '#44ddaa' : '#ff3c50' }}>
          {isCorrect ? '✓ Correct!' : '✗ Wrong'}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>
          Answer: <strong className="font-japanese font-medium" style={{ color: 'var(--pink)' }}>{card.drill_answer}</strong> 
          {!isKanji && <span style={{opacity: 0.7, marginLeft: '8px'}}>({card.front})</span>}
        </span>
      </div>

      {/* Word detail */}
      <div className="px-5 py-4 grid grid-cols-1 gap-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="flex items-start gap-6">
          <div className="shrink-0 text-center">
            <p className="font-japanese font-bold leading-none" style={{ fontSize: '52px', color: 'var(--text-1)' }}>
              {isKanji ? card.front : card.front}
            </p>
            {!isKanji && (
              <div className="mt-2">
                <p className="font-japanese text-sm" style={{ color: 'var(--text-3)' }}>{card.reading}</p>
                <p className="font-mono text-xs opacity-60" style={{ color: 'var(--pink)' }}>{toRomaji(card.reading)}</p>
              </div>
            )}
            {isKanji && (
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(card.reading)}</p>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Meaning</p>
              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{card.back}</p>
            </div>
            {isKanji && card.on_yomi && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>On-yomi</p>
                <p className="font-japanese font-semibold" style={{ color: 'var(--text-1)' }}>{card.on_yomi}</p>
                {showEnglish && <p className="font-mono text-xs" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(card.on_yomi)}</p>}
              </div>
            )}
            {isKanji && card.reading && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Kun-yomi</p>
                <p className="font-japanese font-semibold" style={{ color: 'var(--text-1)' }}>{card.reading}</p>
                {showEnglish && <p className="font-mono text-xs" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(card.reading)}</p>}
              </div>
            )}
            {isKanji && card.stroke_count && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-3)' }}>Strokes</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{card.stroke_count}</p>
              </div>
            )}
            {(ex1 || ex2) && (
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                  {isKanji ? 'Example words' : 'Example sentence'}
                </p>
                <div className="flex flex-wrap gap-4">
                  {[ex1, ex2].filter(Boolean).map((ex, i) => (
                    <div key={i}>
                      <span className="font-japanese text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{ex.word}</span>
                      {ex.reading && (
                        <>
                          <span className="font-japanese text-xs ml-1" style={{ color: 'var(--text-3)' }}>{ex.reading}</span>
                          {showEnglish && <span className="font-mono text-xs ml-1" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomaji(ex.reading)}</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0"><AudioButton text={card.front} /></div>
        </div>
      </div>

      {/* ── Difficulty rating ── */}
      <div className="px-5 py-4" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <p className="text-xs mb-3 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
          <span>How well did you know this?</span>
          <span className="font-mono" style={{ color: 'var(--text-3)', opacity: 0.6 }}>Press 1–4</span>
        </p>
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.label}
              onClick={() => onRate(r.label)}
              className="rounded-lg py-3 px-2 flex flex-col items-center gap-1 transition-all font-semibold text-xs"
              style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.color }}
              onMouseEnter={(e) => { e.currentTarget.style.background = r.bg.replace('0.1', '0.2'); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = r.bg; }}
            >
              <span className="text-sm font-bold">{r.key}</span>
              <span className="font-japanese text-xs">{r.jp}</span>
              <span style={{ color: r.color, opacity: 0.7, fontSize: 10 }}>
                {previewInterval(r.label, card)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Drill ───────────────────────────────────────────────────────────────
function QuizDrill({ category, pools, onBack }) {
  const [cards, setCards]       = useState([]);
  const [index, setIndex]       = useState(0);
  const [chosen, setChosen]     = useState(null);    // answer string picked
  const [rated, setRated]       = useState(false);   // difficulty submitted
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState({ correct: 0, total: 0 });
  const { showEnglish } = useSettings();

  const fetchCards = useCallback(() => {
    setLoading(true);
    const url = category.type ? `/api/review/due?type=${category.type}` : '/api/review/due';
    fetch(url).then((r) => r.json()).then((d) => { setCards(d.cards); setLoading(false); });
  }, [category]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const current = cards[index];
  const pool = useMemo(() => {
    if (!current) return [];
    if (current.content_type === 'kanji') return pools.kanji || [];
    // For vocabulary, check if answer is English or Japanese
    const isJapanese = /[ぁ-んァ-ン]/.test(current.drill_answer);
    return isJapanese ? pools.vocabulary_reading : pools.vocabulary_english;
  }, [current, pools]);

  const options = useMemo(
    () => (current && current.drill_answer ? buildOptions(current.drill_answer, pool) : []),
    [current, pool],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // Don't fire on input fields
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key;

      if (!chosen) {
        // Phase 1: pick answer (1-4 maps to options A-D)
        const idx = parseInt(key, 10) - 1;
        if (idx >= 0 && idx <= 3 && options[idx] !== undefined) {
          handleAnswer(options[idx]);
        }
      } else if (!rated) {
        // Phase 2: pick difficulty (1-4 = Again/Hard/Good/Easy)
        const ratingIdx = parseInt(key, 10) - 1;
        if (ratingIdx >= 0 && ratingIdx <= 3) {
          handleRate(RATINGS[ratingIdx].label);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, rated, options, current]);

  function handleAnswer(answer) {
    if (chosen || !current) return;
    setChosen(answer);
    const isCorrect = answer === current.drill_answer;
    setStats((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    // Don't submit SRS yet — wait for difficulty rating
  }

  async function handleRate(ratingLabel) {
    if (rated || !current) return;
    setRated(true);

    // Submit SRS with the user-chosen difficulty label
    await fetch('/api/review/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: current.id, label: ratingLabel }),
    });

    // Advance after a brief pause so user sees the button light up
    setTimeout(() => {
      if (index + 1 >= cards.length) {
        setDone(true);
      } else {
        setIndex(index + 1);
        setChosen(null);
        setRated(false);
      }
    }, 250);
  }

  function optStyle(opt) {
    if (!chosen) return {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      color: 'var(--text-1)',
      cursor: 'pointer',
    };
    const isCorrect = opt === current.drill_answer;
    const isPicked  = opt === chosen;
    if (isCorrect) return { background: 'rgba(68,221,170,0.12)', border: '1px solid #44ddaa', color: '#44ddaa' };
    if (isPicked)  return { background: 'rgba(255,60,80,0.1)', border: '1px solid rgba(255,60,80,0.5)', color: '#ff3c50' };
    return { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-3)', opacity: 0.35, cursor: 'default' };
  }

  function restart() {
    setIndex(0); setChosen(null); setRated(false); setDone(false);
    setStats({ correct: 0, total: 0 });
    fetchCards();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 p-1.5 rounded-md transition-colors shrink-0"
          style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pink)'; e.currentTarget.style.borderColor = 'rgba(255,0,128,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>{category.jp} · クイズ</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>{category.label}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Quiz — {cards.length} cards due</p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center font-japanese text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
      ) : done || cards.length === 0 ? (
        /* ── Done screen ── */
        <div className="max-w-sm mx-auto rounded-xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,0,128,0.2)' }}>
          <CheckCircle size={40} className="mx-auto mb-4" style={{ color: '#44ddaa' }} />
          <p className="font-japanese text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>
            {cards.length === 0 ? '完璧！' : 'お疲れ様！'}
          </p>
          <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>
            {cards.length === 0 ? 'No cards due.' : `${stats.correct} / ${stats.total} correct`}
          </p>
          {stats.total > 0 && (
            <p className="font-japanese text-4xl font-bold mb-6" style={{ color: 'var(--pink)' }}>
              {Math.round((stats.correct / stats.total) * 100)}点
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <button onClick={restart} className="btn-secondary flex items-center gap-2"><RotateCcw size={13} /> もう一度</button>
            <button onClick={onBack} className="btn-secondary flex items-center gap-2"><ArrowLeft size={13} /> カテゴリ</button>
          </div>
        </div>
      ) : current ? (
        <div className="max-w-xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(index / cards.length) * 100}%`, background: 'var(--pink)' }} />
            </div>
            <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-3)' }}>{index + 1}/{cards.length}</span>
            <span className="text-xs font-mono shrink-0" style={{ color: '#44ddaa' }}>{stats.correct}✓</span>
          </div>

          {/* Question card */}
          {(() => {
            const isVocab = current.content_type === 'vocabulary';
            // For vocab, always use English meaning (back). For Kanji, keep the recognition mode.
            const useRecognition = !isVocab && (current.id % 2 !== 0);

            const promptText = isVocab ? current.back : (useRecognition ? current.front : current.back);
            const instruction = isVocab ? '単語 — Translate to Japanese' : (useRecognition ? '漢字 — How do you read this?' : '漢字 — What does this mean?');
            const isBig = !isVocab && useRecognition;

            return (
              <div className="rounded-xl p-8 text-center mb-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="font-japanese text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
                  {instruction}
                </p>
                <p className={`${isBig ? 'font-japanese font-bold' : (isVocab ? 'font-sans font-bold' : 'font-semibold')} mb-2`}
                   style={{ fontSize: isBig ? '72px' : (isVocab ? '28px' : '40px'), lineHeight: 1.1, color: 'var(--text-1)' }}>
                  {promptText}
                </p>
              </div>
            );
          })()}

          {/* Answer options */}
          {!chosen && (
            <p className="text-center text-xs mb-2 font-mono" style={{ color: 'var(--text-3)', opacity: 0.6 }}>
              Click or press 1 · 2 · 3 · 4
            </p>
          )}
          <div className="space-y-2 mb-2">
            {options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={!!chosen}
                className="w-full flex items-center px-4 py-4 rounded-xl text-lg font-japanese font-medium text-left transition-all gap-3"
                style={optStyle(opt)}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'inherit', minWidth: 24 }}
                >
                  {i + 1}
                </span>
                <span>
                  {opt}
                  {current.content_type === 'vocabulary' && chosen && (
                    <span className="opacity-40 text-sm ml-2 font-mono font-normal animate-in fade-in slide-in-from-left-1 duration-300">
                      ({toRomaji(opt)})
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Detail + difficulty rating panel (appears after answering) */}
          {chosen && (
            <DetailPanel
              card={current}
              isCorrect={chosen === current.drill_answer}
              onRate={handleRate}
              showEnglish={showEnglish}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const [counts, setCounts]       = useState({});
  const [available, setAvailable] = useState({});
  const [limits, setLimits]       = useState({});
  const [pools, setPools]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  function loadCounts() {
    setLoading(true);
    fetch('/api/review/due')
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.counts || {});
        setAvailable(d.available || {});
        setLimits(d.limits || { vocabulary: 50, kanji: 50 });
        setPools(d.pools || {});
        setLoading(false);
      });
  }

  useEffect(() => { loadCounts(); }, []);

  function handleBack() { setActiveCategory(null); loadCounts(); }

  if (activeCategory) return <QuizDrill category={activeCategory} pools={pools} onBack={handleBack} />;
  return loading
    ? <div className="py-24 text-center font-japanese text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
    : <CategoryPicker counts={counts} available={available} limits={limits} onSelect={setActiveCategory} />;
}
