'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, AlertTriangle, Trophy } from 'lucide-react';
import Bar from '@/components/Bar';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'おやすみ';
  if (h < 12) return 'おはよう';
  if (h < 18) return 'こんにちは';
  return 'こんばんは';
}

function LessonCard({ href, ready, tileBg, icon, title, sub, badge }) {
  const body = (
    <>
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: tileBg,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--heading)' }}>{title}</strong>
        <span className="muted" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{sub}</span>
      </span>
      {badge != null && badge !== '' && (
        <strong style={{ fontSize: '1.4rem', color: 'var(--orange)' }}>{badge}</strong>
      )}
      <span className="muted" style={{ fontSize: '1.2rem', fontWeight: 800 }}>→</span>
    </>
  );

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'var(--panel)',
    border: '2px solid var(--border)',
    boxShadow: '0 4px 0 var(--border)',
    borderRadius: 12,
    padding: '1rem 1.25rem',
    textDecoration: 'none',
    opacity: ready ? 1 : 0.55,
  };

  return ready ? (
    <Link href={href} style={style} aria-label={title}>
      {body}
    </Link>
  ) : (
    <div style={style} aria-disabled="true">
      {body}
    </div>
  );
}

export default function Dashboard() {
  const [dash, setDash] = useState(null);
  const [due, setDue] = useState(null);
  const [weakCount, setWeakCount] = useState(0);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setDash).catch(() => {});
    fetch('/api/review/due').then((r) => r.json()).then(setDue).catch(() => {});
    fetch('/api/weak-points').then((r) => r.json()).then((d) => setWeakCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, []);

  const loading = !dash || !due;
  const counts = due?.counts || {};
  const limits = due?.limits || {};
  const goals = due?.dailyGoals || due?.dailyGoal || { vocabulary: 50, kanji: 20 };
  const selCount = due?.selectionCount ?? 0;

  const stat = (type) => {
    const pending = counts[type] || 0;
    const goal = goals[type] ?? 0;
    const done = Math.max(0, goal - (limits[type] ?? 0));
    return { pending, goal, done, limit: limits[type] ?? 0 };
  };
  const v = stat('vocabulary');
  const k = stat('kanji');
  const g = stat('grammar');
  const masteredV = dash?.progress?.vocabulary?.mastered ?? 0;
  const masteredK = dash?.progress?.kanji?.mastered ?? 0;
  const masteredG = dash?.progress?.grammar?.mastered ?? 0;
  const masteredTotal = masteredV + masteredK;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <p className="jp-display" style={{ fontSize: '2.2rem', margin: 0 }}>{greeting()}</p>
        <p style={{ margin: '0.25rem 0 0' }}>
          <strong style={{ color: 'var(--orange)' }}>{dash?.streak ?? 0} day streak</strong>
          <span className="muted"> · {dash?.reviewedToday ?? 0} done today</span>
        </p>
      </div>

      {loading ? (
        <p className="muted">Loading your lessons…</p>
      ) : selCount === 0 && v.pending + k.pending === 0 ? (
        <div className="hero-panel" style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.75rem' }}>
            <strong>Your journey starts here.</strong>
            <br />
            <span className="muted">Add your first words to unlock lessons.</span>
          </p>
          <Link href="/review" className="btn btn-solid">Start →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem', marginBottom: '1.75rem' }}>
          <LessonCard
            href="/review?type=vocabulary"
            ready={v.pending > 0 && v.limit > 0}
            tileBg="var(--orange)"
            icon={<BookOpen size={26} />}
            title="Vocabulary review"
            sub={v.pending > 0 ? `${v.pending} due · ${v.done}/${v.goal} done` : 'All clear ✓'}
            badge={v.pending > 0 ? v.pending : null}
          />
          <LessonCard
            href="/review?type=kanji"
            ready={k.pending > 0 && k.limit > 0}
            tileBg="var(--orange)"
            icon={<span className="font-japanese" style={{ fontSize: 24, fontWeight: 800 }}>漢</span>}
            title="Kanji review"
            sub={k.pending > 0 ? `${k.pending} due · ${k.done}/${k.goal} done` : 'All clear ✓'}
            badge={k.pending > 0 ? k.pending : null}
          />
          <LessonCard
            href="/review?type=grammar"
            ready={g.pending > 0 && g.limit > 0}
            tileBg="var(--orange)"
            icon={<span className="font-japanese" style={{ fontSize: 24, fontWeight: 800 }}>文</span>}
            title="Grammar review"
            sub={g.pending > 0 ? `${g.pending} due · ${g.done}/${g.goal} done` : 'All clear ✓'}
            badge={g.pending > 0 ? g.pending : null}
          />
          <LessonCard
            href="/review?source=weak"
            ready={weakCount > 0}
            tileBg="var(--orange)"
            icon={<AlertTriangle size={26} />}
            title="Weak drill"
            sub={weakCount > 0 ? `${weakCount} to fix` : 'Nothing weak'}
            badge={weakCount > 0 ? weakCount : null}
          />
          <LessonCard
            href="/quiz"
            ready
            tileBg="var(--orange)"
            icon={<Trophy size={26} />}
            title="Quiz"
            sub="quick test"
          />
          <LessonCard
            href="/quiz?type=mastery"
            ready={masteredTotal > 0}
            tileBg="var(--yellow)"
            icon={<span style={{ fontSize: 26, fontWeight: 900, color: '#5c4a00' }}>★</span>}
            title="Mastery"
            sub={masteredTotal > 0 ? `${masteredTotal} earned` : 'locked — master words first'}
          />
        </div>
      )}

      {!loading && !(selCount === 0 && v.pending + k.pending === 0) && (
        <div>
          <h2 className="section-head" style={{ margin: '0 0 0.75rem' }}>Today&apos;s goals</h2>
          {[
            { label: 'Vocabulary', s: v },
            { label: 'Kanji', s: k },
            { label: 'Grammar', s: g },
          ].map(({ label, s }) => (
            <div key={label} style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span><strong>{label}</strong> <span className="muted">{s.done}/{s.goal}</span></span>
                {s.pending > 0 && s.limit > 0 && <Link href="/review">review →</Link>}
              </p>
              <Bar value={s.done} max={s.goal} color="var(--orange)" />
            </div>
          ))}
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Mastered: {masteredV} vocab · {masteredK} kanji · {masteredG} grammar ·{' '}
            <Link href="/vocabulary">word list</Link> · <Link href="/kanji">kanji list</Link> · <Link href="/grammar">grammar list</Link>
          </p>
        </div>
      )}
    </div>
  );
}
