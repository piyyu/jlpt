'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, RotateCcw, AlertTriangle,
  BookOpen, Square, AlignLeft,
  Trophy, ClipboardList,
  Settings, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const HiraganaIcon = ({ size }) => (
  <span className="font-japanese font-bold leading-none select-none" style={{ fontSize: size }}>あ</span>
);
const KatakanaIcon = ({ size }) => (
  <span className="font-japanese font-bold leading-none select-none" style={{ fontSize: size }}>ア</span>
);

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
      { href: '/kanji',       label: 'Kanji',      labelJp: '漢字',      icon: Square },
      { href: '/hiragana',    label: 'Hiragana',   labelJp: 'ひらがな',  icon: HiraganaIcon },
      { href: '/katakana',    label: 'Katakana',   labelJp: 'カタカナ',  icon: KatakanaIcon },
    ],
  },
  {
    group: '練習',
    groupEn: 'PRACTICE',
    items: [
      { href: '/quiz',        label: 'Quiz',       labelJp: 'クイズ',    icon: Trophy },
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


function NavLinks({ pathname, onClose, isCollapsed }) {
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2">
      {NAV.map((section) => (
        <div key={section.group} className="mb-4">
          <div className="h-8 flex items-center px-[22px] mb-1 overflow-hidden relative">
            {/* Divider line - stable base for animation */}
            <div 
              className="absolute left-[22px] h-px transition-all duration-300 z-0" 
              style={{ 
                background: 'var(--border)',
                top: '50%',
                opacity: isCollapsed ? 0.3 : 0.6,
                width: isCollapsed ? '36px' : 'calc(100% - 44px)',
              }} 
            />

            {/* Text labels with masking background */}
            <div 
              className={`flex items-center gap-2 transition-all duration-300 ease-in-out overflow-hidden relative z-10 pr-3`}
              style={{ 
                maxWidth: isCollapsed ? '0px' : '200px',
                opacity: isCollapsed ? 0 : 1,
                background: '#0a0a0a', // match sidebar bg to mask the line
                transform: isCollapsed ? 'translateX(-10px)' : 'translateX(0)'
              }}
            >
              <span className="font-japanese text-sm font-bold whitespace-nowrap" style={{ color: 'var(--pink)' }}>
                {section.group}
              </span>
              <span className="text-[9px] tracking-[0.2em] font-semibold whitespace-nowrap" style={{ color: 'var(--text-3)' }}>
                {section.groupEn}
              </span>
            </div>
          </div>

          {section.items.map(({ href, label, labelJp, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={isCollapsed ? label : ''}
                className={`flex items-center gap-4 py-2.5 rounded-md mb-1 transition-all group relative px-[22px] overflow-hidden`}
                style={{
                  background:  active ? 'rgba(255,0,128,0.08)' : 'transparent',
                  color:       active ? 'var(--pink)'          : 'var(--text-2)',
                }}
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  <Icon size={20} className="transition-transform group-hover:scale-110" />
                </div>

                <div 
                  className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
                >
                  <p className="text-xs font-semibold leading-tight whitespace-nowrap">{label}</p>
                  <p
                    className="font-japanese leading-tight mt-0.5 whitespace-nowrap"
                    style={{ fontSize: '10px', color: active ? 'rgba(255,0,128,0.6)' : 'var(--text-3)' }}
                  >
                    {labelJp}
                  </p>
                </div>
                
                {active && (
                  <div
                    className="absolute left-0 w-1 h-6 rounded-r-full"
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

function Logo({ isCollapsed, onToggle }) {
  return (
    <button 
      onClick={onToggle}
      className={`w-full py-5 transition-all duration-300 text-left group hover:bg-zinc-900/40 px-[22px]`} 
      style={{ borderBottom: '1px solid var(--border)' }}
      title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
    >
      <div className="flex items-center gap-4">
        {/* Logo mark — 言 on black with pink ring */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: '#0d0d0d',
            border: '1.5px solid var(--pink)',
            boxShadow: '0 0 10px rgba(255,0,128,0.3)',
          }}
        >
          <span
            className="font-japanese font-bold leading-none"
            style={{ fontSize: '18px', color: 'var(--pink)' }}
          >
            言
          </span>
        </div>
        
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 translate-x-4 invisible' : 'opacity-100 translate-x-0 visible'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-bold tracking-widest leading-tight uppercase whitespace-nowrap"
                style={{ fontSize: '13px', color: 'var(--text-1)', letterSpacing: '0.12em' }}
              >
                KOTOBA
              </p>
              <p
                className="font-japanese leading-tight whitespace-nowrap"
                style={{ fontSize: '9px', color: 'var(--pink)', letterSpacing: '0.08em', opacity: 0.7 }}
              >
                言葉 · JLPT N5
              </p>
            </div>
            <ChevronLeft size={14} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </button>
  );
}

function Footer({ isCollapsed }) {
  return (
    <div 
      className={`px-4 py-3 transition-all duration-300 ${isCollapsed ? 'opacity-0 invisible h-0' : 'opacity-100 visible h-auto'}`} 
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <p
        className="font-japanese text-center whitespace-nowrap"
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load persistence and update CSS variable
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true';
    setIsCollapsed(saved);
    document.documentElement.style.setProperty('--sidebar-width', saved ? '5rem' : '14rem');
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    document.documentElement.style.setProperty('--sidebar-width', next ? '5rem' : '14rem');
  };

  return (
    <>
      {/* Desktop — fixed sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out`}
        style={{ 
          width: isCollapsed ? '5rem' : '14rem',
          background: '#0a0a0a', 
          borderRight: '1px solid var(--border)' 
        }}
      >
        <Logo isCollapsed={isCollapsed} onToggle={toggleCollapse} />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <NavLinks pathname={pathname} onClose={() => {}} isCollapsed={isCollapsed} />
        </div>



        <Footer isCollapsed={isCollapsed} />
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

      {/* Mobile slide-in (always full width) */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0a0a0a', borderRight: '1px solid var(--border)' }}
      >
        <Logo isCollapsed={false} onToggle={() => setMobileOpen(false)} />
        <NavLinks pathname={pathname} onClose={() => setMobileOpen(false)} isCollapsed={false} />
        <Footer isCollapsed={false} />
      </aside>
    </>
  );
}
