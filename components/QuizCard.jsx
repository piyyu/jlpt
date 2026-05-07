'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * QuizCard — shows a question with multiple choice options.
 * @param {object} props
 * @param {string} props.prompt         - The question / character to display
 * @param {string} [props.hint]         - Reading hint (shown below prompt)
 * @param {string[]} props.options      - Array of 4 option strings
 * @param {string} props.correctAnswer  - The correct option string
 * @param {function} props.onAnswer     - Called with (wasCorrect: boolean)
 * @param {number} [props.index]        - Question number
 * @param {number} [props.total]        - Total questions
 */
export default function QuizCard({ prompt, hint, options = [], correctAnswer, onAnswer, index, total }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;

  function handleSelect(option) {
    if (answered) return;
    setSelected(option);
    const correct = option === correctAnswer;
    setTimeout(() => {
      onAnswer(correct);
      setSelected(null);
    }, 900);
  }

  return (
    <div className="card p-8 max-w-xl mx-auto">
      {/* Progress */}
      {index != null && total != null && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-300"
              style={{ width: `${((index) / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 shrink-0">{index}/{total}</span>
        </div>
      )}

      {/* Prompt */}
      <div className="text-center mb-8">
        <p className="text-5xl font-japanese font-medium text-zinc-900 mb-2">{prompt}</p>
        {hint && <p className="text-sm text-zinc-400 font-japanese">{hint}</p>}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => {
          let style = 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
          if (answered) {
            if (option === correctAnswer) {
              style = 'border border-green-300 bg-green-50 text-green-800';
            } else if (option === selected) {
              style = 'border border-red-300 bg-red-50 text-red-800';
            } else {
              style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
            }
          }
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${style}`}
            >
              <span>{option}</span>
              {answered && option === correctAnswer && (
                <CheckCircle size={16} className="text-green-600 shrink-0" />
              )}
              {answered && option === selected && option !== correctAnswer && (
                <XCircle size={16} className="text-red-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
