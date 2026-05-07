'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, RotateCcw, AlertTriangle,
  BookOpen, FileText, Square, AlignLeft,
  Hash, Mic, ScrollText, Trophy, ClipboardList,
  Settings, Menu, X,
} from 'lucide-react';

const NAV = [
  {
    group: '勉強',
    groupEn: 'STUDY',
    items: [
      { href: '/',            label: 'Dashboard',  labelJp: 'ホーム',    icon: LayoutDashboard },
      { href: '/review',      label: 'Review',     labelJp: '復習',      icon: RotateCcw },
      { href: '/weak-points', label: 'Weak Points',labelJp: '弱点',      icon: AlertTriangle },
    ],
  },
  {
    group: '学習',
    groupEn: 'LEARN',
    items: [
      { href: '/vocabulary',  label: 'Vocabulary', labelJp: '単語',      icon: BookOpen },
      { href: '/grammar',     label: 'Grammar',    labelJp: '文法',      icon: FileText },
      { href: '/kanji',       label: 'Kanji',      labelJp: '漢字',      icon: Square },
      { href: '/hiragana',    label: 'Hiragana',   labelJp: 'ひらがな',  icon: AlignLeft },
      { href: '/katakana',    label: 'Katakana',   labelJp: 'カタカナ',  icon: AlignLeft },
      { href: '/particles',   label: 'Particles',  labelJp: '助詞',      icon: Hash },
      { href: '/numbers',     label: 'Numbers',    labelJp: '数字',      icon: Hash },
    ],
  },
  {
    group: '練習',
    groupEn: 'PRACTICE',
    items: [
      { href: '/quiz',        label: 'Quiz',       labelJp: 'クイズ',    icon: Trophy },
      { href: '/listening',   label: 'Listening',  labelJp: '聴解',      icon: Mic },
      { href: '/reading',     label: 'Reading',    labelJp: '読解',      icon: ScrollText },
      { href: '/mock-test',   label: 'Mock Test',  labelJp: '模擬試験',  icon: ClipboardList },
    ],
  },
  {
    group: '設定',
    groupEn: 'CONFIG',
    items: [
      { href: '/settings',    label: 'Settings',   labelJp: '設定',      icon: Settings },
    ],
  },
];

function NavLinks({ pathname, onClose }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2">
      {NAV.map((section) => (
        <div key={section.group} className="mb-5">
          {/* Group label */}
          <div className="flex items-center gap-2 px-2 mb-1.5">
            <span
              className="font-japanese text-sm font-bold"
              style={{ color: 'var(--pink)' }}
            >
              {section.group}
            </span>
            <span className="text-[9px] tracking-[0.2em] font-semibold" style={{ color: 'var(--text-3)' }}>
              {section.groupEn}
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {section.items.map(({ href, label, labelJp, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 transition-all group relative"
                style={{
                  background:  active ? 'rgba(255,0,128,0.08)' : 'transparent',
                  borderLeft:  active ? '2px solid #FF0080'   : '2px solid transparent',
                  color:       active ? 'var(--pink)'          : 'var(--text-2)',
                }}
              >
                <Icon size={14} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight">{label}</p>
                  <p
                    className="font-japanese leading-tight"
                    style={{ fontSize: '10px', color: active ? 'rgba(255,0,128,0.6)' : 'var(--text-3)' }}
                  >
                    {labelJp}
                  </p>
                </div>
                {/* Pink dot on active */}
                {active && (
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--pink)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Logo() {
  return (
    <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{ background: 'var(--pink)' }}
        >
          <span className="font-japanese text-black font-bold text-lg leading-none">日</span>
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide leading-tight" style={{ color: 'var(--text-1)' }}>
            JLPT N5
          </p>
          <p
            className="font-japanese leading-tight"
            style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.05em' }}
          >
            日本語能力試験
          </p>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <p
        className="font-japanese text-center"
        style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.15em' }}
      >
        がんばれ！
      </p>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex flex-col w-56 min-h-screen sticky top-0 shrink-0"
        style={{ background: '#0a0a0a', borderRight: '1px solid var(--border)' }}
      >
        <Logo />
        <NavLinks pathname={pathname} onClose={() => {}} />
        <Footer />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen
          ? <X size={18} style={{ color: 'var(--pink)' }} />
          : <Menu size={18} style={{ color: 'var(--text-2)' }} />
        }
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-56 z-50 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0a0a0a', borderRight: '1px solid var(--border)' }}
      >
        <Logo />
        <NavLinks pathname={pathname} onClose={() => setMobileOpen(false)} />
        <Footer />
      </aside>
    </>
  );
}
