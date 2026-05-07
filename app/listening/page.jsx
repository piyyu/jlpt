'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { Volume2 } from 'lucide-react';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function ListeningPage() {
  const [scripts, setScripts] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch('/api/listening')
      .then((r) => r.json())
      .then((d) => { setScripts(shuffle(d)); setLoading(false); });
  }, []);

  const current = scripts[index];
  const answered = selected !== null;
  const correctAnswer = current ? current[`option_${current.correct_option}`] : '';
  const options = current
    ? [current.option_a, current.option_b, current.option_c, current.option_d]
    : [];

  function playAudio() {
    if (!current || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(current.script_jp);
    utt.lang = 'ja-JP';
    utt.rate = 0.9;
    utt.onstart = () => setPlaying(true);
    utt.onend = () => { setPlaying(false); setPlayed(true); };
    window.speechSynthesis.speak(utt);
  }

  function handleAnswer(opt) {
    if (answered || !played) return;
    setSelected(opt);
    const correct = opt === correctAnswer;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      if (index + 1 >= scripts.length) setDone(true);
      else {
        setIndex(index + 1);
        setSelected(null);
        setPlayed(false);
      }
    }, 1000);
  }

  function restart() {
    setScripts(shuffle(scripts));
    setIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setDone(false);
    setPlayed(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Listening</h1>
        <p className="text-sm text-zinc-500 mt-1">Listen to the sentence and choose the correct meaning</p>
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
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4 text-xs text-zinc-400">
            <span>{index + 1} / {scripts.length}</span>
            <span>{score.correct} correct</span>
          </div>

          {/* Audio player */}
          <div className="card p-8 text-center mb-6">
            <p className="text-xs text-zinc-400 mb-4 uppercase tracking-wider">Click to listen</p>
            <button
              onClick={playAudio}
              disabled={playing}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                playing ? 'border-zinc-400 bg-zinc-100 animate-pulse' : 'border-zinc-900 bg-white hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Volume2 size={24} />
            </button>
            {played && !answered && (
              <p className="text-xs text-zinc-400 mt-3">Now choose the meaning below</p>
            )}
            {!played && (
              <p className="text-xs text-zinc-400 mt-3">Press play before answering</p>
            )}
          </div>

          {/* Question */}
          {current.question && (
            <p className="text-sm text-zinc-600 mb-3 text-center">{current.question}</p>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => {
              let style = `border border-zinc-200 bg-white text-zinc-700 ${played && !answered ? 'hover:bg-zinc-50 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`;
              if (answered) {
                if (opt === correctAnswer) style = 'border border-green-300 bg-green-50 text-green-800';
                else if (opt === selected) style = 'border border-red-300 bg-red-50 text-red-800';
                else style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
              }
              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={!played || answered}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all text-left ${style}`}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
