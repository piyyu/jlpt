'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { useSettings } from '@/lib/useSettings';

export default function ReviewPage() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const { showEnglish } = useSettings();

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
    setStats((s) => ({ correct: s.correct + (wasCorrect ? 1 : 0), total: s.total + 1 }));
    await fetch('/api/review/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: current.id, label }),
    });
    if (index + 1 >= cards.length) { setDone(true); }
    else { setIndex(index + 1); setFlipped(false); }
    setSubmitting(false);
  }

  async function restart() {
    setLoading(true);
    const d = await fetch('/api/review/due').then((r) => r.json());
    setCards(d.cards);
    setIndex(0); setFlipped(false); setDone(false);
    setStats({ correct: 0, total: 0 });
    setLoading(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>
          スペースド・リピティション
        </p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>復習</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Review — {cards.length} cards due today
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center font-japanese text-sm" style={{ color: 'var(--text-3)' }}>
          読み込み中…
        </div>
      ) : done || cards.length === 0 ? (
        <div
          className="max-w-sm mx-auto rounded-xl p-10 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,0,128,0.2)' }}
        >
          <CheckCircle size={40} className="mx-auto mb-4" style={{ color: '#44ddaa' }} />
          <p className="font-japanese text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>
            {cards.length === 0 ? '完璧！' : 'お疲れ様！'}
          </p>
          <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
            {cards.length === 0 ? 'No cards due for review.' : `${stats.correct} / ${stats.total} correct`}
          </p>
          {stats.total > 0 && (
            <p className="font-japanese text-3xl font-bold mb-6" style={{ color: 'var(--pink)' }}>
              {Math.round((stats.correct / stats.total) * 100)}点
            </p>
          )}
          <button onClick={restart} className="btn-secondary flex items-center gap-2 mx-auto">
            <RotateCcw size={13} /> もう一度
          </button>
        </div>
      ) : current ? (
        <div className="max-w-md mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(index / cards.length) * 100}%`, background: 'var(--pink)' }}
              />
            </div>
            <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-3)' }}>
              {index}/{cards.length}
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-xl p-10 text-center mb-5 card-review"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Card type + show_english indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="font-japanese text-xs uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                {current.content_type === 'vocabulary' ? '単語' : '漢字'}
              </p>
              {showEnglish && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider"
                  style={{ background: 'rgba(255,0,128,0.15)', color: 'var(--pink)', border: '1px solid rgba(255,0,128,0.3)' }}
                >
                  EN ON
                </span>
              )}
            </div>

            {/* Main Japanese character */}
            <p
              className="font-japanese font-bold mb-3"
              style={{ fontSize: '80px', lineHeight: 1, color: 'var(--text-1)' }}
            >
              {current.front}
            </p>

            {/* Reading (hiragana) — always visible */}
            {current.reading && (
              <p className="font-japanese text-base mb-2" style={{ color: 'var(--text-3)' }}>
                {current.reading}
              </p>
            )}

            {/* English meaning — shown on front when setting is ON */}
            {showEnglish && !flipped && (
              <p
                className="text-base font-medium mt-3 mb-2"
                style={{ color: 'var(--pink)', opacity: 0.85 }}
              >
                {current.back}
              </p>
            )}

            {!flipped ? (
              <button
                onClick={() => setFlipped(true)}
                className="mt-6 btn-secondary"
              >
                答えを見る
              </button>
            ) : (
              <div className="mt-6">
                <p
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--pink)' }}
                >
                  {current.back}
                </p>
                {current.hint && (
                  <p className="font-japanese text-sm mb-3" style={{ color: 'var(--text-3)' }}>
                    {current.hint}
                  </p>
                )}
                <div className="flex justify-center">
                  <AudioButton text={current.front} />
                </div>
              </div>
            )}
          </div>

          {/* SRS buttons */}
          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'again', jp: 'また',  en: '<1d',  cls: 'btn-again' },
                { label: 'hard',  jp: '難しい', en: '~3d',  cls: 'btn-hard'  },
                { label: 'good',  jp: '良い',  en: '~7d',  cls: 'btn-good'  },
                { label: 'easy',  jp: '簡単',  en: '~21d', cls: 'btn-easy'  },
              ].map(({ label, jp, en, cls }) => (
                <button
                  key={label}
                  onClick={() => submitAnswer(label)}
                  disabled={submitting}
                  className={`${cls} flex flex-col items-center gap-0.5`}
                >
                  <span className="font-japanese text-xs">{jp}</span>
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>{en}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
