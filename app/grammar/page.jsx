'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AudioButton from '@/components/AudioButton';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

export default function GrammarPage() {
  const [grammar, setGrammar] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showEnglish } = useSettings();

  useEffect(() => {
    fetch('/api/grammar')
      .then((r) => r.json())
      .then((d) => { setGrammar(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>文法ポイント</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Grammar</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          N5 grammar patterns — {grammar.length} points
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
      ) : (
        <div className="space-y-3">
          {grammar.map((g, i) => (
            <div key={g.id} className="card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-all"
                style={{ background: expanded === g.id ? 'rgba(255,0,128,0.04)' : 'transparent' }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-xs w-5 shrink-0 mt-1 font-mono" style={{ color: 'var(--text-3)' }}>
                    {i + 1}
                  </span>
                  <div>
                    {/* Pattern */}
                    <p className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                      {g.pattern}
                    </p>
                    {/* Romaji of the pattern */}
                    {showEnglish && (
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>
                        {toRomaji(g.pattern)}
                      </p>
                    )}
                    {/* English meaning */}
                    <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{g.meaning}</p>
                  </div>
                </div>
                {expanded === g.id
                  ? <ChevronUp size={16} className="shrink-0" style={{ color: 'var(--text-3)' }} />
                  : <ChevronDown size={16} className="shrink-0" style={{ color: 'var(--text-3)' }} />}
              </button>

              {/* Expanded examples */}
              {expanded === g.id && (
                <div
                  className="px-5 py-4 space-y-5"
                  style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                >
                  {[
                    { jp: g.example1_jp, en: g.example1_en },
                    { jp: g.example2_jp, en: g.example2_en },
                    { jp: g.example3_jp, en: g.example3_en },
                  ].filter((ex) => ex.jp).map((ex, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span
                        className="text-xs shrink-0 mt-1 font-mono"
                        style={{ color: 'var(--pink)', minWidth: '1.25rem' }}
                      >
                        {idx + 1}.
                      </span>
                      <div className="flex-1">
                        {/* Japanese sentence */}
                        <p className="font-japanese text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                          {ex.jp}
                        </p>
                        {/* Romaji */}
                        {showEnglish && (
                          <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.65 }}>
                            {toRomaji(ex.jp)}
                          </p>
                        )}
                        {/* English translation */}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                          {ex.en}
                        </p>
                        <div className="mt-1.5">
                          <AudioButton text={ex.jp} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
