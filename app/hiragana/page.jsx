'use client';

import { useState, useMemo, useEffect } from 'react';

const GOJUON = [
  { char: 'あ', romaji: 'a' },  { char: 'い', romaji: 'i' },  { char: 'う', romaji: 'u' },  { char: 'え', romaji: 'e' },  { char: 'お', romaji: 'o' },
  { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
  { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi'},  { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
  { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi'}, { char: 'つ', romaji: 'tsu'},  { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
  { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
  { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
  { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
  { char: 'や', romaji: 'ya' }, { char: 'ゆ', romaji: 'yu' }, { char: 'よ', romaji: 'yo' },
  { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
  { char: 'わ', romaji: 'wa' }, { char: 'を', romaji: 'wo' }, { char: 'ん', romaji: 'n' },
];

const DAKUTEN = [
  { char: 'が', romaji: 'ga' }, { char: 'ぎ', romaji: 'gi' }, { char: 'ぐ', romaji: 'gu' }, { char: 'げ', romaji: 'ge' }, { char: 'ご', romaji: 'go' },
  { char: 'ざ', romaji: 'za' }, { char: 'じ', romaji: 'ji' }, { char: 'ず', romaji: 'zu' }, { char: 'ぜ', romaji: 'ze' }, { char: 'ぞ', romaji: 'zo' },
  { char: 'だ', romaji: 'da' }, { char: 'ぢ', romaji: 'ji' }, { char: 'づ', romaji: 'zu' }, { char: 'で', romaji: 'de' }, { char: 'ど', romaji: 'do' },
  { char: 'ば', romaji: 'ba' }, { char: 'び', romaji: 'bi' }, { char: 'ぶ', romaji: 'bu' }, { char: 'べ', romaji: 'be' }, { char: 'ぼ', romaji: 'bo' },
  { char: 'ぱ', romaji: 'pa' }, { char: 'ぴ', romaji: 'pi' }, { char: 'ぷ', romaji: 'pu' }, { char: 'ぺ', romaji: 'pe' }, { char: 'ぽ', romaji: 'po' },
];

const YOON = [
  { char: 'きゃ', romaji: 'kya' }, { char: 'きゅ', romaji: 'kyu' }, { char: 'きょ', romaji: 'kyo' },
  { char: 'しゃ', romaji: 'sha' }, { char: 'しゅ', romaji: 'shu' }, { char: 'しょ', romaji: 'sho' },
  { char: 'ちゃ', romaji: 'cha' }, { char: 'ちゅ', romaji: 'chu' }, { char: 'ちょ', romaji: 'cho' },
  { char: 'にゃ', romaji: 'nya' }, { char: 'にゅ', romaji: 'nyu' }, { char: 'にょ', romaji: 'nyo' },
  { char: 'ひゃ', romaji: 'hya' }, { char: 'ひゅ', romaji: 'hyu' }, { char: 'ひょ', romaji: 'hyo' },
  { char: 'みゃ', romaji: 'mya' }, { char: 'みゅ', romaji: 'myu' }, { char: 'みょ', romaji: 'myo' },
  { char: 'りゃ', romaji: 'rya' }, { char: 'りゅ', romaji: 'ryu' }, { char: 'りょ', romaji: 'ryo' },
  { char: 'ぎゃ', romaji: 'gya' }, { char: 'ぎゅ', romaji: 'gyu' }, { char: 'ぎょ', romaji: 'gyo' },
  { char: 'じゃ', romaji: 'ja' },  { char: 'じゅ', romaji: 'ju' },  { char: 'じょ', romaji: 'jo' },
  { char: 'びゃ', romaji: 'bya' }, { char: 'びゅ', romaji: 'byu' }, { char: 'びょ', romaji: 'byo' },
  { char: 'ぴゃ', romaji: 'pya' }, { char: 'ぴゅ', romaji: 'pyu' }, { char: 'ぴょ', romaji: 'pyo' },
];

const ALL_HIRAGANA = [...GOJUON, ...DAKUTEN, ...YOON];

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

export default function HiraganaPage() {
  const [mode, setMode] = useState('reference'); // 'reference' | 'drill' | 'result'
  const [drillQueue, setDrillQueue] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [selected, setSelected] = useState(null);   // the chosen option obj
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function startDrill() {
    setDrillQueue(shuffle(ALL_HIRAGANA));
    setDrillIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setMode('drill');
  }

  // current card & options derived from drillQueue + drillIndex
  const current = drillQueue[drillIndex] ?? null;
  // useMemo so options don't reshuffle on every render; only when the card changes
  const options = useMemo(
    () => (current ? getOptions(current, ALL_HIRAGANA) : []),
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

  const renderCard = (h) => (
    <div
      key={h.char}
      className="rounded-xl p-4 flex flex-col items-center gap-1 transition-all group"
      style={{ 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border)',
        cursor: 'default' 
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.borderColor = 'rgba(255,0,128,0.4)';
        e.currentTarget.style.background = 'rgba(255,0,128,0.04)';
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-surface)';
      }}
    >
      <span className="font-japanese text-3xl transition-transform group-hover:scale-110" style={{ color: 'var(--text-1)' }}>{h.char}</span>
      <span className="text-xs font-mono" style={{ color: 'var(--pink)', opacity: 0.8 }}>{h.romaji}</span>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>ひらがな</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Hiragana</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Reference chart and drill mode</p>
        </div>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setMode('reference')}
            className={mode === 'reference' ? 'btn-primary' : 'btn-secondary'}
          >
            Reference
          </button>
          <button
            onClick={startDrill}
            className={mode === 'drill' || mode === 'result' ? 'btn-primary' : 'btn-secondary'}
          >
            Drill
          </button>
        </div>
      </div>

      {/* ── Reference Chart ── */}
      {mode === 'reference' && (
        <div className="space-y-10">
          <section>
            <h2 className="text-sm font-semibold mb-4 opacity-50 uppercase tracking-widest">Basic — 五十音</h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
              {GOJUON.map(renderCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-4 opacity-50 uppercase tracking-widest">Voiced — 濁音 / 半濁音</h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-3">
              {DAKUTEN.map(renderCard)}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-4 opacity-50 uppercase tracking-widest">Contracted — 拗音</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-3">
              {YOON.map(renderCard)}
            </div>
          </section>
        </div>
      )}

      {/* ── Drill ── */}
      {mode === 'drill' && current && (
        <div className="max-w-sm mx-auto">
          {/* Progress */}
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
            <span className="text-xs font-mono shrink-0" style={{ color: '#44ddaa' }}>
              {score.correct}✓
            </span>
          </div>

          {/* Card */}
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

          {/* Options */}
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
