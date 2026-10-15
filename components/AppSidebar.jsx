'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, RotateCcw, AlertTriangle, BookOpen,
  Trophy, Settings,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

function Glyph({ children }) {
  return (
    <span className="font-japanese" style={{ width: 18, textAlign: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
      {children}
    </span>
  );
}

const SECTIONS = [
  {
    head: 'Study',
    items: [
      { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} />, badge: null },
      { href: '/review', label: 'Review', icon: <RotateCcw size={18} />, badge: 'due' },
      { href: '/weak-points', label: 'Weak points', icon: <AlertTriangle size={18} />, badge: 'weak' },
    ],
  },
  {
    head: 'Learn',
    items: [
      { href: '/vocabulary', label: 'Vocabulary', icon: <BookOpen size={18} />, badge: null },
      { href: '/kanji', label: 'Kanji', icon: <Glyph>漢</Glyph>, badge: null },
      { href: '/grammar', label: 'Grammar', icon: <Glyph>文</Glyph>, badge: null },
      { href: '/hiragana', label: 'Hiragana', icon: <Glyph>あ</Glyph>, badge: null },
      { href: '/katakana', label: 'Katakana', icon: <Glyph>ア</Glyph>, badge: null },
    ],
  },
  {
    head: 'Practice',
    items: [
      { href: '/quiz', label: 'Quiz', icon: <Trophy size={18} />, badge: null },
    ],
  },
];

const TABS = [
  { href: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { href: '/review', label: 'Review', icon: <RotateCcw size={20} />, badge: 'due' },
  { href: '/vocabulary', label: 'Words', icon: <BookOpen size={20} /> },
  { href: '/kanji', label: 'Kanji', icon: <Glyph>漢</Glyph> },
  { href: '/quiz', label: 'Quiz', icon: <Trophy size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [due, setDue] = useState(0);
  const [weak, setWeak] = useState(0);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => setDue(d.dueToday ?? 0))
      .catch(() => {});
    fetch('/api/weak-points')
      .then((r) => r.json())
      .then((d) => setWeak(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [pathname]);

  const badgeCount = (b) => (b === 'due' ? due : b === 'weak' ? weak : 0);

  return (
    <>
      <aside className="app-nav" aria-label="App">
        <div style={{ padding: '1.5rem 1.25rem 1rem' }}>
          <Link href="/" className="masthead-mark">言葉</Link>
          <p className="masthead-sub">Kotoba</p>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
          {SECTIONS.map((s) => (
            <div key={s.head} style={{ marginBottom: '1.25rem' }}>
              <p className="nav-section-head">{s.head}</p>
              {s.items.map((it) => {
                const n = badgeCount(it.badge);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`nav-link${pathname === it.href ? ' active' : ''}`}
                  >
                    {it.icon}
                    <span>{it.label}</span>
                    <span className="nav-badge" style={{ visibility: n > 0 ? 'visible' : 'hidden' }} aria-hidden={n === 0}>
                      {n > 0 ? n : 0}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <ThemeToggle />
        </div>
        <div style={{ padding: '0 0.75rem 1.25rem' }}>
          <Link href="/settings" className={`nav-link${pathname === '/settings' ? ' active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      <nav className="tabbar" aria-label="App">
        {TABS.map((t) => {
          const n = badgeCount(t.badge);
          return (
            <Link key={t.href} href={t.href} className={`tab-link${pathname === t.href ? ' active' : ''}`}>
              <span style={{ position: 'relative' }}>
                {t.icon}
                {n > 0 && <span className="tab-badge">{n > 99 ? '99+' : n}</span>}
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
