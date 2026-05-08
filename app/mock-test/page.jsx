'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, CheckCircle, XCircle, RotateCcw, Zap } from 'lucide-react';
import AudioButton from '@/components/AudioButton';

const PRESETS = [
  { label: '10問 · 5分', questions: 10, desc: 'Quick warm-up' },
  { label: '20問 · 10分', questions: 20, desc: 'Standard session' },
  { label: '40問 · 20分', questions: 40, desc: 'Full drill' },
];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function optStyle(opt, selected, correct) {
  if (selected === null) return {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    cursor: 'pointer',
  };
  if (opt === correct) return { background: 'rgba(68,221,170,0.12)', border: '1px solid #44ddaa', color: '#44ddaa' };
  if (opt === selected) return { background: 'rgba(255,60,80,0.1)', border: '1px solid rgba(255,60,80,0.5)', color: '#ff3c50' };
  return { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-3)', opacity: 0.4, cursor: 'default' };
}

export default function MockTestPage() {
  const [phase, setPhase] = useState('intro'); // intro | test | results
  const [preset, setPreset] = useState(1);       // index into PRESETS
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);      // {id, type, was_correct}
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const submitTest = useCallback(async (currentAnswers) => {
    clearInterval(timerRef.current);
    const res = await fetch('/api/mock-test/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, answers: currentAnswers }),
    });
    const data = await res.json();
    setResults(data);
    setPhase('results');
  }, [sessionId]);

  // Start countdown
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit with current answers when time runs out
          setAnswers((a) => { submitTest(a); return a; });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitTest]);

  async function startTest() {
    setLoading(true);
    const { questions: qCount } = PRESETS[preset];
    const res = await fetch('/api/mock-test/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionCount: qCount }),
    });
    const data = await res.json();
    setQuestions(data.questions);
    setSessionId(data.session_id);
    setAnswers([]);
    setQIndex(0);
    setSelected(null);
    setTimeLeft(data.timeLimitSeconds);
    setTotalTime(data.timeLimitSeconds);
    setPhase('test');
    setLoading(false);
  }

  const current = questions[qIndex];
  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const isLowTime = timeLeft < 60;

  useEffect(() => {
    function onKey(e) {
      if (phase !== 'test' || selected !== null || !current) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx <= 3 && current.options[idx]) {
        handleAnswer(current.options[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, selected, current]);

  function handleAnswer(opt) {
    if (selected !== null || !current) return;
    setSelected(opt);
    const isCorrect = opt === current.correct;
    const newAnswers = [...answers, { type: current.type, id: current.id, was_correct: isCorrect }];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        submitTest(newAnswers);
      } else {
        setQIndex(qIndex + 1);
        setSelected(null);
      }
    }, 900);
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div>
        <div className="mb-8">
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>模擬試験</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Mock Test</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Vocabulary + Kanji · timed quiz · 30 seconds per question
          </p>
        </div>

        {/* Preset selector */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mb-8">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPreset(i)}
              className="rounded-xl p-5 text-left transition-all"
              style={{
                background: preset === i ? 'rgba(255,0,128,0.08)' : 'var(--bg-surface)',
                border: `1px solid ${preset === i ? 'rgba(255,0,128,0.4)' : 'var(--border)'}`,
              }}
            >
              <p className="font-japanese font-bold text-base mb-1" style={{ color: preset === i ? 'var(--pink)' : 'var(--text-1)' }}>
                {p.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.desc}</p>
              <div className="mt-3 flex gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,0,128,0.1)', color: 'var(--pink)', border: '1px solid rgba(255,0,128,0.2)' }}>
                  単語 {Math.floor(p.questions / 2)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(192,132,252,0.1)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.2)' }}>
                  漢字 {p.questions - Math.floor(p.questions / 2)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div
          className="max-w-xl rounded-xl p-5 mb-6 text-sm space-y-2"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <Zap size={14} style={{ color: 'var(--pink)' }} />
            4 multiple-choice options per question
          </p>
          <p className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <Timer size={14} style={{ color: 'var(--pink)' }} />
            30 seconds per question — auto-submits when time runs out
          </p>
          <p className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <CheckCircle size={14} style={{ color: '#44ddaa' }} />
            Pass score: 60%
          </p>
        </div>

        <button
          onClick={startTest}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
          style={{ fontSize: 15 }}
        >
          {loading ? '準備中…' : `試験開始 — ${PRESETS[preset].label}`}
        </button>
      </div>
    );
  }

  // ── Test ───────────────────────────────────────────────────────────────────
  if (phase === 'test' && current) {
    const isVocab = current.type === 'vocabulary';
    return (
      <div>
        {/* Timer + progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={isVocab
                  ? { background: 'rgba(255,0,128,0.1)', color: 'var(--pink)', border: '1px solid rgba(255,0,128,0.3)' }
                  : { background: 'rgba(192,132,252,0.1)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
              >
                {isVocab ? '単語' : '漢字'}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                {qIndex + 1}/{questions.length}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 font-mono text-sm font-bold"
              style={{ color: isLowTime ? '#ff3c50' : 'var(--text-2)' }}
            >
              <Timer size={14} style={{ color: isLowTime ? '#ff3c50' : 'var(--text-3)' }} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress bar — time remaining */}
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct * 100}%`,
                background: isLowTime
                  ? '#ff3c50'
                  : `linear-gradient(90deg, var(--pink), #c084fc)`,
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          className="rounded-xl p-8 text-center mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs uppercase tracking-widest mb-4 font-mono" style={{ color: 'var(--text-3)' }}>
            {current.question}
          </p>
          <p
            className="font-japanese font-bold mb-3"
            style={{ fontSize: 80, lineHeight: 1, color: 'var(--text-1)' }}
          >
            {current.prompt}
          </p>
          {current.hint && (
            <p className="font-japanese text-base" style={{ color: 'var(--text-3)' }}>{current.hint}</p>
          )}
          <div className="mt-4 flex justify-center">
            <AudioButton text={current.prompt} />
          </div>
        </div>

        {/* Options (2×2) */}
        <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto mb-4">
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
              className="py-4 px-3 rounded-xl text-sm font-semibold text-left transition-all"
              style={optStyle(opt, selected, current.correct)}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-end max-w-xl mx-auto">
          <button
            onClick={() => submitTest(answers)}
            className="text-xs btn-secondary"
          >
            早期提出
          </button>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === 'results' && results) {
    const vocabAnswers = answers.filter((a) => a.type === 'vocabulary');
    const kanjiAnswers = answers.filter((a) => a.type === 'kanji');
    const vocabCorrect = vocabAnswers.filter((a) => a.was_correct).length;
    const kanjiCorrect = kanjiAnswers.filter((a) => a.was_correct).length;
    const totalCorrect = vocabCorrect + kanjiCorrect;
    const total = answers.length;
    const pctScore = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;
    const passed = pctScore >= 60;

    return (
      <div>
        <div className="mb-8">
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>試験結果</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Results</h1>
        </div>

        {/* Score hero */}
        <div
          className="rounded-2xl p-10 text-center mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${passed ? 'rgba(68,221,170,0.3)' : 'rgba(255,60,80,0.3)'}`,
          }}
        >
          {passed
            ? <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#44ddaa' }} />
            : <XCircle size={48} className="mx-auto mb-4" style={{ color: '#ff3c50' }} />}
          <p className="font-japanese font-bold mb-1" style={{ fontSize: 72, lineHeight: 1, color: 'var(--text-1)' }}>
            {pctScore}点
          </p>
          <p className="text-lg font-semibold mb-1" style={{ color: passed ? '#44ddaa' : '#ff3c50' }}>
            {passed ? 'PASS — おめでとう！' : 'FAIL — もう少しがんばろう！'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            {totalCorrect} / {total} correct
          </p>
        </div>

        {/* Breakdown */}
        <div
          className="rounded-xl p-6 mb-6 grid grid-cols-2 gap-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {[
            { label: '単語 Vocabulary', jp: '単語', correct: vocabCorrect, total: vocabAnswers.length, color: '#ff0080' },
            { label: '漢字 Kanji', jp: '漢字', correct: kanjiCorrect, total: kanjiAnswers.length, color: '#c084fc' },
          ].map(({ label, jp, correct, total: t, color }) => {
            const p = t > 0 ? Math.round((correct / t) * 100) : 0;
            return (
              <div key={jp} className="text-center">
                <p className="font-japanese text-2xl font-bold mb-1" style={{ color }}>{jp}</p>
                <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>{p}%</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{correct}/{t} correct</p>
                {/* Bar */}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p}%`, background: color, transition: 'width 0.8s ease' }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: p >= 60 ? '#44ddaa' : '#ff3c50' }}>
                  {p >= 60 ? '合格' : '不合格'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={startTest} className="btn-primary flex items-center gap-2">
            <RotateCcw size={14} /> もう一度
          </button>
          <button onClick={() => setPhase('intro')} className="btn-secondary">
            設定を変更
          </button>
        </div>
      </div>
    );
  }

  return null;
}
