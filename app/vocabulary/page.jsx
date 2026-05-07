'use client';

import { useEffect, useState } from 'react';
import AudioButton from '@/components/AudioButton';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

const TYPES = ['', 'noun', 'verb', 'adjective', 'adverb', 'expression'];

export default function VocabularyPage() {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

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
    noun: 'bg-blue-50 text-blue-700',
    verb: 'bg-green-50 text-green-700',
    adjective: 'bg-purple-50 text-purple-700',
    adverb: 'bg-orange-50 text-orange-700',
    expression: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Vocabulary</h1>
        <p className="text-sm text-zinc-500 mt-1">N5 vocabulary list — {vocab.length} words shown</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search japanese, reading, or english…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t || 'All types'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
        ) : vocab.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm">No results found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Japanese</th>
                <th>Reading</th>
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
                    <td>
                      <span className="font-japanese text-base font-medium text-zinc-900">{word.japanese}</span>
                    </td>
                    <td>
                      <span className="font-japanese text-sm text-zinc-500">{word.reading}</span>
                    </td>
                    <td className="text-zinc-700">{word.english}</td>
                    <td>
                      <span className={`badge ${typeBadge[word.type] || 'bg-zinc-100 text-zinc-600'}`}>
                        {word.type}
                      </span>
                    </td>
                    <td className="text-right">
                      {expanded === word.id
                        ? <ChevronUp size={14} className="text-zinc-400" />
                        : <ChevronDown size={14} className="text-zinc-400" />
                      }
                    </td>
                  </tr>
                  {expanded === word.id && (
                    <tr key={`${word.id}-detail`} className="bg-zinc-50">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="space-y-2">
                          {word.example_jp && (
                            <div>
                              <p className="font-japanese text-sm text-zinc-800">{word.example_jp}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{word.example_en}</p>
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
