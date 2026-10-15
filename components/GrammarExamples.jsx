'use client';

import { useEffect, useState } from 'react';

// Lazy-loaded example sentences for one grammar pattern, each with a
// one-line usage note. Used on browse, review, and quiz screens.
export default function GrammarExamples({ grammarId }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || items !== null || !grammarId) return;
    fetch(`/api/grammar/examples?grammar_id=${grammarId}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));
  }, [open, items, grammarId]);

  if (!grammarId) return null;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        className="btn"
        style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Hide examples' : `Examples (${items === null ? '…' : items.length})`}
      </button>
      {open && (
        <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.6rem' }}>
          {items === null ? (
            <p className="muted" style={{ fontSize: '0.85rem' }}>Loading…</p>
          ) : items.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.85rem' }}>No examples yet.</p>
          ) : (
            items.map((ex) => (
              <div key={ex.id} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '0.6rem' }}>
                <p className="font-japanese" style={{ margin: 0 }}>{ex.example_jp}</p>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  {ex.example_en}
                  {ex.explanation ? ` — ${ex.explanation}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
