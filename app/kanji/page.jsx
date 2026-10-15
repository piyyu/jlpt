'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AudioButton from '@/components/AudioButton';
import StrokeOrder from '@/components/StrokeOrder';
import { toRomajiParts } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

function firstReading(k) {
  return ((k.kun_yomi || k.on_yomi || '').split(/[・/]/)[0] || '').trim();
}

export default function KanjiPage() {
  const [kanji, setKanji] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState(new Set());
  const [selCount, setSelCount] = useState(0);
  const { showEnglish, showRomaji } = useSettings();

  useEffect(() => {
    fetch('/api/kanji')
      .then((r) => r.json())
      .then((d) => { setKanji(d); setLoading(false); });
    fetch('/api/selections?type=kanji')
      .then((r) => r.json())
      .then((ids) => { setSelections(new Set(ids)); setSelCount(ids.length); });
  }, []);

  // Modal ergonomics: Escape closes, background stays put while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function toggleSelection(id) {
    const isSel = selections.has(id);
    const next = new Set(selections);
    if (isSel) next.delete(id); else next.add(id);
    setSelections(next);
    setSelCount(next.size);
    if (open && open.id === id) setOpen({ ...open });
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'kanji', content_id: id, selected: !isSel }),
    });
  }

  async function selectAll() {
    const ids = kanji.map((k) => k.id);
    if (ids.length === 0) return;
    setSelections(new Set(ids));
    setSelCount(ids.length);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'kanji', content_ids: ids, selected: true }),
    });
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
      <h1 className="page-title">Kanji</h1>
      <p style={{ marginTop: 0 }}>
        {kanji.length} N5 characters{selCount > 0 && ` · ${selCount} in your deck`}.
        <br />
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          Tick characters to add them to review, or tap a tile for details.
        </span>
      </p>
      <div className="toolbar-actions">
        <button
          className="btn"
          onClick={selectAll}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          Select all
        </button>
        {selCount > 0 && (
          <button
            className="btn"
            onClick={clearAll}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
          >
            Clear ({selCount})
          </button>
        )}
        <Link
          className="btn"
          href={`/quiz?type=kanji${selCount > 0 ? '&selected_only=true' : ''}`}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          Quiz{selCount > 0 ? ' selected' : ''} →
        </Link>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.6rem' }}>
          {kanji.map((k) => {
            const isSel = selections.has(k.id);
            const isOpen = open?.id === k.id;
            return (
              <div key={k.id} style={{ position: 'relative' }}>
                <button
                  className="tick"
                  aria-pressed={isSel}
                  onClick={() => toggleSelection(k.id)}
                  title={isSel ? 'Remove from review' : 'Add to review'}
                  style={{ position: 'absolute', top: 6, left: 6, zIndex: 1, width: '1.5rem', height: '1.5rem', fontSize: '0.85rem' }}
                >
                  {isSel ? '✓' : '+'}
                </button>
                <button
                  onClick={() => setOpen(isOpen ? null : k)}
                  aria-pressed={isOpen}
                  className={`kanji-tile${isSel ? ' selected' : ''}${isOpen ? ' open' : ''}`}
                  style={{ width: '100%' }}
                >
                <span className="jp-display" style={{ display: 'block', fontSize: '2rem', lineHeight: 1.2 }}>{k.character}</span>
                <span className="muted font-japanese" style={{ display: 'block', fontSize: '0.68rem', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {firstReading(k)}
                </span>
                <span className="muted" style={{ display: 'block', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {k.meaning.split('/')[0].trim()}
                </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.character}
          onClick={() => setOpen(null)}
          className="modal-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
        <section
          onClick={(e) => e.stopPropagation()}
          className="modal-card"
          style={{ border: '2px solid var(--border)', borderRadius: 12, borderTop: '4px solid var(--orange)', background: 'var(--panel)', padding: '1.25rem 1.5rem', width: 'min(36rem, calc(100vw - 2rem))', height: 'min(78vh, 620px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p className="jp-display" style={{ fontSize: '4.5rem', lineHeight: 1.15, margin: 0 }}>{open.character}</p>
              <p className="muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{open.stroke_count ?? '—'} strokes</p>
              <p style={{ margin: '0.6rem 0 0' }}>
                <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => toggleSelection(open.id)}>
                  {selections.has(open.id) ? '✓ in deck — remove' : '+ add to deck'}
                </button>
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '1.15rem' }}><strong>{open.meaning}</strong></p>
              <p style={{ margin: '0 0 0.25rem' }}>
                <span className="muted" style={{ fontSize: '0.8rem' }}>On: </span>
                <span className="font-japanese">{open.on_yomi || '—'}</span>
                    {showRomaji && open.on_yomi && <span className="muted" style={{ fontSize: '0.8rem' }}> ({toRomajiParts(open.on_yomi)})</span>}
              </p>
              <p style={{ margin: '0 0 0.25rem' }}>
                <span className="muted" style={{ fontSize: '0.8rem' }}>Kun: </span>
                <span className="font-japanese">{open.kun_yomi || '—'}</span>
                    {showRomaji && open.kun_yomi && <span className="muted" style={{ fontSize: '0.8rem' }}> ({toRomajiParts(open.kun_yomi)})</span>}
              </p>
              {[open.example_word1, open.example_word2].filter(Boolean).length > 0 && (
                <p className="muted font-japanese" style={{ fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                  {[open.example_word1, open.example_word2].filter(Boolean).join(' · ')}
                </p>
              )}
              <div style={{ marginTop: '0.75rem' }}>
                <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 0.35rem' }}>Stroke order</p>
                <StrokeOrder key={open.character} char={open.character} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
              <Link href="#" onClick={(e) => { e.preventDefault(); setOpen(null); }}>close ✕</Link>
              <AudioButton text={open.character} />
            </div>
          </div>
        </section>
        </div>
      )}
    </div>
  );
}
