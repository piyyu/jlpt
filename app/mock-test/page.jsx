'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, Timer, CheckCircle, XCircle } from 'lucide-react';

export default function MockTestPage() {
  const [phase, setPhase] = useState('intro'); // intro | test | results
  const [sections, setSections] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sectionKey, setSectionKey] = useState('vocabulary');
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(55 * 60);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const SECTION_ORDER = ['vocabulary', 'grammar', 'reading', 'listening'];

  useEffect(() => {
    if (phase === 'test') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); submitTest(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  async function startTest() {
    setLoading(true);
    const res = await fetch('/api/mock-test/start', { method: 'POST' });
    const data = await res.json();
    setSections(data.sections);
    setSessionId(data.session_id);
    setAnswers([]);
    setSectionKey('vocabulary');
    setSectionIndex(0);
    setSelected(null);
    setTimeLeft(55 * 60);
    setPhase('test');
    setLoading(false);
  }

  const currentSectionItems = sections?.[sectionKey] || [];
  const currentItem = currentSectionItems[sectionIndex];

  function handleAnswer(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === currentItem.correct;
    setAnswers((prev) => [...prev, {
      type: sectionKey,
      id: currentItem.id,
      was_correct: correct,
    }]);
    setTimeout(nextQuestion, 800);
  }

  function nextQuestion() {
    if (sectionIndex + 1 < currentSectionItems.length) {
      setSectionIndex(sectionIndex + 1);
      setSelected(null);
    } else {
      const nextIdx = SECTION_ORDER.indexOf(sectionKey) + 1;
      if (nextIdx < SECTION_ORDER.length) {
        setSectionKey(SECTION_ORDER[nextIdx]);
        setSectionIndex(0);
        setSelected(null);
      } else {
        submitTest();
      }
    }
  }

  async function submitTest() {
    clearInterval(timerRef.current);
    const res = await fetch('/api/mock-test/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, answers }),
    });
    const data = await res.json();
    setResults(data);
    setPhase('results');
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function playAudio(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ja-JP'; utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Mock Test</h1>
        <p className="text-sm text-zinc-500 mt-1">Full N5 simulation — 55 minutes</p>
      </div>

      {phase === 'intro' && (
        <div className="max-w-md card p-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-3">JLPT N5 Simulation</h2>
          <ul className="text-sm text-zinc-600 space-y-2 mb-6">
            <li>• 10 Vocabulary questions</li>
            <li>• 5 Grammar questions</li>
            <li>• 5 Reading comprehension questions</li>
            <li>• 5 Listening questions</li>
            <li>• 55 minute time limit</li>
            <li>• Pass score: 60%</li>
          </ul>
          <button onClick={startTest} disabled={loading} className="btn-primary w-full">
            {loading ? 'Preparing…' : 'Start Test'}
          </button>
        </div>
      )}

      {phase === 'test' && currentItem && (
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2">
              {SECTION_ORDER.map((s) => (
                <span key={s} className={`badge capitalize ${s === sectionKey ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-zinc-700">
              <Timer size={14} className={timeLeft < 300 ? 'text-red-500' : ''} />
              <span className={timeLeft < 300 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4 capitalize">
              {sectionKey} — {sectionIndex + 1}/{currentSectionItems.length}
            </p>

            {sectionKey === 'reading' && currentItem.passage && (
              <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 mb-4">
                <p className="font-japanese text-sm leading-loose text-zinc-800">{currentItem.passage}</p>
              </div>
            )}

            {sectionKey === 'listening' ? (
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => playAudio(currentItem.prompt)}
                  className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                  <Volume2 size={16} />
                </button>
                <p className="text-sm text-zinc-600">{currentItem.question}</p>
              </div>
            ) : (
              <div className="text-center mb-6">
                <p className="font-japanese text-4xl font-medium text-zinc-900 mb-1">{currentItem.prompt}</p>
                {currentItem.hint && <p className="text-sm font-japanese text-zinc-400">{currentItem.hint}</p>}
                {currentItem.question && <p className="text-sm text-zinc-600 mt-2">{currentItem.question}</p>}
              </div>
            )}

            <div className="space-y-2">
              {currentItem.options.map((opt) => {
                let style = 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
                if (selected !== null) {
                  if (opt === currentItem.correct) style = 'border border-green-300 bg-green-50 text-green-800';
                  else if (opt === selected) style = 'border border-red-300 bg-red-50 text-red-800';
                  else style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
                }
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${style}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-right">
            <button onClick={submitTest} className="btn-secondary text-xs">Submit Early</button>
          </div>
        </div>
      )}

      {phase === 'results' && results && (
        <div className="max-w-md mx-auto">
          <div className={`card p-8 text-center mb-6 ${results.passed ? 'border-green-200' : 'border-red-200'}`}>
            {results.passed
              ? <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              : <XCircle size={40} className="text-red-500 mx-auto mb-3" />}
            <p className="text-3xl font-semibold text-zinc-900 mb-1">{results.breakdown.totalScore}%</p>
            <p className={`text-sm font-medium ${results.passed ? 'text-green-600' : 'text-red-500'}`}>
              {results.passed ? 'PASS — おめでとう！' : 'FAIL — もう少しがんばろう！'}
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm font-medium text-zinc-900 mb-4">Score Breakdown</p>
            <div className="space-y-3">
              {[
                { label: 'Vocabulary', score: results.breakdown.vocabScore },
                { label: 'Grammar', score: results.breakdown.grammarScore },
                { label: 'Reading', score: results.breakdown.readingScore },
                { label: 'Listening', score: results.breakdown.listeningScore },
              ].map(({ label, score }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${score >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${score}%` }} />
                  </div>
                  <span className={`text-sm font-medium w-10 text-right ${score >= 60 ? 'text-green-600' : 'text-red-500'}`}>{score}%</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setPhase('intro')} className="btn-primary w-full mt-4">Try Again</button>
        </div>
      )}
    </div>
  );
}
