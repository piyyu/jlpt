'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LEECH_THRESHOLD = 8;

export default function WeakPointsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/weak-points')
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function resolve(item) {
    await fetch('/api/weak-points', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: item.content_type, content_id: item.content_id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const filtered = filterType ? items.filter((i) => i.content_type === filterType) : items;
  const leeches = items.filter((i) => (i.wrong_count ?? 0) >= LEECH_THRESHOLD);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Weak points</h1>
      <p style={{ marginTop: 0 }}>
        Items you got wrong most often.
        {leeches.length > 0 && ` ${leeches.length} leech${leeches.length > 1 ? 'es' : ''} (≥${LEECH_THRESHOLD}×) — drill in small batches.`}
      </p>
      <div className="toolbar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by type" style={{ maxWidth: '11rem' }}>
          <option value="">All types</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="kanji">Kanji</option>
          <option value="grammar">Grammar</option>
        </select>
      </div>
      {items.length > 0 && (
        <div className="toolbar-actions">
          <Link className="btn" href="/review?source=weak" style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}>
            Drill in review
          </Link>
          <Link className="btn" href="/quiz?type=mixed" style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}>
            Quiz me
          </Link>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{items.length === 0 ? 'No weak points yet — keep studying!' : 'No items match the filter.'}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Answer</th>
              <th className="muted">Wrong</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="font-japanese">{item.prompt}</span>
                  <span className="muted"> {item.reading || ''}</span>
                  {(item.wrong_count ?? 0) >= LEECH_THRESHOLD && <span className="muted"> · leech</span>}
                </td>
                <td className="muted">{item.answer}</td>
                <td>{item.wrong_count}×</td>
                <td>
                  <Link href="#" onClick={(e) => { e.preventDefault(); resolve(item); }}>resolve</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
