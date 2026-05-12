'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ── Floating kanji characters for the hero ────────────────────────────────────
const BG_KANJI = ['日', '月', '火', '水', '木', '金', '土', '山', '川', '人', '口', '手', '目', '耳', '心', '語', '本', '学', '字', '読'];

function FloatingChar({ char, style }) {
  return (
    <span
      className="font-japanese absolute select-none pointer-events-none font-bold"
      style={{
        color: 'rgba(255,0,128,0.06)',
        fontSize: `${Math.random() * 60 + 40}px`,
        ...style,
      }}
    >
      {char}
    </span>
  );
}

// ── Circular progress ring ────────────────────────────────────────────────────
function Ring({ value, max, size = 110, stroke = 8, color = '#ff0080', label, sublabel, count }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dashOffset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          {/* Progress */}
          <circle cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold font-japanese text-xl" style={{ color: 'var(--text-1)' }}>
            {value}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>/{max}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-japanese text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sublabel}</p>
        {count !== undefined && (
          <p className="text-xs mt-1 font-mono" style={{ color: color }}>
            {count} due today
          </p>
        )}
      </div>
    </div>
  );
}

// ── Streak flame component ────────────────────────────────────────────────────
function StreakFlame({ days }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <span className="font-japanese" style={{ fontSize: 48, lineHeight: 1 }}>🔥</span>
        {days > 0 && (
          <div
            className="absolute -top-1 -right-3 rounded-full w-5 h-5 flex items-center justify-center"
            style={{ background: 'var(--pink)', fontSize: 10, fontWeight: 700, color: '#fff' }}
          >
            {days}
          </div>
        )}
      </div>
      <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
        {days === 0 ? 'Start your streak!' : `${days} day streak`}
      </p>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [floaters] = useState(() =>
    BG_KANJI.map((char, i) => ({
      char,
      style: {
        top: `${Math.floor(Math.random() * 85)}%`,
        left: `${Math.floor(Math.random() * 90)}%`,
        opacity: 0.6 + Math.random() * 0.4,
        fontSize: `${40 + Math.floor(Math.random() * 70)}px`,
        animationDelay: `${i * 0.4}s`,
      },
    }))
  );

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const vocabMastered = data?.progress?.vocabulary?.mastered ?? 0;
  const vocabTotal = data?.progress?.vocabulary?.total ?? 0;
  const kanjiMastered = data?.progress?.kanji?.mastered ?? 0;
  const kanjiTotal = data?.progress?.kanji?.total ?? 0;
  const streak = data?.streak ?? 0;
  const vocabDue = data?.counts?.vocabulary ?? 0;
  const kanjiDue = data?.counts?.kanji ?? 0;

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-8 p-10"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', minHeight: 280 }}
      >
        {/* Floating kanji background */}
        {floaters.map((f, i) => <FloatingChar key={i} char={f.char} style={f.style} />)}

        {/* Glow blob */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 320, height: 320, top: -80, right: -80,
            background: 'radial-gradient(circle, rgba(255,0,128,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <p className="font-japanese text-xs tracking-[0.3em] mb-2" style={{ color: 'var(--pink)' }}>
            日本語能力試験 · JLPT N5
          </p>
          <h1 className="font-japanese font-bold mb-1" style={{ fontSize: 52, lineHeight: 1.1, color: 'var(--text-1)' }}>
            言葉
          </h1>
          <p className="text-sm tracking-widest uppercase font-semibold mb-4" style={{ color: 'var(--text-2)', letterSpacing: '0.3em' }}>
            KOTOBA — Japanese for Beginners
          </p>
          <p className="text-sm max-w-md leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Every character you learn is a step closer to fluency.<br />
            継続は力なり — Persistence is power.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/review"
              className="btn-primary flex items-center gap-2"
            >
              復習を始める →
            </Link>
            <Link
              href="/vocabulary"
              className="btn-secondary flex items-center gap-2"
            >
              単語を勉強する
            </Link>
          </div>
        </div>

        {/* Streak badge — top right */}
        {!loading && (
          <div
            className="absolute top-6 right-6 rounded-xl px-4 py-3 flex flex-col items-center"
            style={{
              background: 'rgba(255,0,128,0.06)',
              border: '1px solid rgba(255,0,128,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <StreakFlame days={streak} />
          </div>
        )}
      </div>

      {/* ── Progress rings ── */}
      <div
        className="rounded-2xl p-8 mb-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-8">
          <p className="font-japanese text-xs tracking-widest" style={{ color: 'var(--pink)' }}>進捗状況</p>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Progress · selected items</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>読み込み中…</div>
        ) : (
          <div className="flex flex-wrap justify-around gap-10">
            <Ring
              value={vocabMastered}
              max={vocabTotal}
              color="#ff0080"
              label="単語 Vocabulary"
              sublabel={`${vocabTotal} N5 words`}
              count={vocabDue}
              size={130}
            />
            <Ring
              value={kanjiMastered}
              max={kanjiTotal}
              color="#c084fc"
              label="漢字 Kanji"
              sublabel={`${kanjiTotal} characters`}
              count={kanjiDue}
              size={130}
            />
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/vocabulary', jp: '単語', label: 'Vocabulary', sub: `${vocabTotal} words`, color: '#ff0080' },
          { href: '/kanji', jp: '漢字', label: 'Kanji', sub: `${kanjiTotal} chars`, color: '#c084fc' },
          { href: '/review', jp: '復習', label: 'Review', sub: `${(vocabDue + kanjiDue)} due`, color: '#f97316' },
          { href: '/mock-test', jp: '模試', label: 'Mock Test', sub: 'Timed quiz', color: '#22d3ee' },
        ].map(({ href, jp, label, sub, color }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl p-5 block transition-all group"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${color}55`;
              e.currentTarget.style.background = `${color}0a`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-surface)';
            }}
          >
            <p className="font-japanese text-2xl font-bold mb-1" style={{ color }}>{jp}</p>
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{label}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
