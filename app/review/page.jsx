'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { CheckCircle, RotateCcw } from 'lucide-react';

export default function ReviewPage() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    fetch('/api/review/due')
      .then((r) => r.json())
      .then((d) => { setCards(d.cards); setLoading(false); });
  }, []);

  const current = cards[index];

  async function submitAnswer(label) {
    if (submitting || !current) return;
    setSubmitting(true);
    const wasCorrect = label === 'good' || label === 'easy';
    setSessionStats((s) => ({
      correct: s.correct + (wasCorrect ? 1 : 0),
      total: s.total + 1,
    }));

    await fetch('/api/review/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: current.id, label }),
    });

    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
    setSubmitting(false);
  }

  async function restart() {
    setLoading(true);
    const d = await fetch('/api/review/due').then((r) => r.json());
    setCards(d.cards);
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setSessionStats({ correct: 0, total: 0 });
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Review</h1>
        <p className="text-sm text-zinc-500 mt-1">Spaced repetition review — {cards.length} cards due</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading cards…</div>
      ) : done || cards.length === 0 ? (
        <div className="max-w-sm mx-auto card p-8 text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-zinc-900 mb-1">
            {cards.length === 0 ? 'All caught up!' : 'Review complete!'}
          </p>
          <p className="text-sm text-zinc-500 mb-6">
            {cards.length === 0
              ? 'No cards are due for review today.'
              : `${sessionStats.correct} / ${sessionStats.total} answered correctly`}
          </p>
          <button onClick={restart} className="btn-secondary flex items-center gap-2 mx-auto">
            <RotateCcw size={14} /> Check again
          </button>
        </div>
      ) : current ? (
        <div className="max-w-md mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                style={{ width: `${(index / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 shrink-0">{index}/{cards.length}</span>
          </div>

          {/* Card */}
          <div className="card p-8 text-center mb-4">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4 capitalize">{current.content_type}</p>
            <p className="font-japanese text-6xl font-medium text-zinc-900 mb-2">{current.front}</p>
            {current.reading && !flipped && (
              <p className="text-sm font-japanese text-zinc-400">{current.reading}</p>
            )}

            {!flipped ? (
              <button
                onClick={() => setFlipped(true)}
                className="btn-secondary mt-6"
              >
                Reveal Answer
              </button>
            ) : (
              <div className="mt-6">
                <p className="text-lg font-medium text-zinc-700 mb-1">{current.back}</p>
                {current.hint && (
                  <p className="text-sm font-japanese text-zinc-400 mb-1">{current.hint}</p>
                )}
                <div className="flex justify-center mt-2">
                  <AudioButton text={current.front} />
                </div>
              </div>
            )}
          </div>

          {/* SRS buttons */}
          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'again', display: 'Again', desc: '<1d', style: 'btn-again' },
                { label: 'hard', display: 'Hard', desc: '~3d', style: 'btn-hard' },
                { label: 'good', display: 'Good', desc: '~7d', style: 'btn-good' },
                { label: 'easy', display: 'Easy', desc: '~21d', style: 'btn-easy' },
              ].map(({ label, display, desc, style }) => (
                <button
                  key={label}
                  onClick={() => submitAnswer(label)}
                  disabled={submitting}
                  className={`${style} flex flex-col items-center`}
                >
                  <span>{display}</span>
                  <span className="text-[10px] opacity-60">{desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
