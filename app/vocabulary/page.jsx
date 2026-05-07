'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toRomaji } from '@/lib/toRomaji';
import { useSettings } from '@/lib/useSettings';

const TYPES = ['', 'noun', 'verb', 'adjective', 'adverb', 'expression'];

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showEnglish } = useSettings();

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    setLoading(true);
    fetch(`/api/vocab?${params}`)
      .then((r) => r.json())
      .then((d) => { setVocab(d); setLoading(false); });
  }, [search, type]);

  const typeBadge = {
    noun:       'bg-blue-50 text-blue-700',
    verb:       'bg-green-50 text-green-700',
    adjective:  'bg-purple-50 text-purple-700',
    adverb:     'bg-orange-50 text-orange-700',
    expression: 'bg-zinc-100 text-zinc-600',
  };

  return (
    <div>
      <div className="mb-6">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>単語リスト</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Vocabulary</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          N5 vocabulary — {vocab.length} words shown
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search japanese, reading, romaji, or english…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t || 'All types'}</option>
          ))}
        </select>
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
                <th>Japanese</th>
                <th>Reading</th>
                {showEnglish && <th>Romaji</th>}
                <th>English</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vocab.map((word) => (
                <>
                  <tr
                    key={word.id}
                    className="cursor-pointer"
                    onClick={() => setExpanded(expanded === word.id ? null : word.id)}
                  >
                    {/* Japanese */}
                    <td>
                      <span className="font-japanese text-base font-semibold" style={{ color: 'var(--text-1)' }}>
                        {word.japanese}
                      </span>
                    </td>
                    {/* Hiragana reading */}
                    <td>
                      <span className="font-japanese text-sm" style={{ color: 'var(--text-2)' }}>
                        {word.reading}
                      </span>
                    </td>
                    {/* Romaji — only when show_english is on */}
                    {showEnglish && (
                      <td>
                        <span className="text-sm font-mono" style={{ color: 'var(--pink)', opacity: 0.8 }}>
                          {toRomaji(word.reading)}
                        </span>
                      </td>
                    )}
                    {/* English */}
                    <td style={{ color: 'var(--text-2)' }}>{word.english}</td>
                    {/* Type badge */}
                    <td>
                      <span className={`badge ${typeBadge[word.type] || 'bg-zinc-100 text-zinc-600'}`}>
                        {word.type}
                      </span>
                    </td>
                    <td className="text-right">
                      {expanded === word.id
                        ? <ChevronUp size={14} style={{ color: 'var(--text-3)' }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
                    </td>
                  </tr>

                  {/* Expanded example sentence */}
                  {expanded === word.id && (
                    <tr key={`${word.id}-detail`}>
                      <td colSpan={6} className="px-4 py-4" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="space-y-2">
                          {word.example_jp && (
                            <div>
                              <p className="font-japanese text-sm" style={{ color: 'var(--text-1)' }}>
                                {word.example_jp}
                              </p>
                              {showEnglish && (
                                <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>
                                  {toRomaji(word.example_jp)}
                                </p>
                              )}
                              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                                {word.example_en}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <AudioButton text={word.japanese} />
                            {word.example_jp && <AudioButton text={word.example_jp} />}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
