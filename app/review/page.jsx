'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AudioButton from '@/components/AudioButton';
import Bar from '@/components/Bar';
import GrammarExamples from '@/components/GrammarExamples';
import { useSettings } from '@/lib/useSettings';
import { toRomaji, toRomajiParts } from '@/lib/toRomaji';

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

const MODES = [
  { id: 'mixed', label: 'Mixed', hint: 'both ways, random' },
  { id: 'recognition', label: 'Recognition', hint: 'EN → reading' },
  { id: 'production', label: 'Production', hint: 'JP → meaning' },
  { id: 'listening', label: 'Listening', hint: 'audio → reading' },
];

function getModeQA(card, mode) {
  const isVocab = card.content_type === 'vocabulary';
  const isGrammar = card.content_type === 'grammar';
  // Grammar has no listening form — fall back to recognition.
  const effMode = isGrammar && mode === 'listening' ? 'recognition' : mode;
  if (effMode === 'production') {
    return {
      promptText: card.prod_prompt || card.front,
      correct: card.prod_answer || card.back,
      instruction: isGrammar ? 'What does this pattern mean?' : 'What does this mean?',
      audioText: card.prod_prompt || card.front,
      hidePrompt: false,
      isBig: !isVocab,
    };
  }
  if (effMode === 'listening') {
    return {
      promptText: 'Listen',
      correct: card.drill_answer,
      instruction: 'Listen and pick the reading.',
      audioText: card.listen_audio || card.front,
      hidePrompt: true,
      isBig: false,
    };
  }
  // Recognition: meaning → pattern for grammar.
  if (isGrammar) {
    return {
      promptText: card.back,
      correct: card.drill_answer,
      instruction: 'Which pattern means this?',
      audioText: card.hint || card.front,
      hidePrompt: false,
      isBig: false,
    };
  }
  return {
    promptText: isVocab ? card.back : card.front,
    correct: card.drill_answer,
    instruction: isVocab ? 'Translate to Japanese.' : 'How do you read this?',
    audioText: card.front,
    hidePrompt: false,
    isBig: !isVocab,
  };
}

function getPoolFor(card, mode, pools) {
  const isVocab = card.content_type === 'vocabulary';
  const isGrammar = card.content_type === 'grammar';
  const effMode = isGrammar && mode === 'listening' ? 'recognition' : mode;
  if (isGrammar) {
    return effMode === 'production'
      ? pools.grammarMeaning || []
      : pools.grammarPattern || [];
  }
  if (mode === 'production') {
    if (isVocab) return pools.vocabEnglish || pools.vocabulary || [];
    return pools.kanjiMeaning || pools.kanji || [];
  }
  if (isVocab) return pools.vocabReading || pools.vocabulary || [];
  return pools.kanjiReading || pools.kanji || [];
}

function Detail({ card, isCorrect, correct, graded, onNext, showRomaji }) {
  const isKanji = card.content_type === 'kanji';
  const isGrammar = card.content_type === 'grammar';
  return (
    <div className={`feedback ${isCorrect ? 'good' : 'bad'}`} style={{ marginTop: '1.25rem' }}>
      <p aria-live="polite">
        <span className={isCorrect ? 'is-correct' : 'is-wrong'}>
          {isCorrect ? '✓ Correct.' : '✗ Wrong.'}
        </span>{' '}
        Answer: <span className="font-japanese"><strong>{correct}</strong></span>
        {!isKanji && !isGrammar && <span className="muted"> ({card.front})</span>}
        {card.is_leech === 1 && <span className="muted"> · leech — try a mnemonic</span>}
      </p>
      <p>
        <span className="muted">Meaning: </span>
        {card.back}
        {card.reading && !isKanji && (
          <span className="muted"> · {card.reading}{showRomaji ? ` (${toRomaji(card.reading)})` : ''}</span>
        )}
        {isKanji && card.reading && (
          <span className="muted"> · {card.reading}{showRomaji ? ` (${toRomajiParts(card.reading)})` : ''}</span>
        )}
      </p>
      {isGrammar && card.structure && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>Form: <span className="font-japanese">{card.structure}</span></p>
      )}
      {isGrammar && card.source_url && (
        <p style={{ fontSize: '0.85rem' }}>
          <a href={card.source_url} target="_blank" rel="noreferrer">Read explanation →</a>
          <span className="muted"> (Tae Kim&apos;s guide — learn it there, drill it here)</span>
        </p>
      )}
      {isGrammar && <GrammarExamples grammarId={card.content_id} />}
      {(card.hint || card.hint2) && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          {card.hint}{card.hint2 ? ` · ${card.hint2}` : ''}
        </p>
      )}
      {isGrammar && showRomaji && card.example_romaji && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>{card.example_romaji}</p>
      )}
      {graded && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          {isCorrect ? `Back in ${graded.interval}d.` : 'Coming back later this session.'}
        </p>
      )}
      <p>
        <button className="btn" onClick={onNext}>Next →</button>{' '}
        <span className="muted" style={{ fontSize: '0.8rem' }}>or press Enter</span>
      </p>
    </div>
  );
}

function QuizDrill({ category, pools, onBack, initialMode = 'mixed', source = null }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [graded, setGraded] = useState(null); // { wasCorrect, interval } from auto-grade
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [mode, setMode] = useState(initialMode);
  const [retryQueue, setRetryQueue] = useState([]);
  // Mixed mode: fixed random direction per card (EN→JP or JP→EN), assigned once.
  const [cardModes, setCardModes] = useState({});
  const { showRomaji } = useSettings();

  const fetchCards = useCallback(() => {
    setLoading(true);
    let url = category.type ? `/api/review/due?type=${category.type}` : '/api/review/due';
    if (source === 'weak') url += (url.includes('?') ? '&' : '?') + 'source=weak';
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch cards');
        return r.json();
      })
      .then((d) => {
        const fetched = d.cards || [];
        setCards(fetched);
        setCardModes(Object.fromEntries(
          fetched.map((c) => [`${c.content_type}:${c.content_id}`, Math.random() < 0.5 ? 'recognition' : 'production'])
        ));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, source]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const current = cards[index];
  // Effective direction: fixed mode, or the card's pre-rolled direction in Mixed.
  const effMode = mode === 'mixed' && current
    ? (cardModes[`${current.content_type}:${current.content_id}`] || 'recognition')
    : mode;
  const qa = current ? getModeQA(current, effMode) : null;
  const pool = useMemo(() => {
    if (!current) return [];
    return getPoolFor(current, effMode, pools);
  }, [current, effMode, pools]);

  const options = useMemo(
    () => (current && qa ? buildOptions(qa.correct, pool) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, qa?.correct, pool],
  );

  useEffect(() => {
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!chosen) {
        // Phase 1: pick answer with 1-4
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx <= 3 && options[idx] !== undefined) handleAnswer(options[idx]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Phase 2: Enter/Space moves to the next card
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, graded, options, current]);

  async function handleAnswer(answer) {
    if (chosen || !current || !qa) return;
    setChosen(answer);
    const isCorrect = answer === qa.correct;
    setStats((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    // Auto-grade: correct counts as Good, wrong as Again. No manual rating.
    const res = await fetch('/api/review/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: current.id, label: isCorrect ? 'good' : 'again', was_correct_mcq: isCorrect }),
    }).then((r) => r.json()).catch(() => null);
    setGraded({ wasCorrect: isCorrect, interval: res?.interval ?? (isCorrect ? 2 : 1) });
  }

  function handleNext() {
    if (!chosen || !current) return;
    const wasCorrect = graded?.wasCorrect ?? chosen === qa?.correct;
    const shouldRetry = !wasCorrect;
    let nextRetry = retryQueue;
    if (shouldRetry && !retryQueue.find((c) => c.id === current.id)) {
      nextRetry = [...retryQueue, current];
      setRetryQueue(nextRetry);
    }
    if (index + 1 >= cards.length) {
      if (nextRetry.length > 0) {
        // Wrong cards come back later this session instead of tomorrow.
        setCards(nextRetry);
        setRetryQueue([]);
        setIndex(0);
        setChosen(null);
        setGraded(null);
      } else {
        setDone(true);
      }
    } else {
      setIndex(index + 1);
      setChosen(null);
      setGraded(null);
    }
  }

  function restart() {
    setIndex(0); setChosen(null); setGraded(null); setDone(false);
    setStats({ correct: 0, total: 0 });
    setRetryQueue([]);
    fetchCards();
  }

  if (loading) return <p className="muted">Loading…</p>;

  if (done || cards.length === 0) {
    return (
      <div>
        <p><Link href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>← back</Link></p>
        <h1>{cards.length === 0 ? 'Nothing due' : 'Done'}</h1>
        <p>
          {cards.length === 0
            ? 'No cards due. Come back tomorrow.'
            : `${stats.correct} / ${stats.total} correct (${Math.round((stats.correct / stats.total) * 100)}%).`}
        </p>
        <p>
          <button className="btn" onClick={restart}>Again</button>{' '}
          <button className="btn" onClick={onBack}>Categories</button>
        </p>
      </div>
    );
  }

  if (!current || !qa) return null;

  return (
    <div>
      <p><Link href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>← back</Link></p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            className="btn"
            aria-pressed={mode === m.id}
            onClick={() => { setMode(m.id); setChosen(null); setGraded(null); }}
            style={mode === m.id
              ? { borderColor: 'var(--accent)', color: 'var(--heading)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
              : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>
        {index + 1}/{cards.length} · {stats.correct}✓{retryQueue.length > 0 && ` · ${retryQueue.length} to retry`}
      </p>
      <div style={{ marginBottom: '1rem' }}>
        <Bar value={index} max={cards.length} />
      </div>

      <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.25rem' }}>{qa.instruction}</p>
      {!qa.hidePrompt ? (
        <p className="jp-display" style={{ fontSize: qa.isBig ? '4.5rem' : '2rem', lineHeight: 1.25, margin: '0 0 1rem' }}>
          {qa.promptText}
        </p>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <p className="jp-display" style={{ fontSize: '2.6rem', margin: '0 0 0.5rem' }}>聴</p>
          <AudioButton text={qa.audioText} />
        </div>
      )}
      {mode !== 'listening' && <p style={{ margin: '0 0 1.25rem' }}><AudioButton text={qa.audioText} /></p>}

      {!chosen && <p className="muted" style={{ fontSize: '0.8rem' }}>Pick 1–4.</p>}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {options.map((opt, i) => {
          let mark = '';
          let style = {};
          let cls = 'opt';
          if (chosen) {
            if (opt === qa.correct) { mark = '✓ '; cls = 'opt is-correct'; }
            else if (opt === chosen) { mark = '✗ '; cls = 'opt is-wrong'; }
            else style = { opacity: 0.35 };
          }
          return (
            <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!chosen} className={cls} style={style}>
              <span className="font-japanese">{mark}<span className="opt-index">{i + 1}.</span> {opt}</span>
              {current.content_type === 'vocabulary' && chosen && showRomaji && (
                <span className="muted"> ({toRomaji(opt)})</span>
              )}
            </button>
          );
        })}
      </div>

      {chosen && (
        <Detail card={current} isCorrect={chosen === qa.correct} correct={qa.correct} graded={graded} onNext={handleNext} showRomaji={showRomaji} />
      )}
    </div>
  );
}

const CATEGORIES = [
  { type: 'vocabulary', label: 'Vocabulary' },
  { type: 'kanji', label: 'Kanji' },
  { type: 'grammar', label: 'Grammar' },
];

function ReviewContent() {
  const searchParams = useSearchParams();
  const [counts, setCounts] = useState({});
  const [available, setAvailable] = useState({});
  const [limits, setLimits] = useState({});
  const [pools, setPools] = useState({});
  const [dailyGoals, setDailyGoals] = useState({ vocabulary: 50, kanji: 20, grammar: 10 });
  const [selectionCount, setSelectionCount] = useState(0);
  const [weakCount, setWeakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [mode, setMode] = useState('mixed');
  const [weakOnly, setWeakOnly] = useState(searchParams.get('source') === 'weak');

  // Deep links (e.g. dashboard path nodes) jump straight into a drill.
  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'vocabulary') setActiveCategory({ type: 'vocabulary', label: 'Vocabulary' });
    else if (t === 'kanji') setActiveCategory({ type: 'kanji', label: 'Kanji' });
    else if (t === 'grammar') setActiveCategory({ type: 'grammar', label: 'Grammar' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadCounts() {
    setLoading(true);
    Promise.all([
      fetch('/api/review/due').then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); }),
      fetch('/api/weak-points').then((r) => r.json()).catch(() => []),
    ])
      .then(([d, weak]) => {
        setCounts(d.counts || {});
        setAvailable(d.available || {});
        setLimits(d.limits || { vocabulary: 50, kanji: 20, grammar: 10 });
        setPools(d.pools || {});
        setDailyGoals(d.dailyGoals || d.dailyGoal || { vocabulary: 50, kanji: 20, grammar: 10 });
        setSelectionCount(d.selectionCount || 0);
        setWeakCount(Array.isArray(weak) ? weak.length : 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadCounts(); }, []);

  async function startStarterPack() {
    setStarting(true);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starter_pack: true }),
    });
    setStarting(false);
    loadCounts();
  }

  function handleBack() { setActiveCategory(null); loadCounts(); }

  if (activeCategory) {
    return (
      <QuizDrill
        category={activeCategory}
        pools={pools}
        onBack={handleBack}
        initialMode={mode}
        source={weakOnly ? 'weak' : null}
      />
    );
  }

  if (loading) return <p className="muted">Loading…</p>;

  const totalDue = (counts.vocabulary || 0) + (counts.kanji || 0) + (counts.grammar || 0);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Review</h1>

      {selectionCount === 0 && totalDue === 0 ? (
        <div>
          <p>
            Nothing to review yet — review cards are created from words you pick.
            Start with the first 20 vocabulary words and 10 kanji, or pick your
            own in <Link href="/vocabulary">Vocabulary</Link> and{' '}
            <Link href="/kanji">Kanji</Link>.
          </p>
          <p>
            <button className="btn btn-solid" onClick={startStarterPack} disabled={starting}>
              {starting ? 'Adding…' : 'Start with the first 20 words'}
            </button>
          </p>
        </div>
      ) : totalDue === 0 ? (
        <p>No cards due. Come back tomorrow.</p>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {CATEGORIES.map(({ type, label }) => {
              const due = counts[type] || 0;
              const limit = limits[type] ?? 0;
              const goal = dailyGoals[type] ?? 0;
              const done = Math.max(0, goal - limit);
              const ready = due > 0 && limit > 0;
              return (
                <button
                  key={type}
                  disabled={!ready}
                  onClick={() => setActiveCategory({ type, label })}
                  className="opt"
                  style={!ready ? { opacity: 0.45 } : {}}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                    <strong>{label}</strong>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: due > 0 ? 'var(--accent)' : 'var(--muted)', lineHeight: 1.2 }}>
                      {due} <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>due</span>
                    </span>
                  </span>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>{done}/{goal} done today{!ready && due === 0 ? ' · clear ✓' : ''}{!ready && due > 0 ? ' · cap reached' : ''}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Mode:</span>
            {MODES.map((m) => (
              <button
                key={m.id}
                className="btn"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
                style={mode === m.id
                  ? { borderColor: 'var(--accent)', color: 'var(--heading)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
                  : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
              >
                {m.label}
              </button>
            ))}
            {weakCount > 0 && (
              <button
                className="btn"
                aria-pressed={weakOnly}
                onClick={() => setWeakOnly(!weakOnly)}
                style={weakOnly
                  ? { borderColor: 'var(--accent)', color: 'var(--heading)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
                  : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
              >
                Weak only ({weakCount})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <ReviewContent />
    </Suspense>
  );
}
