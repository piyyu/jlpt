'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';

export default function KanjiPage() {
  const [kanji, setKanji] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kanji')
      .then((r) => r.json())
      .then((d) => { setKanji(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Kanji</h1>
        <p className="text-sm text-zinc-500 mt-1">All N5 kanji — {kanji.length} characters</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {kanji.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelected(selected?.id === k.id ? null : k)}
              className={`card p-3 flex flex-col items-center gap-1 hover:bg-zinc-50 transition-colors ${selected?.id === k.id ? 'ring-2 ring-zinc-900' : ''}`}
            >
              <span className="font-japanese text-2xl font-medium text-zinc-900">{k.character}</span>
              <span className="text-[10px] text-zinc-500 truncate w-full text-center">{k.meaning}</span>
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 md:left-56 bg-white border-t border-zinc-200 p-5 z-40 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-start gap-6">
            <div className="text-6xl font-japanese font-bold text-zinc-900 leading-none shrink-0">
              {selected.character}
            </div>
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <Info label="Meaning" value={selected.meaning} />
                <Info label="On-yomi" value={selected.on_yomi || '—'} mono />
                <Info label="Kun-yomi" value={selected.kun_yomi || '—'} mono />
                <Info label="Strokes" value={selected.stroke_count || '—'} />
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {selected.example_word1 && (
                  <span className="font-japanese text-zinc-700 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                    {selected.example_word1}
                  </span>
                )}
                {selected.example_word2 && (
                  <span className="font-japanese text-zinc-700 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                    {selected.example_word2}
                  </span>
                )}
                <AudioButton text={selected.character} className="ml-2" />
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none shrink-0">×</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-zinc-900 ${mono ? 'font-japanese' : ''}`}>{value}</p>
    </div>
  );
}
