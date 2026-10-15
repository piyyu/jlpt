'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Bar from '@/components/Bar';
import { toRomaji } from '@/lib/toRomaji';

const GOJUON = [
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

const DAKUTEN = [
  { char: 'ガ', romaji: 'ga' }, { char: 'ギ', romaji: 'gi' }, { char: 'グ', romaji: 'gu' }, { char: 'ゲ', romaji: 'ge' }, { char: 'ゴ', romaji: 'go' },
  { char: 'ザ', romaji: 'za' }, { char: 'ジ', romaji: 'ji' }, { char: 'ズ', romaji: 'zu' }, { char: 'ゼ', romaji: 'ze' }, { char: 'ゾ', romaji: 'zo' },
  { char: 'ダ', romaji: 'da' }, { char: 'ヂ', romaji: 'ji' }, { char: 'ヅ', romaji: 'zu' }, { char: 'デ', romaji: 'de' }, { char: 'ド', romaji: 'do' },
  { char: 'バ', romaji: 'ba' }, { char: 'ビ', romaji: 'bi' }, { char: 'ブ', romaji: 'bu' }, { char: 'ベ', romaji: 'be' }, { char: 'ボ', romaji: 'bo' },
  { char: 'パ', romaji: 'pa' }, { char: 'ピ', romaji: 'pi' }, { char: 'プ', romaji: 'pu' }, { char: 'ペ', romaji: 'pe' }, { char: 'ポ', romaji: 'po' },
];

const YOON = [
  { char: 'キャ', romaji: 'kya' }, { char: 'キュ', romaji: 'kyu' }, { char: 'キョ', romaji: 'kyo' },
  { char: 'シャ', romaji: 'sha' }, { char: 'シュ', romaji: 'shu' }, { char: 'ショ', romaji: 'sho' },
  { char: 'チャ', romaji: 'cha' }, { char: 'チュ', romaji: 'chu' }, { char: 'チョ', romaji: 'cho' },
  { char: 'ニャ', romaji: 'nya' }, { char: 'ニュ', romaji: 'nyu' }, { char: 'ニョ', romaji: 'nyo' },
  { char: 'ヒャ', romaji: 'hya' }, { char: 'ヒュ', romaji: 'hyu' }, { char: 'ヒョ', romaji: 'hyo' },
  { char: 'ミャ', romaji: 'mya' }, { char: 'ミュ', romaji: 'myu' }, { char: 'ミョ', romaji: 'myo' },
  { char: 'リャ', romaji: 'rya' }, { char: 'リュ', romaji: 'ryu' }, { char: 'リョ', romaji: 'ryo' },
  { char: 'ギャ', romaji: 'gya' }, { char: 'ギュ', romaji: 'gyu' }, { char: 'ギョ', romaji: 'gyo' },
  { char: 'ジャ', romaji: 'ja' },  { char: 'ジュ', romaji: 'ju' },  { char: 'ジョ', romaji: 'jo' },
  { char: 'ビャ', romaji: 'bya' }, { char: 'ビュ', romaji: 'byu' }, { char: 'ビョ', romaji: 'byo' },
  { char: 'ピャ', romaji: 'pya' }, { char: 'ピュ', romaji: 'pyu' }, { char: 'ピョ', romaji: 'pyo' },
];

const ALL = [...GOJUON, ...DAKUTEN, ...YOON];

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

export default function KatakanaPage() {
  const [mode, setMode] = useState('reference');
  const [drillQueue, setDrillQueue] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [drillCount, setDrillCount] = useState(25);
  const [drillFormat, setDrillFormat] = useState('mcq'); // 'mcq' | 'type'
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState(false);
  const [typedOk, setTypedOk] = useState(false);
  const inputRef = useRef(null);

  const COUNTS = [10, 25, 50, 'all'];

  const chip = (active) => ({
    padding: '0.35rem 0.8rem',
    fontSize: '0.82rem',
    ...(active ? { borderColor: 'var(--accent)', color: 'var(--heading)' } : {}),
  });

  const drillActive = mode !== 'reference';

  function startDrill() {
    const pool = shuffle(ALL);
    setDrillQueue(drillCount === 'all' ? pool : pool.slice(0, drillCount));
    setDrillIndex(0);
    setSelected(null);
    setTyped('');
    setChecked(false);
    setTypedOk(false);
    setScore({ correct: 0, total: 0 });
    setMode('drill');
  }

  const current = drillQueue[drillIndex] ?? null;
  const options = useMemo(
    () => (current ? getOptions(current, ALL) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.char],
  );
  const answered = selected !== null;

  useEffect(() => {
    function onKey(e) {
      if (drillFormat !== 'mcq') {
        if (e.key === 'Enter' && checked && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') handleNext();
        return;
      }
      if (mode !== 'drill' || answered || options.length === 0) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx <= 3 && options[idx]) handleAnswer(options[idx]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, answered, options, drillFormat, checked]);

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

  function handleCheckTyping() {
    if (checked || !current) return;
    // Accept romaji or kana answers; ignore empty submits.
    const norm = toRomaji(typed.trim().toLowerCase());
    if (!norm) return;
    const ok = norm === current.romaji;
    setTypedOk(ok);
    setChecked(true);
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
  }

  function handleNext() {
    const nextIndex = drillIndex + 1;
    if (nextIndex >= drillQueue.length) {
      setMode('result');
    } else {
      setDrillIndex(nextIndex);
      setSelected(null);
      setTyped('');
      setChecked(false);
      setTypedOk(false);
    }
  }

  useEffect(() => {
    if (mode === 'drill' && drillFormat === 'type' && !checked) inputRef.current?.focus();
  }, [mode, drillIndex, drillFormat, checked]);

  const chart = (list, cols) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1px', background: 'var(--border)', border: '2px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: '1.5rem' }}>
      {list.map((h) => (
        <div key={h.char} className="kana-cell">
          <span className="font-japanese" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{h.char}</span>
          <br />
          <span className="muted" style={{ fontSize: '0.72rem', fontWeight: 700 }}>{h.romaji}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Katakana</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }} role="tablist" aria-label="View">
        <button role="tab" aria-selected={mode === 'reference'} className="btn" onClick={() => setMode('reference')} style={chip(mode === 'reference')}>
          Reference
        </button>
        <button role="tab" aria-selected={drillActive} className="btn" onClick={() => setMode('setup')} style={chip(drillActive)}>
          Drill
        </button>
      </div>

      {mode === 'reference' && (
        <div>
          <h2 className="section-head">Basic</h2>
          {chart(GOJUON, 5)}
          <h2 className="section-head">Voiced</h2>
          {chart(DAKUTEN, 5)}
          <h2 className="section-head">Contracted</h2>
          {chart(YOON, 3)}
        </div>
      )}

      {mode === 'setup' && (
        <div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>Questions:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {COUNTS.map((c) => (
              <button
                key={String(c)}
                className="btn"
                aria-pressed={drillCount === c}
                onClick={() => setDrillCount(c)}
                style={chip(drillCount === c)}
              >
                {c === 'all' ? `All (${ALL.length})` : c}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '0.85rem' }}>Format:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[{ id: 'mcq', label: 'Multiple choice' }, { id: 'type', label: 'Type the answer' }].map((f) => (
              <button
                key={f.id}
                className="btn"
                aria-pressed={drillFormat === f.id}
                onClick={() => setDrillFormat(f.id)}
                style={chip(drillFormat === f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p>
            <button className="btn btn-solid" onClick={startDrill}>Start →</button>
          </p>
        </div>
      )}

      {mode === 'drill' && current && (
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>{drillIndex + 1}/{drillQueue.length} · {score.correct}✓</p>
          <div style={{ marginBottom: '1rem' }}>
            <Bar value={drillIndex} max={drillQueue.length} />
          </div>
          <p className="font-japanese" style={{ fontSize: '4.5rem', lineHeight: 1.25, fontWeight: 600, margin: '0 0 1rem' }}>{current.char}</p>
          {!answered && drillFormat === 'mcq' && (
            <p className="muted" style={{ fontSize: '0.8rem' }}>Tap an answer, or press 1–4.</p>
          )}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {drillFormat === 'mcq' ? (
              options.map((opt, i) => {
                let marker = `${i + 1}. `;
                let style = {};
                let cls = 'opt';
                if (answered) {
                  if (opt.romaji === current.romaji) { marker = `✓ ${i + 1}. `; cls = 'opt is-correct'; }
                  else if (opt.romaji === selected.romaji) { marker = `✗ ${i + 1}. `; cls = 'opt is-wrong'; }
                  else style = { opacity: 0.35 };
                }
                return (
                  <button key={opt.romaji} onClick={() => handleAnswer(opt)} disabled={answered} className={cls} style={style}>
                    {marker}{opt.romaji}
                  </button>
                );
              })
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); checked ? handleNext() : handleCheckTyping(); }}>
                <p style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault(); }}
                    disabled={checked}
                    placeholder="Type the romaji…"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-solid" type="submit" disabled={!checked && !typed.trim()}>{checked ? 'Next →' : 'Check'}</button>
                </p>
              </form>
            )}
          </div>
          {drillFormat === 'type' && checked && (
            <div className={`feedback ${typedOk ? 'good' : 'bad'}`} style={{ marginTop: '1rem' }} aria-live="polite">
              <p style={{ margin: 0 }}>
                {typedOk
                  ? <span className="is-correct">✓ Correct.</span>
                  : <span><span className="is-wrong">✗ Wrong.</span> Answer: <strong className="font-japanese">{current.romaji}</strong></span>}
              </p>
            </div>
          )}
        </div>
      )}

      {mode === 'result' && (
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{Math.round((score.correct / score.total) * 100)}点</h1>
          <p>{score.correct} / {score.total}. {score.correct === score.total ? 'Perfect!' : 'Keep practising!'}</p>
          <p>
            <button className="btn" onClick={startDrill}>Again</button>{' '}
            <button className="btn" onClick={() => setMode('setup')}>Change setup</button>{' '}
            <button className="btn" onClick={() => setMode('reference')}>Reference</button>
          </p>
        </div>
      )}
    </div>
  );
}
