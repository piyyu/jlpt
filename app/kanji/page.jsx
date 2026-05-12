'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { X, CheckSquare, Square } from 'lucide-react';
import { toRomajiParts } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

export default function KanjiPage() {
  const [kanji, setKanji] = useState([]);
  const [selected, setSelected] = useState(null);   // kanji card open in detail panel
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState(new Set()); // ticked IDs
  const [selCount, setSelCount] = useState(0);
  const [toggling, setToggling] = useState(null);
  const { showEnglish } = useSettings();

  useEffect(() => {
    fetch('/api/kanji')
      .then((r) => r.json())
      .then((d) => { setKanji(d); setLoading(false); });
    fetch('/api/selections?type=kanji')
      .then((r) => r.json())
      .then((ids) => { setSelections(new Set(ids)); setSelCount(ids.length); });
  }, []);

  async function toggleSelection(id, e) {
    e.stopPropagation();
    if (toggling) return;
    setToggling(id);
    const isSel = selections.has(id);
    const next = new Set(selections);
    if (isSel) next.delete(id); else next.add(id);
    setSelections(next);
    setSelCount(next.size);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'kanji', content_id: id, selected: !isSel }),
    });
    setToggling(null);
  }

  async function clearAll() {
    await fetch('/api/selections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'kanji' }),
    });
    setSelections(new Set());
    setSelCount(0);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>漢字リスト</p>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Kanji</h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            All N5 kanji — {kanji.length} characters · click card for details
            {selCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,0,128,0.12)', color: 'var(--pink)', border: '1px solid rgba(255,0,128,0.3)' }}>
                {selCount} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/quiz?type=kanji${selCount > 0 ? '&selected_only=true' : ''}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors font-medium"
            style={{ background: 'var(--text-1)', color: 'var(--bg-base)' }}
          >
            {selCount > 0 ? 'Quiz Selected' : 'Quiz All'}
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {kanji.map((k) => {
            const isDetail = selected?.id === k.id;
            const isSel = selections.has(k.id);
            return (
              <div key={k.id} className="relative group">
                {/* Main card button */}
                <button
                  onClick={() => setSelected(isDetail ? null : k)}
                  className="w-full rounded-lg p-2 flex flex-col items-center gap-1 transition-all"
                  style={{
                    background: isDetail ? 'rgba(255,0,128,0.08)' : isSel ? 'rgba(255,0,128,0.04)' : 'var(--bg-surface)',
                    border: `1px solid ${isDetail ? 'rgba(255,0,128,0.4)' : isSel ? 'rgba(255,0,128,0.25)' : 'var(--border)'}`,
                  }}
                >
                  {/* Character */}
                  <span className="font-japanese font-semibold leading-none" style={{ fontSize: '28px', color: 'var(--text-1)' }}>
                    {k.character}
                  </span>
                  {/* Primary reading */}
                  <span className="font-japanese leading-none text-center w-full truncate" style={{ fontSize: '9px', color: 'var(--text-3)' }}>
                    {(k.kun_yomi || k.on_yomi || '').split(/[・/]/)[0]}
                  </span>
                  {/* Romaji */}
                  {showEnglish && (
                    <span className="font-mono leading-none text-center w-full truncate" style={{ fontSize: '8px', color: 'var(--pink)', opacity: 0.7 }}>
                      {toRomajiParts((k.kun_yomi || k.on_yomi || '').split(/[・/]/)[0])}
                    </span>
                  )}
                  {/* English meaning */}
                  <span className="text-center w-full leading-tight" style={{ fontSize: '9px', color: 'var(--text-2)' }}>
                    {k.meaning.split('/')[0].trim()}
                  </span>
                </button>

                {/* Tick/checkbox overlay — top-right corner */}
                <button
                  onClick={(e) => toggleSelection(k.id, e)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  style={{ color: isSel ? 'var(--pink)' : 'var(--text-3)' }}
                  title={isSel ? 'Remove from review' : 'Add to review'}
                >
                  {isSel
                    ? <CheckSquare size={12} style={{ color: 'var(--pink)' }} />
                    : <Square size={12} style={{ opacity: 0.5 }} />}
                </button>

                {/* Always-visible pink dot if selected */}
                {isSel && (
                  <div
                    className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--pink)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] z-20 p-6 border-t transition-all duration-300 ease-in-out"
          style={{ background: '#0d0d0d', borderColor: 'rgba(255,0,128,0.2)' }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-8">
              {/* Big character + select toggle */}
              <div className="text-center shrink-0">
                <p className="font-japanese font-bold leading-none" style={{ fontSize: '72px', color: 'var(--text-1)' }}>
                  {selected.character}
                </p>
                <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--pink)' }}>{selected.stroke_count} strokes</p>
                {/* Big select button in detail panel */}
                <button
                  onClick={(e) => toggleSelection(selected.id, e)}
                  className="mt-2 flex items-center gap-1 mx-auto text-xs px-2 py-1 rounded-md transition-all"
                  style={selections.has(selected.id)
                    ? { background: 'rgba(255,0,128,0.15)', border: '1px solid rgba(255,0,128,0.4)', color: 'var(--pink)' }
                    : { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
                >
                  {selections.has(selected.id)
                    ? <><CheckSquare size={11} /> Selected</>
                    : <><Square size={11} /> Select</>}
                </button>
              </div>

              {/* Readings grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Meaning</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{selected.meaning}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    On-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(音読み)</span>
                  </p>
                  <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>{selected.on_yomi || '—'}</p>
                  {showEnglish && selected.on_yomi && (
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.8 }}>{toRomajiParts(selected.on_yomi)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    Kun-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(訓読み)</span>
                  </p>
                  <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>{selected.kun_yomi || '—'}</p>
                  {showEnglish && selected.kun_yomi && (
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.8 }}>{toRomajiParts(selected.kun_yomi)}</p>
                  )}
                </div>
                {(selected.example_word1 || selected.example_word2) && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Examples</p>
                    <div className="flex flex-wrap gap-4">
                      {[selected.example_word1, selected.example_word2].filter(Boolean).map((ex, i) => {
                        const match = ex.match(/^(.+?)\s*\((.+?)\)$/);
                        const word = match ? match[1] : ex;
                        const reading = match ? match[2] : '';
                        return (
                          <div key={i} className="flex flex-col">
                            <span className="font-japanese text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{word}</span>
                            {reading && (
                              <>
                                <span className="font-japanese text-xs" style={{ color: 'var(--text-3)' }}>{reading}</span>
                                {showEnglish && (
                                  <span className="font-mono text-xs" style={{ color: 'var(--pink)', opacity: 0.7 }}>{toRomajiParts(reading)}</span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Close + audio */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-md" style={{ color: 'var(--text-3)' }}>
                  <X size={16} />
                </button>
                <AudioButton text={selected.character} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
