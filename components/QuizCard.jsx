'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function QuizCard({ prompt, hint, options = [], correctAnswer, onAnswer, index, total }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;

  useEffect(() => {
    function onKey(e) {
      if (answered || options.length === 0) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx <= 3 && options[idx]) {
        handleSelect(options[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, options]);

  function handleSelect(option) {
    if (answered) return;
    setSelected(option);
    const correct = option === correctAnswer;
    setTimeout(() => { onAnswer(correct); setSelected(null); }, 900);
  }

  function optionStyle(option) {
    if (!answered) {
      return {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
      };
    }
    if (option === correctAnswer) {
      return {
        background: 'rgba(0,210,130,0.1)',
        border: '1px solid rgba(0,210,130,0.4)',
        color: '#44ddaa',
      };
    }
    if (option === selected) {
      return {
        background: 'rgba(255,60,60,0.1)',
        border: '1px solid rgba(255,60,60,0.4)',
        color: '#ff6666',
      };
    }
    return {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      color: 'var(--text-3)',
      opacity: 0.5,
    };
  }

  return (
    <div
      className="rounded-xl p-8 max-w-xl mx-auto"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Progress bar */}
      {index != null && total != null && (
        <div className="flex items-center gap-2 mb-6">
          <div
            className="flex-1 h-0.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((index - 1) / total) * 100}%`, background: 'var(--pink)' }}
            />
          </div>
          <span className="text-xs shrink-0 font-mono" style={{ color: 'var(--text-3)' }}>
            {index}/{total}
          </span>
        </div>
      )}

      {/* Prompt */}
      <div className="text-center mb-8">
        <p className="font-japanese font-bold mb-2" style={{ fontSize: '64px', lineHeight: 1, color: 'var(--text-1)' }}>
          {prompt}
        </p>
        {hint && (
          <p className="font-japanese text-sm" style={{ color: 'var(--text-3)' }}>{hint}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all text-left"
            style={optionStyle(option)}
          >
            <span>{option}</span>
            {answered && option === correctAnswer && <CheckCircle size={15} style={{ color: '#44ddaa' }} />}
            {answered && option === selected && option !== correctAnswer && <XCircle size={15} style={{ color: '#ff6666' }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
