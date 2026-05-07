'use client';

import { useEffect, useState } from 'react';

const TYPES = ['', 'time', 'date', 'price', 'counter'];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function generateOptions(correct, all) {
  const others = shuffle(all.filter((d) => d.answer !== correct)).slice(0, 3).map((d) => d.answer);
  return shuffle([correct, ...others]);
}

export default function NumbersPage() {
  const [drills, setDrills] = useState([]);
  const [type, setType] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = type ? `?type=${type}` : '';
    setLoading(true);
    fetch(`/api/numbers${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDrills(shuffle(d));
        setIndex(0);
        setSelected(null);
        setScore({ correct: 0, total: 0 });
        setDone(false);
        setLoading(false);
      });
  }, [type]);

  const current = drills[index];
  const options = current ? generateOptions(current.answer, drills) : [];
  const answered = selected !== null;

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    const correct = opt === current.answer;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      if (index + 1 >= drills.length) {
        setDone(true);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 900);
  }

  function restart() {
    setDrills(shuffle(drills));
    setIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setDone(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Numbers & Counters</h1>
          <p className="text-sm text-zinc-500 mt-1">Drills for time, dates, prices, and counters</p>
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All types'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : done ? (
        <div className="max-w-sm mx-auto card p-8 text-center">
          <p className="text-4xl font-semibold text-zinc-900 mb-2">{score.correct}/{score.total}</p>
          <p className="text-zinc-500 text-sm mb-6">
            {Math.round((score.correct / score.total) * 100)}% correct
          </p>
          <button onClick={restart} className="btn-primary w-full">Try Again</button>
        </div>
      ) : current ? (
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4 text-xs text-zinc-400">
            <span>{index + 1} / {drills.length}</span>
            <span className="capitalize badge bg-zinc-100 text-zinc-600">{current.type}</span>
          </div>
          <div className="card p-8 text-center mb-6">
            <p className="font-japanese text-5xl font-medium text-zinc-900 mb-3">{current.display_value}</p>
            {current.hint && <p className="text-xs text-zinc-400">{current.hint}</p>}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => {
              let style = 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
              if (answered) {
                if (opt === current.answer) style = 'border border-green-300 bg-green-50 text-green-800';
                else if (opt === selected) style = 'border border-red-300 bg-red-50 text-red-800';
                else style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
              }
              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={answered}
                  className={`py-3 rounded-lg text-sm font-medium transition-all text-center ${style}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-zinc-400 text-sm">No drills found</div>
      )}
    </div>
  );
}
