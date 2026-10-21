'use client';

import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
import Link from 'next/link';
import AudioButton from '@/components/AudioButton';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';
import { todayLocal } from '@/lib/date';

const LESSON_NUMBERS = Array.from({ length: 25 }, (_, i) => i + 1);
const ADDED = 'added';

// One row of mutually exclusive chips replaces the old Level + Study chips.
// "core" and "n4" pick a study priority, "all" shows every row. Words added
// by hand have no study value at all and are always visible.
const SCOPES = [
  { key: 'core', label: 'Core (N5)', study: 'Now' },
  { key: 'n4', label: 'N4', study: 'Later (N4)' },
  { key: 'all', label: 'Everything', study: null },
];
const DEFAULT_SCOPE = 'core';

const LESSONS_STORAGE_KEY = 'jlpt.vocab.lessons';
const SCOPE_STORAGE_KEY = 'jlpt.vocab.scope';

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
            <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>{word.reading}{showRomaji ? ` · ${word.romaji || toRomaji(word.reading)}` : ''}</div>
          </div>
          <div style={{ fontSize: '1.02rem', marginTop: '0.35rem' }}>{word.meaning}</div>
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

function lessonKey(word) {
  return word.lesson == null ? ADDED : String(word.lesson);
}

function lessonLabel(key) {
  return key === ADDED ? 'Added words' : `Lesson ${key}`;
}

// Lesson numbers first (in order), the added-words bucket last.
function compareLessonKeys(a, b) {
  if (a === b) return 0;
  if (a === ADDED) return 1;
  if (b === ADDED) return -1;
  return Number(a) - Number(b);
}

function serializeLessons(set) {
  return [...set].sort(compareLessonKeys).join(',');
}

function parseLessons(raw) {
  if (!raw) return null;
  const keys = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s === ADDED || /^[0-9]{1,2}$/.test(s))
    .filter((s) => s === ADDED || (Number(s) >= 1 && Number(s) <= 25));
  return new Set(keys);
}

// "Lessons: all" / "Lessons: 1, 2, 3" / "Lessons: 4 selected"
function formatLessonSelection(selected) {
  if (selected.size === 0) return 'all';
  const keys = [...selected].sort(compareLessonKeys);
  if (keys.length <= 3) return keys.map((k) => (k === ADDED ? 'Added' : k)).join(', ');
  return `${selected.size} selected`;
}

// Multi-select dropdown: an empty selection means "no filter" (all lessons).
function MultiSelect({ label, options, selected, onToggle, onClear, allLabel, formatSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
      >
        {label}: {formatSelected ? formatSelected(selected) : (selected.size === 0 ? allLabel : `${selected.size} selected`)}
        <span aria-hidden="true"> ▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '0.4rem', zIndex: 40,
          background: 'var(--panel)', border: '2px solid var(--border)', borderRadius: 12,
          padding: '0.6rem', minWidth: '15rem', maxHeight: '22rem', overflowY: 'auto',
          boxShadow: '0 8px 20px rgba(0,0,0,0.28)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span className="muted" style={{ fontSize: '0.78rem' }}>
              {selected.size === 0 ? allLabel : `${selected.size} selected`}
            </span>
            <button
              type="button"
              onClick={onClear}
              style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
            >
              clear
            </button>
          </div>
          {options.map((opt) => {
            const active = selected.has(opt.key);
            return (
              <label key={opt.key} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.18rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={active} onChange={() => onToggle(opt.key)} />
                <span style={{ flex: 1 }}>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="muted" style={{ fontSize: '0.78rem', opacity: opt.count === 0 ? 0.4 : 1 }}>{opt.count}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// One row of mutually exclusive chips: exactly one scope is active.
function ScopeChips({ options, counts, value, onSelect }) {
  return (
    <div role="group" aria-label="Word scope" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            className="btn"
            aria-pressed={active}
            onClick={() => onSelect(opt.key)}
            style={active
              ? { borderColor: 'var(--accent)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
              : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
          >
            {opt.label}
            {counts[opt.key] !== undefined && (
              <span className="muted" style={{ fontSize: '0.78rem', marginLeft: '0.35rem' }}>{counts[opt.key]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState(DEFAULT_SCOPE);
  const [lessons, setLessons] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selections, setSelections] = useState(new Set());
  const [selCount, setSelCount] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addOk, setAddOk] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({
    japanese: '', reading: '', meaning: '', example_jp: '', example_en: '', toReview: true,
  });
  const { showEnglish, showRomaji } = useSettings();

  const todayStr = todayLocal();

  const loadVocab = useCallback(() => {
    setLoading(true);
    fetch('/api/vocab')
      .then((r) => r.json())
      .then((d) => { setVocab(d); setLoading(false); });
  }, []);

  useEffect(() => { loadVocab(); }, [loadVocab]);

  useEffect(() => {
    fetch('/api/selections?type=vocabulary')
      .then((r) => r.json())
      .then((ids) => {
        setSelections(new Set(ids));
        setSelCount(ids.length);
      });
  }, []);

  // Restore the filters. The URL wins (so a filtered view can be shared or
  // reached with the back button), otherwise the last choice is reused from
  // localStorage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseLessons(params.get('lessons'));
    const stored = parseLessons(window.localStorage.getItem(LESSONS_STORAGE_KEY));
    setLessons(fromUrl || stored || new Set());
    const urlScope = params.get('scope');
    const storedScope = window.localStorage.getItem(SCOPE_STORAGE_KEY);
    const nextScope = SCOPES.some((s) => s.key === urlScope)
      ? urlScope
      : (SCOPES.some((s) => s.key === storedScope) ? storedScope : DEFAULT_SCOPE);
    setScope(nextScope);
    setHydrated(true);
  }, []);

  // Keep the filters in the URL and in localStorage so they survive ticking
  // words, opening an example, and navigating away and back.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LESSONS_STORAGE_KEY, serializeLessons(lessons));
      window.localStorage.setItem(SCOPE_STORAGE_KEY, scope);
    } catch {
      // private mode / storage disabled: the URL still carries the filters
    }
    const params = new URLSearchParams(window.location.search);
    if (lessons.size > 0) params.set('lessons', serializeLessons(lessons));
    else params.delete('lessons');
    if (scope !== DEFAULT_SCOPE) params.set('scope', scope);
    else params.delete('scope');
    const qs = params.toString();
    // Keep the router's own history state intact, only swap the query string.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [hydrated, lessons, scope]);

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
    syncIntervals([id], !isSelected);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'vocabulary', content_id: id, selected: !isSelected }),
    });
  }

  // Marking creates an SM-2 card due today, unmarking removes it. Mirror that
  // locally so the interval label on the right stays correct.
  function syncIntervals(ids, marked) {
    const idSet = new Set(ids);
    setVocab((prev) => prev.map((w) => {
      if (!idSet.has(w.id)) return w;
      if (marked) return { ...w, next_review_date: w.next_review_date || todayStr };
      return { ...w, next_review_date: null, repetitions: 0 };
    }));
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
    syncIntervals(ids, selectAll);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'vocabulary', content_ids: ids, selected: selectAll }),
    });
  }

  function toggleInSet(setter, value) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
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

  function clearFilters() {
    setScope('all');
    setLessons(new Set());
    setSearch('');
  }

  // Clicking a chapter heading narrows the list to that chapter (clicking it
  // again clears the lesson filter).
  function toggleLessonOnly(key) {
    setLessons((prev) => (prev.size === 1 && prev.has(key) ? new Set() : new Set([key])));
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
        meaning: form.meaning,
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
      japanese: '', reading: '', meaning: '', example_jp: '', example_en: '', toReview: true,
    });
    setAddOk('Added ✓ — use search above to find it.');
    loadVocab();
  }

  // Scope chip: pick one study priority, or everything. Words added by hand
  // have no study value and stay visible in every scope.
  const scoped = useMemo(() => {
    const active = SCOPES.find((s) => s.key === scope) || SCOPES[0];
    if (!active.study) return vocab;
    return vocab.filter((w) => !w.study || w.study === active.study);
  }, [vocab, scope]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((w) => {
      const haystack = `${w.japanese} ${w.reading} ${w.romaji || ''} ${w.meaning}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [scoped, search]);

  // The lesson filter narrows the list: only the ticked lessons are shown
  // (the added-words bucket only when it is ticked too).
  const filtered = useMemo(() => {
    if (lessons.size === 0) return searched;
    return searched.filter((w) => lessons.has(lessonKey(w)));
  }, [searched, lessons]);

  // Dropdown counts follow the current scope and search, so the number next
  // to a lesson is the number of words that lesson would contribute.
  const lessonCounts = useMemo(() => {
    const counts = new Map();
    for (const w of searched) {
      const key = lessonKey(w);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [searched]);

  // Lesson totals ignore the scope so a section can show "22 of 46".
  const lessonTotals = useMemo(() => {
    const counts = new Map();
    for (const w of vocab) {
      const key = lessonKey(w);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [vocab]);

  const scopeCounts = useMemo(() => {
    const counts = {};
    for (const s of SCOPES) {
      const study = s.study;
      counts[s.key] = study
        ? vocab.filter((w) => !w.study || w.study === study).length
        : vocab.length;
    }
    return counts;
  }, [vocab]);

  const lessonOptions = useMemo(() => {
    const opts = LESSON_NUMBERS.map((n) => ({
      key: String(n),
      label: `Lesson ${n}`,
      count: lessonCounts.get(String(n)) || 0,
    }));
    opts.push({ key: ADDED, label: 'Added words', count: lessonCounts.get(ADDED) || 0 });
    return opts;
  }, [lessonCounts]);

  const groupedVocab = useMemo(() => {
    const groups = new Map();
    for (const w of filtered) {
      const key = lessonKey(w);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(w);
    }
    const order = [...LESSON_NUMBERS.map(String), ADDED];
    return order.filter((key) => groups.has(key)).map((key) => ({
      key,
      name: lessonLabel(key),
      words: groups.get(key),
    }));
  }, [filtered]);

  const displayed = selectedOnly ? filtered.filter((w) => selections.has(w.id)) : filtered;
  const allFilteredSelected = filtered.length > 0 && filtered.every((w) => selections.has(w.id));
  const filterActive = scope !== 'all' || lessons.size > 0 || search.trim() !== '';

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
        {vocab.length.toLocaleString()} words{selCount > 0 && ` · ${selCount} selected for review`}.
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
        <MultiSelect
          label="Lessons"
          options={lessonOptions}
          selected={lessons}
          onToggle={(key) => toggleInSet(setLessons, key)}
          onClear={() => setLessons(new Set())}
          allLabel="all lessons"
          formatSelected={formatLessonSelection}
        />
      </div>
      <div className="toolbar" style={{ marginBottom: '0.75rem' }}>
        <ScopeChips
          options={SCOPES}
          counts={scopeCounts}
          value={scope}
          onSelect={setScope}
        />
        <span className="muted" style={{ fontSize: '0.82rem', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {filtered.length.toLocaleString()} of {vocab.length.toLocaleString()} shown
        </span>
        {filterActive && (
          <button
            type="button"
            className="btn"
            onClick={clearFilters}
            style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            Show all
          </button>
        )}
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
        <button
          className="btn"
          onClick={() => toggleGroup(filtered, !allFilteredSelected)}
          disabled={filtered.length === 0}
          title={allFilteredSelected ? 'Remove every word in the current filter from review' : 'Mark every word in the current filter (this filter only, nothing hidden)'}
          style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
        >
          {allFilteredSelected ? `✓ Unmark all (${filtered.length})` : `＋ Mark all (${filtered.length})`}
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
              Meaning *
              <input value={form.meaning} onChange={(e) => setF('meaning', e.target.value)} required placeholder="food" />
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
      ) : displayed.length === 0 ? (
        <p className="muted">No results.</p>
      ) : (
        groupedVocab.map((group) => {
          const groupWords = selectedOnly ? group.words.filter((w) => selections.has(w.id)) : group.words;
          if (groupWords.length === 0) return null;
          const allSel = groupWords.length > 0 && groupWords.every((w) => selections.has(w.id));
          const total = lessonTotals.get(group.key) || 0;
          return (
            <section key={group.key} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <h2 className="section-head" style={{ margin: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleLessonOnly(group.key)}
                    title={`Show only ${group.name}`}
                    style={{
                      background: 'none', border: 'none', padding: 0, margin: 0,
                      font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {group.name} · {groupWords.length}{groupWords.length < total ? ` of ${total}` : ''}
                  </button>
                </h2>
                <Link
                  href="#"
                  onClick={(e) => { e.preventDefault(); toggleGroup(groupWords, !allSel); }}
                  style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {allSel ? 'deselect group' : 'select group'}
                </Link>
              </div>
              {renderTable(groupWords)}
            </section>
          );
        })
      )}
    </div>
  );
}
