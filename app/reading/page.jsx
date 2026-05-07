'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ReadingPage() {
  const [passages, setPassages] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [furigana, setFurigana] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reading')
      .then((r) => r.json())
      .then((d) => { setPassages(d); setLoading(false); });
  }, []);

  const current = passages[index];
  const answered = selected !== null;
  const correctAnswer = current ? current[`option_${current.correct_option}`] : '';
  const options = current
    ? [current.option_a, current.option_b, current.option_c, current.option_d]
    : [];

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    const correct = opt === correctAnswer;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    if (index + 1 >= passages.length) setDone(true);
    else { setIndex(index + 1); setSelected(null); }
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setDone(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Reading</h1>
          <p className="text-sm text-zinc-500 mt-1">{passages.length} passages with comprehension questions</p>
        </div>
        <button
          onClick={() => setFurigana(!furigana)}
          className="btn-secondary flex items-center gap-2"
        >
          {furigana ? <EyeOff size={14} /> : <Eye size={14} />}
          {furigana ? 'Hide Furigana' : 'Show Furigana'}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : done ? (
        <div className="max-w-sm mx-auto card p-8 text-center">
          <p className="text-4xl font-semibold text-zinc-900 mb-2">{score.correct}/{score.total}</p>
          <p className="text-zinc-500 text-sm mb-6">{Math.round((score.correct / score.total) * 100)}% correct</p>
          <button onClick={restart} className="btn-primary w-full">Try Again</button>
        </div>
      ) : current ? (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4 text-xs text-zinc-400">
            <span>Passage {index + 1} of {passages.length}</span>
            <span>{score.correct} correct so far</span>
          </div>

          {/* Passage */}
          <div className="card p-6 mb-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">{current.title}</h2>
            <p className={`font-japanese text-sm leading-loose text-zinc-800 ${furigana ? '' : ''}`}>
              {current.passage}
            </p>
            {!furigana && (
              <p className="text-xs text-zinc-400 mt-3 italic">Furigana hidden</p>
            )}
          </div>

          {/* Question */}
          <div className="card p-6">
            <p className="text-sm font-medium text-zinc-900 mb-4">{current.question}</p>
            <div className="space-y-2">
              {options.map((opt, i) => {
                let style = 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
                if (answered) {
                  if (opt === correctAnswer) style = 'border border-green-300 bg-green-50 text-green-800';
                  else if (opt === selected) style = 'border border-red-300 bg-red-50 text-red-800';
                  else style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
                }
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)} disabled={answered}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${style}`}>
                    <span className="text-zinc-400 shrink-0">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <button onClick={next} className="btn-primary w-full mt-4">
                {index + 1 < passages.length ? 'Next Passage →' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
