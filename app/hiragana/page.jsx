'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Bar from '@/components/Bar';
import { toRomaji } from '@/lib/toRomaji';

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

export default function HiraganaPage() {
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
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Hiragana</h1>
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
