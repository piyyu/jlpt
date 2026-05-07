'use client';

import { useState } from 'react';

const KATAKANA = [
  { char: 'ア', romaji: 'a' }, { char: 'イ', romaji: 'i' }, { char: 'ウ', romaji: 'u' }, { char: 'エ', romaji: 'e' }, { char: 'オ', romaji: 'o' },
  { char: 'カ', romaji: 'ka' }, { char: 'キ', romaji: 'ki' }, { char: 'ク', romaji: 'ku' }, { char: 'ケ', romaji: 'ke' }, { char: 'コ', romaji: 'ko' },
  { char: 'サ', romaji: 'sa' }, { char: 'シ', romaji: 'shi' }, { char: 'ス', romaji: 'su' }, { char: 'セ', romaji: 'se' }, { char: 'ソ', romaji: 'so' },
  { char: 'タ', romaji: 'ta' }, { char: 'チ', romaji: 'chi' }, { char: 'ツ', romaji: 'tsu' }, { char: 'テ', romaji: 'te' }, { char: 'ト', romaji: 'to' },
  { char: 'ナ', romaji: 'na' }, { char: 'ニ', romaji: 'ni' }, { char: 'ヌ', romaji: 'nu' }, { char: 'ネ', romaji: 'ne' }, { char: 'ノ', romaji: 'no' },
  { char: 'ハ', romaji: 'ha' }, { char: 'ヒ', romaji: 'hi' }, { char: 'フ', romaji: 'fu' }, { char: 'ヘ', romaji: 'he' }, { char: 'ホ', romaji: 'ho' },
  { char: 'マ', romaji: 'ma' }, { char: 'ミ', romaji: 'mi' }, { char: 'ム', romaji: 'mu' }, { char: 'メ', romaji: 'me' }, { char: 'モ', romaji: 'mo' },
  { char: 'ヤ', romaji: 'ya' }, { char: 'ユ', romaji: 'yu' }, { char: 'ヨ', romaji: 'yo' },
  { char: 'ラ', romaji: 'ra' }, { char: 'リ', romaji: 'ri' }, { char: 'ル', romaji: 'ru' }, { char: 'レ', romaji: 're' }, { char: 'ロ', romaji: 'ro' },
  { char: 'ワ', romaji: 'wa' }, { char: 'ヲ', romaji: 'wo' }, { char: 'ン', romaji: 'n' },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function getOptions(correct, all) {
  const others = shuffle(all.filter((c) => c.romaji !== correct.romaji)).slice(0, 3);
  return shuffle([correct, ...others]);
}

export default function KatakanaPage() {
  const [mode, setMode] = useState('reference');
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillQueue, setDrillQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function startDrill() {
    setDrillQueue(shuffle(KATAKANA));
    setDrillIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setMode('drill');
  }

  const current = drillQueue[drillIndex];
  const options = current ? getOptions(current, KATAKANA) : [];
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
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Katakana</h1>
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
            {KATAKANA.map((k) => (
              <div key={k.char} className="p-3 flex flex-col items-center gap-1 hover:bg-zinc-50 transition-colors">
                <span className="font-japanese text-2xl text-zinc-900">{k.char}</span>
                <span className="text-xs text-zinc-400 font-mono">{k.romaji}</span>
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
