'use client';

import { useEffect, useState } from 'react';

export default function ParticlesPage() {
  const [particles, setParticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/particles')
      .then((r) => r.json())
      .then((d) => { setParticles(d); setLoading(false); });
  }, []);

  const current = particles[practiceIndex];

  function startPractice() {
    setPracticeIndex(0);
    setUserAnswer('');
    setRevealed(false);
    setPracticeMode(true);
  }

  function next() {
    if (practiceIndex + 1 < particles.length) {
      setPracticeIndex(practiceIndex + 1);
      setUserAnswer('');
      setRevealed(false);
    } else {
      setPracticeMode(false);
    }
  }

  const isCorrect = revealed && userAnswer.trim() === current?.blank_answer;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Particles</h1>
          <p className="text-sm text-zinc-500 mt-1">{particles.length} particles with fill-in-the-blank practice</p>
        </div>
        <button onClick={startPractice} className="btn-primary">Practice</button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : practiceMode ? (
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs text-zinc-400 mb-4">
            <span>{practiceIndex + 1} / {particles.length}</span>
            <button onClick={() => setPracticeMode(false)} className="text-zinc-400 hover:text-zinc-700">Exit</button>
          </div>
          <div className="card p-8">
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-4">Fill in the blank</p>
            <p className="font-japanese text-xl text-zinc-800 mb-6">{current?.blank_sentence}</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !revealed && setRevealed(true)}
                placeholder="Type the particle…"
                className="flex-1 px-3 py-2 text-sm border border-zinc-200 rounded-lg font-japanese focus:outline-none focus:ring-2 focus:ring-zinc-900"
                disabled={revealed}
              />
              {!revealed && (
                <button onClick={() => setRevealed(true)} className="btn-primary">Check</button>
              )}
            </div>
            {revealed && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {isCorrect ? '✓ Correct!' : `✗ Answer: 「${current.blank_answer}」`}
                <p className="mt-1 font-japanese">{current.example_jp}</p>
                <p className="text-xs mt-0.5 opacity-75">{current.example_en}</p>
              </div>
            )}
            {revealed && (
              <button onClick={next} className="btn-primary w-full">
                {practiceIndex + 1 < particles.length ? 'Next →' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {particles.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <button
                onClick={() => setSelected(selected === p.id ? null : p.id)}
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
              >
                <span className="font-japanese text-2xl font-bold text-zinc-900 w-8 shrink-0">{p.particle}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-700">{p.usage_type}</p>
                  <p className="text-sm text-zinc-500">{p.meaning}</p>
                </div>
              </button>
              {selected === p.id && (
                <div className="border-t border-zinc-100 px-5 py-4 bg-zinc-50">
                  <p className="font-japanese text-sm text-zinc-800 mb-1">{p.example_jp}</p>
                  <p className="text-xs text-zinc-500">{p.example_en}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
