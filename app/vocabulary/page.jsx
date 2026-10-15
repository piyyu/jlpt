'use client';

import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import AudioButton from '@/components/AudioButton';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';
import { todayLocal } from '@/lib/date';

const CATEGORIES = [
  'Numbers & Counters', 'Time & Dates', 'People & Family', 'Body Parts',
  'Clothing', 'Food & Drink', 'School & Work', 'Places & Directions',
  'Nature & Animals', 'Greetings & Expressions', 'Colors', 'Things & Objects',
  'Adjectives', 'Verbs', 'Leisure & Sports', 'Other',
];

function dueInfo(word, todayStr) {
  const due = word.next_review_date && word.next_review_date <= todayStr;
  let dueLabel = null;
  if (word.next_review_date) {
    const diffDays = Math.round((new Date(word.next_review_date) - new Date(todayStr)) / 86400000);
    if (diffDays > 1) dueLabel = `${diffDays}d`;
    else if (diffDays === 1) dueLabel = 'tmrw';
  }
  return { due, dueLabel };
}

function WordRow({ word, isSel, isExp, todayStr, showRomaji, showEnglish, onToggle, onExpand }) {
  const { due, dueLabel } = dueInfo(word, todayStr);
  return (
    <Fragment>
      <tr>
        <td style={{ whiteSpace: 'nowrap', width: '2.8rem', padding: '0.85rem 0', verticalAlign: 'top' }}>
          <button className="tick" aria-pressed={isSel} onClick={() => onToggle(word.id)} title={isSel ? 'Remove from review' : 'Add to review'}>
            {isSel ? '✓' : '+'}
          </button>
        </td>
        <td style={{ padding: '0.85rem 0' }}>
          <div>
            <Link href="#" onClick={(e) => { e.preventDefault(); onExpand(word.id); }} style={{ textDecoration: 'none' }}>
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
}

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selections, setSelections] = useState(new Set());
  const [selCount, setSelCount] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addOk, setAddOk] = useState('');
  const [form, setForm] = useState({
    japanese: '', reading: '', english: '', category: '',
    example_jp: '', example_en: '', toReview: true,
  });
  const { showEnglish, showRomaji } = useSettings();

  const todayStr = todayLocal();

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

  function confirmUnmark(words) {
    const withProgress = words.filter((w) => selections.has(w.id) && (w.repetitions || 0) > 0);
    if (withProgress.length === 0) return true;
    const noun = withProgress.length === 1 ? '1 word has' : `${withProgress.length} words have`;
    return window.confirm(
      `${noun} review progress. Removing ${withProgress.length === 1 ? 'it' : 'them'} deletes ${withProgress.length === 1 ? 'its' : 'their'} review history. Continue?`
    );
  }

  async function toggleSelection(id) {
    const isSelected = selections.has(id);
    if (isSelected) {
      const word = vocab.find((w) => w.id === id);
      if (word && !confirmUnmark([word])) return;
    }
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
    if (!selectAll && !confirmUnmark(words)) return;
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

  function setF(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setAddError('');
    setAddOk('');
    setShowAdd((v) => !v);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    setAddOk('');
    const res = await fetch('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        japanese: form.japanese,
        reading: form.reading,
        english: form.english,
        category: form.category,
        example_jp: form.example_jp, example_en: form.example_en,
        selected: form.toReview,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setAdding(false);
    if (!res.ok) {
      setAddError(d.error || 'Could not add word.');
      return;
    }
    if (d.selected) {
      setSelections((s) => new Set(s).add(d.id));
      setSelCount((n) => n + 1);
    }
    setForm({
      japanese: '', reading: '', english: '', category: '',
      example_jp: '', example_en: '', toReview: true,
    });
    setAddOk('Added ✓ — use search above to find it.');
    loadVocab();
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

  function renderTable(words) {
    return (
      <table>
        <tbody>
          {words.map((word) => (
            <WordRow
              key={word.id}
              word={word}
              isSel={selections.has(word.id)}
              isExp={expanded === word.id}
              todayStr={todayStr}
              showRomaji={showRomaji}
              showEnglish={showEnglish}
              onToggle={toggleSelection}
              onExpand={(id) => setExpanded(expanded === id ? null : id)}
            />
          ))}
        </tbody>
      </table>
    );
  }

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
        <button
          className="btn"
          aria-pressed={showAdd}
          aria-expanded={showAdd}
          onClick={openAdd}
          style={showAdd
            ? { borderColor: 'var(--accent)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
            : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          {showAdd ? '✓ Add word' : '＋ Add word'}
        </button>
      </div>

      {showAdd && (
        <section className="settings-card" aria-label="Add a word" style={{ marginBottom: '1.5rem' }}>
          <h2>Add a word</h2>
          <form onSubmit={submitAdd} style={{ display: 'grid', gap: '0.6rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem', minWidth: 0 }}>
                Japanese *
                <input value={form.japanese} onChange={(e) => setF('japanese', e.target.value)} required placeholder="たべもの" style={{ minWidth: 0 }} />
              </label>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem', minWidth: 0 }}>
                Reading *
                <input value={form.reading} onChange={(e) => setF('reading', e.target.value)} required placeholder="たべもの" style={{ minWidth: 0 }} />
              </label>
            </div>
            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              English *
              <input value={form.english} onChange={(e) => setF('english', e.target.value)} required placeholder="food" />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              Category
              <select value={form.category} onChange={(e) => setF('category', e.target.value)}>
                <option value="">Other (default)</option>
                {CATEGORIES.filter((c) => c !== 'Other').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              Example — Japanese (optional)
              <input value={form.example_jp} onChange={(e) => setF('example_jp', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              Example — English (optional)
              <input value={form.example_en} onChange={(e) => setF('example_en', e.target.value)} />
            </label>
            <label className="muted" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.toReview} onChange={(e) => setF('toReview', e.target.checked)} />
              Add to review (due today)
            </label>
            {addError && <p style={{ color: 'var(--red-dark)', fontSize: '0.85rem', margin: 0 }}>{addError}</p>}
            {addOk && <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>{addOk}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-solid" disabled={adding} style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}>
                {adding ? 'Adding…' : 'Add word'}
              </button>
              <button type="button" className="btn" onClick={() => setShowAdd(false)} style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}>
                Close
              </button>
            </div>
          </form>
        </section>
      )}

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
              {renderTable(group.words)}
            </section>
          );
        })
      )}
    </div>
  );
}
