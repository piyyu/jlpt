'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const TYPE_COLORS = {
  vocabulary: 'bg-blue-50 text-blue-700 border-blue-200',
  kanji: 'bg-purple-50 text-purple-700 border-purple-200',
  grammar: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function WeakPointsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetch('/api/weak-points')
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, []);

  const filtered = filterType ? items.filter((i) => i.content_type === filterType) : items;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Weak Points</h1>
          <p className="text-sm text-zinc-500 mt-1">Items you got wrong most often, sorted by error count</p>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">All types</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="kanji">Kanji</option>
          <option value="grammar">Grammar</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <AlertTriangle size={32} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">
            {items.length === 0
              ? 'No weak points yet — keep studying!'
              : 'No items match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Answer</th>
                <th>Reading</th>
                <th>Type</th>
                <th className="text-right">Wrong</th>
                <th>Last Wrong</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="font-japanese text-base font-medium text-zinc-900">{item.prompt}</span>
                  </td>
                  <td className="text-zinc-700">{item.answer}</td>
                  <td>
                    <span className="font-japanese text-sm text-zinc-500">{item.reading || '—'}</span>
                  </td>
                  <td>
                    <span className={`badge border ${TYPE_COLORS[item.content_type] || 'bg-zinc-100 text-zinc-600'}`}>
                      {item.content_type}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-sm font-semibold text-red-500">{item.wrong_count}×</span>
                  </td>
                  <td className="text-zinc-400 text-xs">
                    {item.last_wrong_at ? new Date(item.last_wrong_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
