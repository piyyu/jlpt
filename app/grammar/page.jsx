'use client';

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import AudioButton from '@/components/AudioButton';
import GrammarExamples from '@/components/GrammarExamples';
import { useSettings } from '@/lib/useSettings';

const CATEGORIES = [
  'Particles', 'Basics', 'Adjectives', 'Verbs', 'Expressions',
];

export default function GrammarPage() {
  const [points, setPoints] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selections, setSelections] = useState(new Set());
  const [selCount, setSelCount] = useState(0);
  const { showRomaji } = useSettings();

  const loadPoints = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    setLoading(true);
    fetch(`/api/grammar?${params}`)
      .then((r) => r.json())
      .then((d) => { setPoints(d); setLoading(false); });
  }, [search, category]);

  useEffect(() => { loadPoints(); }, [loadPoints]);

  useEffect(() => {
    fetch('/api/selections?type=grammar')
      .then((r) => r.json())
      .then((ids) => {
        setSelections(new Set(ids));
        setSelCount(ids.length);
      });
  }, []);

  async function toggleSelection(id) {
    const isSelected = selections.has(id);
    const next = new Set(selections);
    if (isSelected) next.delete(id); else next.add(id);
    setSelections(next);
    setSelCount(next.size);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'grammar', content_id: id, selected: !isSelected }),
    });
  }

  async function toggleGroup(items, selectAll) {
    if (!items || items.length === 0) return;
    const ids = items.map((w) => w.id);
    const next = new Set(selections);
    for (const id of ids) {
      if (selectAll) next.add(id);
      else next.delete(id);
    }
    setSelections(next);
    setSelCount(next.size);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'grammar', content_ids: ids, selected: selectAll }),
    });
  }

  const grouped = useMemo(() => {
    const groups = {};
    const filtered = selectedOnly ? points.filter((w) => selections.has(w.id)) : points;
    for (const w of filtered) {
      const cat = w.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    }
    const found = Object.keys(groups);
    const ordered = [...CATEGORIES, 'Other', 'Uncategorized'].filter((c) => found.includes(c));
    const extra = found.filter((c) => !ordered.includes(c));
    return [...ordered, ...extra].map((c) => ({ name: c, words: groups[c] }));
  }, [points, selectedOnly, selections]);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Grammar</h1>
      <p style={{ marginTop: 0 }}>
        {points.length} N5 patterns{selCount > 0 && ` · ${selCount} selected for review`}.
        <br />
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          Learn each pattern in a textbook first (Tae Kim links inside) — then drill it here so it sticks.
        </span>
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          type="text"
          placeholder="Search patterns…"
          aria-label="Search grammar patterns"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" style={{ maxWidth: '11rem' }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <button
          className="btn"
          aria-pressed={selectedOnly}
          onClick={() => setSelectedOnly((v) => !v)}
          style={selectedOnly
            ? { borderColor: 'var(--accent)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
            : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          {selectedOnly ? `✓ Selected (${selCount})` : `Selected (${selCount})`}
        </button>
        <Link
          className="btn"
          href={`/quiz?type=grammar${selCount > 0 ? '&selected_only=true' : ''}`}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          Quiz{selCount > 0 ? ' selected' : ''}
        </Link>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : points.length === 0 ? (
        <p className="muted">No results.</p>
      ) : (
        grouped.map((group) => {
          const allSel = group.words.length > 0 && group.words.every((w) => selections.has(w.id));
          return (
            <section key={group.name} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <h2 className="section-head" style={{ margin: 0 }}>
                  {group.name} ({group.words.length})
                </h2>
                <Link
                  href="#"
                  onClick={(e) => { e.preventDefault(); toggleGroup(group.words, !allSel); }}
                  style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {allSel ? 'deselect group' : 'select group'}
                </Link>
              </div>
              <table>
                <tbody>
                  {group.words.map((item) => {
                    const isSel = selections.has(item.id);
                    const todayStr = new Date().toISOString().split('T')[0];
                    const due = item.next_review_date && item.next_review_date <= todayStr;
                    let dueLabel = null;
                    if (item.next_review_date) {
                      const diffDays = Math.round((new Date(item.next_review_date) - new Date(todayStr)) / 86400000);
                      if (diffDays > 1) dueLabel = `${diffDays}d`;
                      else if (diffDays === 1) dueLabel = 'tmrw';
                    }
                    return (
                      <Fragment key={item.id}>
                        <tr onClick={() => setModalItem(item)} style={{ cursor: 'pointer' }}>
                          <td style={{ whiteSpace: 'nowrap', width: '2.8rem', padding: '0.85rem 0', verticalAlign: 'top' }}>
                            <button className="tick" aria-pressed={isSel} onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }} title={isSel ? 'Remove from review' : 'Add to review'}>
                              {isSel ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ padding: '0.85rem 0' }}>
                            <div>
                              <Link href="#" onClick={(e) => { e.preventDefault(); setModalItem(item); }} style={{ textDecoration: 'none' }}>
                                <span className="font-japanese" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{item.pattern}</span>
                              </Link>
                              {item.structure && (
                                <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>{item.structure}</div>
                              )}
                            </div>
                            <div style={{ fontSize: '1.02rem', marginTop: '0.35rem' }}>{item.meaning}</div>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap', width: '4rem' }}>
                            {due ? (
                              <span className="due-pill">due</span>
                            ) : dueLabel ? (
                              <span className="muted" style={{ fontSize: '0.8rem' }}>{dueLabel}</span>
                            ) : (
                              <span className="muted" style={{ fontSize: '0.8rem', opacity: 0.5 }}>—</span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })
      )}
      {modalItem && (
        <GrammarModal
          item={modalItem}
          isSel={selections.has(modalItem.id)}
          showRomaji={showRomaji}
          onToggle={() => toggleSelection(modalItem.id)}
          onClose={() => setModalItem(null)}
        />
      )}
    </div>
  );
}

function GrammarModal({ item, isSel, showRomaji, onToggle, onClose }) {
  // Lock background scroll + close on Escape while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.pattern}
      onClick={onClose}
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card"
        style={{
          background: 'var(--panel)',
          color: 'inherit',
          borderRadius: '12px',
          maxWidth: '34rem',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '1.5rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p className="font-japanese" style={{ fontSize: '2rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              {item.pattern}
            </p>
            {item.structure && (
              <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{item.structure}</p>
            )}
          </div>
          <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p style={{ fontSize: '1.05rem', margin: '0.75rem 0 0' }}>{item.meaning}</p>
        {item.example_jp && (
          <div style={{ marginTop: '0.75rem' }}>
            <p className="font-japanese" style={{ margin: 0 }}>{item.example_jp}</p>
            <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.85rem' }}>
              {item.example_en}
              {showRomaji && item.example_romaji ? ` · ${item.example_romaji}` : ''}
            </p>
            <p style={{ margin: '0.35rem 0 0' }}><AudioButton text={item.example_jp} /></p>
          </div>
        )}
        <GrammarExamples grammarId={item.id} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-solid" onClick={onToggle}>
            {isSel ? '✓ Selected — remove' : '+ Add to review'}
          </button>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem' }}>
              Read explanation →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
