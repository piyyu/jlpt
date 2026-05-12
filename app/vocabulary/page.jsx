'use client';

import { useEffect, useState, useCallback, Fragment, useMemo } from 'react';
import AudioButton from '@/components/AudioButton';
import { Search, ChevronDown, ChevronUp, CheckSquare, Square, X } from 'lucide-react';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

const CATEGORIES = [
  'Numbers & Counters',
  'Time & Dates',
  'People & Family',
  'Body Parts',
  'Clothing',
  'Food & Drink',
  'School & Work',
  'Places & Directions',
  'Nature & Animals',
  'Greetings & Expressions',
  'Colors',
  'Things & Objects',
  'Adjectives',
  'Verbs',
  'Leisure & Sports',
  'Other'
];

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selections, setSelections] = useState(new Set()); // Set of selected IDs
  const [selCount, setSelCount] = useState(0);
  const [toggling, setToggling] = useState(null); // ID being toggled right now
  const { showEnglish } = useSettings();


  // Load vocab + current selections
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

  // Load selection state once on mount
  useEffect(() => {
    fetch('/api/selections?type=vocabulary')
      .then((r) => r.json())
      .then((ids) => {
        setSelections(new Set(ids));
        setSelCount(ids.length);
      });
  }, []);

  async function toggleSelection(id, e) {
    e.stopPropagation();
    if (toggling) return;
    setToggling(id);
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
    setToggling(null);
  }

  async function clearAll() {
    await fetch('/api/selections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'vocabulary' }),
    });
    setSelections(new Set());
    setSelCount(0);
    setSelectedOnly(false);
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

  // Pre-calculate groups
  const groupedVocab = useMemo(() => {
    const groups = {};
    const filteredVocab = selectedOnly ? vocab.filter(w => selections.has(w.id)) : vocab;

    for (const w of filteredVocab) {
      const cat = w.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(w);
    }
    // Get all unique categories from the data, but keep our preferred order if possible
    const foundCats = Object.keys(groups);
    const orderedCats = [...CATEGORIES, 'Other', 'Uncategorized'].filter(c => foundCats.includes(c));
    const extraCats = foundCats.filter(c => !orderedCats.includes(c));

    return [...orderedCats, ...extraCats].map(c => ({
      name: c,
      words: groups[c]
    }));
  }, [vocab, selectedOnly, selections]);

  // Flattened list of words currently shown (to calculate global index)
  const displayedWords = useMemo(() => {
    return groupedVocab.flatMap(g => g.words);
  }, [groupedVocab]);

  const categoryBadgeColor = {
    'Numbers & Counters': { background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' },
    'Time & Dates': { background: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' },
    'People & Family': { background: 'rgba(236,72,153,0.12)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)' },
    'Food & Drink': { background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' },
    'School & Work': { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' },
    'Places & Directions': { background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' },
    'Body Parts': { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
    'Clothing': { background: 'rgba(14,165,233,0.12)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.25)' },
    'Nature & Animals': { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' },
    'Greetings & Expressions': { background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' },
    'Colors': { background: 'rgba(252,165,165,0.12)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.25)' },
    'Things & Objects': { background: 'rgba(107,114,128,0.12)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.25)' },
    'Verbs': { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' },
    'Adjectives': { background: 'rgba(196,181,253,0.12)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.25)' },
  };

  return (
    <div>
      <div className="mb-6">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>単語リスト</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Vocabulary</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          {selectedOnly ? `Selected Vocabulary — ${displayedWords.length} words` : `N5 vocabulary — ${vocab.length} words found`}
          {selCount > 0 && !selectedOnly && (
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,0,128,0.12)', color: 'var(--pink)', border: '1px solid rgba(255,0,128,0.3)' }}>
              {selCount} selected for review
            </span>
          )}
        </p>
      </div>

      {/* Filters + selection controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search japanese, reading, or english…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg focus:outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setSelectedOnly(!selectedOnly)}
          disabled={selCount === 0 && !selectedOnly}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${selCount === 0 && !selectedOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: selectedOnly ? 'var(--pink)' : 'var(--bg-surface)',
            border: `1px solid ${selectedOnly ? 'var(--pink)' : 'var(--border)'}`,
            color: selectedOnly ? '#fff' : 'var(--text-1)'
          }}
        >
          {selectedOnly ? 'Showing Selected' : `Show Selected Only (${selCount})`}
        </button>

        <div className="flex gap-2">
          {selCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: 'rgba(255,0,128,0.08)', border: '1px solid rgba(255,0,128,0.3)', color: 'var(--pink)' }}
            >
              <X size={13} /> Clear {selCount}
            </button>
          )}
          <a
            href={`/quiz?type=vocabulary${selCount > 0 ? '&selected_only=true' : ''}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium"
            style={{ background: 'var(--text-1)', color: 'var(--bg-base)' }}
          >
            {selCount > 0 ? 'Quiz Selected' : 'Quiz All'}
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
        ) : vocab.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'var(--text-3)' }}>No results found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th style={{ width: '28px' }}></th>
                <th>Japanese</th>
                <th>Reading</th>
                <th>Romaji</th>
                <th>English</th>
                <th>Category</th>
                <th className="text-right">Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groupedVocab.map((group) => {
                const isGroupSelected = group.words.length > 0 && group.words.every(w => selections.has(w.id));
                return (
                  <Fragment key={group.name}>
                    <tr>
                      <td colSpan={9} className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] relative">
                        <div className="flex items-center gap-4">
                          <span
                            style={categoryBadgeColor[group.name] || { background: 'var(--bg-elevated)', color: 'var(--text-3)' }}
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                          >
                            {group.name}
                          </span>
                          <span className="text-xs text-[var(--text-3)]">{group.words.length} items</span>

                          <button
                            onClick={(e) => { e.stopPropagation(); toggleGroup(group.words, !isGroupSelected); }}
                            className="ml-auto text-xs px-3 py-1.5 flex items-center gap-2 rounded transition-colors"
                            style={{
                              background: isGroupSelected ? 'var(--pink)' : 'transparent',
                              color: isGroupSelected ? '#fff' : 'var(--text-1)',
                              border: isGroupSelected ? '1px solid var(--pink)' : '1px solid var(--border)'
                            }}
                          >
                            {isGroupSelected ? 'Deselect Group' : 'Select Group'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {group.words.map((word) => {
                      const displayedIndex = displayedWords.findIndex(v => v.id === word.id);
                      const isSel = selections.has(word.id);
                      const isExp = expanded === word.id;
                      return (
                        <Fragment key={word.id}>
                    <tr
                      className="cursor-pointer"
                      onClick={() => setExpanded(isExp ? null : word.id)}
                      style={isSel ? { background: 'rgba(255,0,128,0.04)' } : {}}
                    >
                      {/* Row number */}
                      <td>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{displayedIndex + 1}</span>
                      </td>

                      {/* Checkbox */}
                      <td onClick={(e) => toggleSelection(word.id, e)}>
                        <button
                          className="flex items-center justify-center w-5 h-5 rounded transition-all"
                          style={{ color: isSel ? 'var(--pink)' : 'var(--text-3)' }}
                          title={isSel ? 'Remove from review' : 'Add to review'}
                        >
                          {isSel
                            ? <CheckSquare size={15} style={{ color: 'var(--pink)' }} />
                            : <Square size={15} style={{ opacity: 0.4 }} />}
                        </button>
                      </td>

                      {/* Japanese */}
                      <td>
                        <span className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                          {word.japanese}
                        </span>
                      </td>

                      {/* Reading */}
                      <td>
                        <span className="font-japanese text-sm" style={{ color: 'var(--text-2)' }}>
                          {word.reading}
                        </span>
                      </td>

                      {/* Romaji */}
                      {/* Romaji */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: 'var(--pink)', opacity: 0.8 }}>
                            {toRomaji(word.reading)}
                          </span>
                          <AudioButton text={word.japanese} />
                        </div>
                      </td>

                      {/* English */}
                      <td style={{ color: 'var(--text-2)' }}>{word.english}</td>

                      {/* Category badge */}
                      <td>
                        <span
                          className="badge"
                          style={categoryBadgeColor[word.category] || { background: 'var(--bg-elevated)', color: 'var(--text-3)' }}
                        >
                          {word.category}
                        </span>
                      </td>

                      {/* Due info */}
                      <td className="text-right">
                        {word.next_review_date ? (() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const nextReview = new Date(word.next_review_date);
                          const diffTime = nextReview - today;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          if (diffDays <= 0) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400">Due</span>;
                          if (diffDays === 1) return <span className="text-[10px] font-medium text-[var(--text-3)]">Tmrw</span>;
                          return <span className="text-[10px] text-[var(--text-3)] opacity-70">{diffDays}d</span>;
                        })() : <span className="text-[10px] text-[var(--text-3)] opacity-40">-</span>}
                      </td>

                      {/* Expand chevron */}
                      <td className="text-right pl-2">
                        {isExp
                          ? <ChevronUp size={14} style={{ color: 'var(--text-3)' }} />
                          : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
                      </td>
                    </tr>

                    {/* Expanded example */}
                    {isExp && (
                      <tr key={`${word.id}-detail`}>
                        <td colSpan={9} className="px-4 py-4" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="flex items-start gap-6">
                            <div className="flex-1 space-y-2">
                              {word.example_jp ? (
                                <>
                                  <p className="font-japanese text-sm" style={{ color: 'var(--text-1)' }}>
                                    {word.example_jp}
                                  </p>
                                  {showEnglish && (
                                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>
                                      {toRomaji(word.example_jp)}
                                    </p>
                                  )}
                                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                                    {word.example_en}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>No example sentence available yet.</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <AudioButton text={word.japanese} />
                              {word.example_jp && <AudioButton text={word.example_jp} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}
      </tbody>
    </table>
        )}
      </div>
    </div>
  );
}
