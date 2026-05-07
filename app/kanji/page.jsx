'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { X } from 'lucide-react';
import { toRomajiParts } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

export default function KanjiPage() {
  const [kanji, setKanji]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showEnglish } = useSettings();

  useEffect(() => {
    fetch('/api/kanji')
      .then((r) => r.json())
      .then((d) => { setKanji(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>漢字リスト</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Kanji</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          All N5 kanji — {kanji.length} characters · click any card for details
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {kanji.map((k) => {
            const isSelected = selected?.id === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setSelected(isSelected ? null : k)}
                className="rounded-lg p-2 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: isSelected ? 'rgba(255,0,128,0.08)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'rgba(255,0,128,0.4)' : 'var(--border)'}`,
                }}
              >
                {/* Large kanji character */}
                <span
                  className="font-japanese font-semibold leading-none"
                  style={{ fontSize: '28px', color: 'var(--text-1)' }}
                >
                  {k.character}
                </span>

                {/* Primary reading (kun_yomi preferred, fall back to on_yomi) */}
                <span
                  className="font-japanese leading-none text-center w-full truncate"
                  style={{ fontSize: '9px', color: 'var(--text-3)' }}
                >
                  {(k.kun_yomi || k.on_yomi || '').split(/[・/]/)[0]}
                </span>

                {/* Romaji of the primary reading */}
                {showEnglish && (
                  <span
                    className="font-mono leading-none text-center w-full truncate"
                    style={{ fontSize: '8px', color: 'var(--pink)', opacity: 0.7 }}
                  >
                    {toRomajiParts((k.kun_yomi || k.on_yomi || '').split(/[・/]/)[0])}
                  </span>
                )}

                {/* English meaning */}
                <span
                  className="text-center w-full leading-tight"
                  style={{ fontSize: '9px', color: 'var(--text-2)' }}
                >
                  {k.meaning.split('/')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed bottom-0 left-0 right-0 md:left-56 z-20 p-6 border-t"
          style={{ background: '#0d0d0d', borderColor: 'rgba(255,0,128,0.2)' }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-8">
              {/* Big character */}
              <div className="text-center shrink-0">
                <p
                  className="font-japanese font-bold leading-none"
                  style={{ fontSize: '72px', color: 'var(--text-1)' }}
                >
                  {selected.character}
                </p>
                <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--pink)' }}>
                  {selected.stroke_count} strokes
                </p>
              </div>

              {/* Readings grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Meaning */}
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Meaning</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{selected.meaning}</p>
                </div>

                {/* On-yomi */}
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    On-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(音読み)</span>
                  </p>
                  <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                    {selected.on_yomi || '—'}
                  </p>
                  {showEnglish && selected.on_yomi && (
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.8 }}>
                      {toRomajiParts(selected.on_yomi)}
                    </p>
                  )}
                </div>

                {/* Kun-yomi */}
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>
                    Kun-yomi <span style={{ color: 'var(--pink)', opacity: 0.6 }}>(訓読み)</span>
                  </p>
                  <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                    {selected.kun_yomi || '—'}
                  </p>
                  {showEnglish && selected.kun_yomi && (
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.8 }}>
                      {toRomajiParts(selected.kun_yomi)}
                    </p>
                  )}
                </div>

                {/* Examples */}
                {(selected.example_word1 || selected.example_word2) && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Examples</p>
                    <div className="flex flex-wrap gap-4">
                      {[selected.example_word1, selected.example_word2].filter(Boolean).map((ex, i) => {
                        // Format: "先生 (せんせい)" → parse out the parts
                        const match = ex.match(/^(.+?)\s*\((.+?)\)$/);
                        const word    = match ? match[1] : ex;
                        const reading = match ? match[2] : '';
                        return (
                          <div key={i} className="flex flex-col">
                            <span className="font-japanese text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                              {word}
                            </span>
                            {reading && (
                              <>
                                <span className="font-japanese text-xs" style={{ color: 'var(--text-3)' }}>
                                  {reading}
                                </span>
                                {showEnglish && (
                                  <span className="font-mono text-xs" style={{ color: 'var(--pink)', opacity: 0.7 }}>
                                    {toRomajiParts(reading)}
                                  </span>
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
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--text-3)' }}
                >
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
