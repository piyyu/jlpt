'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function GrammarPage() {
  const [grammar, setGrammar] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/grammar')
      .then((r) => r.json())
      .then((d) => { setGrammar(d); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Grammar</h1>
        <p className="text-sm text-zinc-500 mt-1">N5 grammar patterns — {grammar.length} points</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {grammar.map((g, i) => (
            <div key={g.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-xs text-zinc-400 mt-0.5 w-4 shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-japanese text-base font-medium text-zinc-900">{g.pattern}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{g.meaning}</p>
                  </div>
                </div>
                {expanded === g.id ? <ChevronUp size={16} className="text-zinc-400 shrink-0" /> : <ChevronDown size={16} className="text-zinc-400 shrink-0" />}
              </button>

              {expanded === g.id && (
                <div className="border-t border-zinc-100 px-5 py-4 bg-zinc-50 space-y-4">
                  {[
                    { jp: g.example1_jp, en: g.example1_en },
                    { jp: g.example2_jp, en: g.example2_en },
                    { jp: g.example3_jp, en: g.example3_en },
                  ].filter((ex) => ex.jp).map((ex, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-xs text-zinc-400 pt-0.5 w-4 shrink-0">{idx + 1}.</span>
                      <div>
                        <p className="font-japanese text-sm text-zinc-800">{ex.jp}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{ex.en}</p>
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
