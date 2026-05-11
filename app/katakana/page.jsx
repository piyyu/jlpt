'use client';

import { useState, useMemo, useEffect } from 'react';

const KATAKANA = [
  { char: 'ア', romaji: 'a' },  { char: 'イ', romaji: 'i' },  { char: 'ウ', romaji: 'u' },  { char: 'エ', romaji: 'e' },  { char: 'オ', romaji: 'o' },
  { char: 'カ', romaji: 'ka' }, { char: 'キ', romaji: 'ki' }, { char: 'ク', romaji: 'ku' }, { char: 'ケ', romaji: 'ke' }, { char: 'コ', romaji: 'ko' },
  { char: 'サ', romaji: 'sa' }, { char: 'シ', romaji: 'shi'},  { char: 'ス', romaji: 'su' }, { char: 'セ', romaji: 'se' }, { char: 'ソ', romaji: 'so' },
  { char: 'タ', romaji: 'ta' }, { char: 'チ', romaji: 'chi'}, { char: 'ツ', romaji: 'tsu'},  { char: 'テ', romaji: 'te' }, { char: 'ト', romaji: 'to' },
  { char: 'ナ', romaji: 'na' }, { char: 'ニ', romaji: 'ni' }, { char: 'ヌ', romaji: 'nu' }, { char: 'ネ', romaji: 'ne' }, { char: 'ノ', romaji: 'no' },
  { char: 'ハ', romaji: 'ha' }, { char: 'ヒ', romaji: 'hi' }, { char: 'フ', romaji: 'fu' }, { char: 'ヘ', romaji: 'he' }, { char: 'ホ', romaji: 'ho' },
  { char: 'マ', romaji: 'ma' }, { char: 'ミ', romaji: 'mi' }, { char: 'ム', romaji: 'mu' }, { char: 'メ', romaji: 'me' }, { char: 'モ', romaji: 'mo' },
  { char: 'ヤ', romaji: 'ya' }, { char: 'ユ', romaji: 'yu' }, { char: 'ヨ', romaji: 'yo' },
  { char: 'ラ', romaji: 'ra' }, { char: 'リ', romaji: 'ri' }, { char: 'ル', romaji: 'ru' }, { char: 'レ', romaji: 're' }, { char: 'ロ', romaji: 'ro' },
  { char: 'ワ', romaji: 'wa' }, { char: 'ヲ', romaji: 'wo' }, { char: 'ン', romaji: 'n' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOptions(correct, all) {
  const others = shuffle(all.filter((c) => c.romaji !== correct.romaji)).slice(0, 3);
  return shuffle([correct, ...others]);
}

function optionStyle(opt, selected, current) {
  if (!selected) return {};
  const isCorrect = opt.romaji === current.romaji;
  const isSelected = opt.romaji === selected.romaji;
  if (isCorrect) return { background: 'rgba(68,221,170,0.15)', border: '1px solid #44ddaa', color: '#44ddaa' };
  if (isSelected) return { background: 'rgba(255,60,80,0.1)', border: '1px solid rgba(255,60,80,0.6)', color: '#ff3c50' };
  return { opacity: 0.4 };
}

export default function KatakanaPage() {
  const [mode, setMode] = useState('reference');
  const [drillQueue, setDrillQueue] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function startDrill() {
    setDrillQueue(shuffle(KATAKANA));
    setDrillIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setMode('drill');
  }

  const current = drillQueue[drillIndex] ?? null;
  const options = useMemo(
    () => (current ? getOptions(current, KATAKANA) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.char],
  );

  const answered = selected !== null;

  useEffect(() => {
    function onKey(e) {
      if (mode !== 'drill' || answered || options.length === 0) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx <= 3 && options[idx]) {
        handleAnswer(options[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, answered, options]);

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    const isCorrect = opt.romaji === current.romaji;
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      const nextIndex = drillIndex + 1;
      if (nextIndex >= drillQueue.length) {
        setMode('result');
      } else {
        setDrillIndex(nextIndex);
        setSelected(null);
      }
    }, 900);
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>カタカナ</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Katakana</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Reference chart and drill mode</p>
        </div>
        <div className="flex gap-2 mt-1">
          <button onClick={() => setMode('reference')} className={mode === 'reference' ? 'btn-primary' : 'btn-secondary'}>
            Reference
          </button>
          <button onClick={startDrill} className={mode === 'drill' || mode === 'result' ? 'btn-primary' : 'btn-secondary'}>
            Drill
          </button>
        </div>
      </div>

      {/* ── Reference Chart ── */}
      {mode === 'reference' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-5 divide-x divide-y" style={{ borderColor: 'var(--border)' }}>
            {KATAKANA.map((k) => (
              <div
                key={k.char}
                className="p-4 flex flex-col items-center gap-1 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              >
                <span className="font-japanese text-2xl" style={{ color: 'var(--text-1)' }}>{k.char}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--pink)', opacity: 0.8 }}>{k.romaji}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Drill ── */}
      {mode === 'drill' && current && (
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(drillIndex / drillQueue.length) * 100}%`, background: 'var(--pink)' }}
              />
            </div>
            <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-3)' }}>
              {drillIndex + 1}/{drillQueue.length}
            </span>
            <span className="text-xs font-mono shrink-0" style={{ color: '#44ddaa' }}>{score.correct}✓</span>
          </div>

          <div
            className="rounded-xl p-10 text-center mb-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <span
              className="font-japanese font-medium"
              style={{ fontSize: '96px', lineHeight: 1, color: 'var(--text-1)' }}
            >
              {current.char}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.romaji}
                onClick={() => handleAnswer(opt)}
                disabled={answered}
                className="py-4 rounded-xl text-base font-mono font-semibold transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  ...optionStyle(opt, selected, current),
                }}
              >
                {opt.romaji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {mode === 'result' && (
        <div
          className="max-w-sm mx-auto rounded-xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,0,128,0.2)' }}
        >
          <p className="font-japanese text-5xl font-bold mb-2" style={{ color: 'var(--pink)' }}>
            {Math.round((score.correct / score.total) * 100)}点
          </p>
          <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
            {score.correct} / {score.total}
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
            {score.correct === score.total ? '完璧！Perfect score!' : 'Keep practising!'}
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={startDrill} className="btn-primary w-full">もう一度 — Try Again</button>
            <button onClick={() => setMode('reference')} className="btn-secondary w-full">Back to Reference</button>
          </div>
        </div>
      )}
    </div>
  );
}
