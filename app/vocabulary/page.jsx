'use client';

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import AudioButton from '@/components/AudioButton';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

const CATEGORIES = [
  'Numbers & Counters', 'Time & Dates', 'People & Family', 'Body Parts',
  'Clothing', 'Food & Drink', 'School & Work', 'Places & Directions',
  'Nature & Animals', 'Greetings & Expressions', 'Colors', 'Things & Objects',
  'Adjectives', 'Verbs', 'Leisure & Sports', 'Other',
];

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selections, setSelections] = useState(new Set());
  const [selCount, setSelCount] = useState(0);
  const { showEnglish, showRomaji } = useSettings();

  const loadVocab = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    setLoading(true);
    fetch(`/api/vocab?${params}`)
      .then((r) => r.json())
      .then((d) => { setVocab(d); setLoading(false); });
  }, [search, category]);

  useEffect(() => { loadVocab(); }, [loadVocab]);

  useEffect(() => {
    fetch('/api/selections?type=vocabulary')
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
      body: JSON.stringify({ content_type: 'vocabulary', content_id: id, selected: !isSelected }),
    });
  }

  async function toggleGroup(words, selectAll) {
    if (!words || words.length === 0) return;
    const ids = words.map((w) => w.id);
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
      body: JSON.stringify({ content_type: 'vocabulary', content_ids: ids, selected: selectAll }),
    });
  }

  const groupedVocab = useMemo(() => {
    const groups = {};
    const filtered = selectedOnly ? vocab.filter((w) => selections.has(w.id)) : vocab;
    for (const w of filtered) {
      const cat = w.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    }
    const found = Object.keys(groups);
    const ordered = [...CATEGORIES, 'Uncategorized'].filter((c) => found.includes(c));
    const extra = found.filter((c) => !ordered.includes(c));
    return [...ordered, ...extra].map((c) => ({ name: c, words: groups[c] }));
  }, [vocab, selectedOnly, selections]);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Vocabulary</h1>
      <p style={{ marginTop: 0 }}>
        {vocab.length} N5 words{selCount > 0 && ` · ${selCount} selected for review`}.
        <br />
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          Tick words to add them to review, or tap a word for its example.
        </span>
      </p>
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search words…"
          aria-label="Search vocabulary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" style={{ maxWidth: '11rem' }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="toolbar-actions">
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
          href={`/quiz?type=vocabulary${selCount > 0 ? '&selected_only=true' : ''}`}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          Quiz{selCount > 0 ? ' selected' : ''}
        </Link>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : vocab.length === 0 ? (
        <p className="muted">No results.</p>
      ) : (
        groupedVocab.map((group) => {
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
                  {group.words.map((word) => {
                    const isSel = selections.has(word.id);
                    const isExp = expanded === word.id;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const due = word.next_review_date && word.next_review_date <= todayStr;
                    let dueLabel = null;
                    if (word.next_review_date) {
                      const diffDays = Math.round((new Date(word.next_review_date) - new Date(todayStr)) / 86400000);
                      if (diffDays > 1) dueLabel = `${diffDays}d`;
                      else if (diffDays === 1) dueLabel = 'tmrw';
                    }
                    return (
                      <Fragment key={word.id}>
                        <tr>
                          <td style={{ whiteSpace: 'nowrap', width: '2.8rem', padding: '0.85rem 0', verticalAlign: 'top' }}>
                            <button className="tick" aria-pressed={isSel} onClick={() => toggleSelection(word.id)} title={isSel ? 'Remove from review' : 'Add to review'}>
                              {isSel ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ padding: '0.85rem 0' }}>
                            <div>
                              <Link href="#" onClick={(e) => { e.preventDefault(); setExpanded(isExp ? null : word.id); }} style={{ textDecoration: 'none' }}>
                                <span className="jp-display" style={{ fontSize: '1.35rem' }}>{word.japanese}</span>
                              </Link>
                              <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>{word.reading}{showRomaji ? ` · ${toRomaji(word.reading)}` : ''}</div>
                            </div>
                            <div style={{ fontSize: '1.02rem', marginTop: '0.35rem' }}>{word.english}</div>
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
                        {isExp && (
                          <tr>
                            <td />
                            <td colSpan={2}>
                              <span className="muted" style={{ fontSize: '0.85rem' }}>
                                {word.example_jp || 'No example yet.'}
                                {word.example_jp && showEnglish && word.example_en ? ` — ${word.example_en}` : ''}
                              </span>{' '}
                              <AudioButton text={word.japanese} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })
      )}
    </div>
  );
}
