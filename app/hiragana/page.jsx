'use client';

import { useState } from 'react';

const HIRAGANA = [
  { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' }, { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' }, { char: 'お', romaji: 'o' },
  { char: 'か', romaji: 'ka' }, { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' }, { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
  { char: 'さ', romaji: 'sa' }, { char: 'し', romaji: 'shi' }, { char: 'す', romaji: 'su' }, { char: 'せ', romaji: 'se' }, { char: 'そ', romaji: 'so' },
  { char: 'た', romaji: 'ta' }, { char: 'ち', romaji: 'chi' }, { char: 'つ', romaji: 'tsu' }, { char: 'て', romaji: 'te' }, { char: 'と', romaji: 'to' },
  { char: 'な', romaji: 'na' }, { char: 'に', romaji: 'ni' }, { char: 'ぬ', romaji: 'nu' }, { char: 'ね', romaji: 'ne' }, { char: 'の', romaji: 'no' },
  { char: 'は', romaji: 'ha' }, { char: 'ひ', romaji: 'hi' }, { char: 'ふ', romaji: 'fu' }, { char: 'へ', romaji: 'he' }, { char: 'ほ', romaji: 'ho' },
  { char: 'ま', romaji: 'ma' }, { char: 'み', romaji: 'mi' }, { char: 'む', romaji: 'mu' }, { char: 'め', romaji: 'me' }, { char: 'も', romaji: 'mo' },
  { char: 'や', romaji: 'ya' }, { char: 'ゆ', romaji: 'yu' }, { char: 'よ', romaji: 'yo' },
  { char: 'ら', romaji: 'ra' }, { char: 'り', romaji: 'ri' }, { char: 'る', romaji: 'ru' }, { char: 'れ', romaji: 're' }, { char: 'ろ', romaji: 'ro' },
  { char: 'わ', romaji: 'wa' }, { char: 'を', romaji: 'wo' }, { char: 'ん', romaji: 'n' },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function getOptions(correct, all) {
  const others = shuffle(all.filter((c) => c.romaji !== correct.romaji)).slice(0, 3);
  return shuffle([correct, ...others]);
}

export default function HiraganaPage() {
  const [mode, setMode] = useState('reference'); // 'reference' | 'drill'
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillQueue, setDrillQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function startDrill() {
    setDrillQueue(shuffle(HIRAGANA));
    setDrillIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setMode('drill');
  }

  const current = drillQueue[drillIndex];
  const options = current ? getOptions(current, HIRAGANA) : [];
  const answered = selected !== null;

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    const correct = opt.romaji === current.romaji;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      if (drillIndex + 1 >= drillQueue.length) {
        setMode('result');
      } else {
        setDrillIndex(drillIndex + 1);
        setSelected(null);
      }
    }, 800);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Hiragana</h1>
          <p className="text-sm text-zinc-500 mt-1">Reference chart and drill mode</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('reference')} className={mode === 'reference' ? 'btn-primary' : 'btn-secondary'}>Reference</button>
          <button onClick={startDrill} className={mode === 'drill' ? 'btn-primary' : 'btn-secondary'}>Drill</button>
        </div>
      </div>

      {mode === 'reference' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-5 divide-x divide-y divide-zinc-100">
            {HIRAGANA.map((h) => (
              <div key={h.char} className="p-3 flex flex-col items-center gap-1 hover:bg-zinc-50 transition-colors">
                <span className="font-japanese text-2xl text-zinc-900">{h.char}</span>
                <span className="text-xs text-zinc-400 font-mono">{h.romaji}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'drill' && current && (
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4 text-xs text-zinc-400">
            <span>{drillIndex + 1} / {drillQueue.length}</span>
            <span>{score.correct} correct</span>
          </div>
          <div className="card p-10 text-center mb-6">
            <span className="font-japanese text-8xl font-medium text-zinc-900">{current.char}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => {
              let style = 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50';
              if (answered) {
                if (opt.romaji === current.romaji) style = 'border border-green-300 bg-green-50 text-green-800';
                else if (opt.romaji === selected?.romaji) style = 'border border-red-300 bg-red-50 text-red-800';
                else style = 'border border-zinc-100 bg-zinc-50 text-zinc-400';
              }
              return (
                <button key={opt.romaji} onClick={() => handleAnswer(opt)} disabled={answered}
                  className={`py-3 rounded-lg text-sm font-mono font-medium transition-all ${style}`}>
                  {opt.romaji}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'result' && (
        <div className="max-w-sm mx-auto card p-8 text-center">
          <p className="text-4xl font-semibold text-zinc-900 mb-2">{score.correct}/{score.total}</p>
          <p className="text-zinc-500 text-sm mb-6">
            {Math.round((score.correct / score.total) * 100)}% accuracy
          </p>
          <button onClick={startDrill} className="btn-primary w-full">Try Again</button>
          <button onClick={() => setMode('reference')} className="btn-secondary w-full mt-2">Back to Reference</button>
        </div>
      )}
    </div>
  );
}
