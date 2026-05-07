'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  FileText,
  Square,
  AlignLeft,
  Hash,
  Mic,
  ScrollText,
  Trophy,
  ClipboardList,
  Settings,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const NAV = [
  {
    group: 'Study',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/review', label: 'Review', icon: RotateCcw },
      { href: '/weak-points', label: 'Weak Points', icon: AlertTriangle },
    ],
  },
  {
    group: 'Learn',
    items: [
      { href: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
      { href: '/grammar', label: 'Grammar', icon: FileText },
      { href: '/kanji', label: 'Kanji', icon: Square },
      { href: '/hiragana', label: 'Hiragana', icon: AlignLeft },
      { href: '/katakana', label: 'Katakana', icon: AlignLeft },
      { href: '/particles', label: 'Particles', icon: Hash },
      { href: '/numbers', label: 'Numbers', icon: Hash },
    ],
  },
  {
    group: 'Practice',
    items: [
      { href: '/quiz', label: 'Quiz', icon: Trophy },
      { href: '/listening', label: 'Listening', icon: Mic },
      { href: '/reading', label: 'Reading', icon: ScrollText },
      { href: '/mock-test', label: 'Mock Test', icon: ClipboardList },
    ],
  },
  {
    group: 'Config',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = ({ collapsed = false }) => (
    <nav className="flex-1 overflow-y-auto py-4">
      {NAV.map((section) => (
        <div key={section.group} className="mb-4">
          {!collapsed && (
            <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              {section.group}
            </p>
          )}
          {section.items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-md mx-2 mb-0.5 ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && (
                  <ChevronRight size={12} className="ml-auto text-zinc-400" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-zinc-200 bg-white min-h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold font-japanese">日</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 leading-tight">JLPT N5</p>
              <p className="text-[10px] text-zinc-400">Study App</p>
            </div>
          </div>
        </div>
        <NavContent />
        <div className="px-4 py-3 border-t border-zinc-200">
          <p className="text-[10px] text-zinc-400">N5 Study App v1.0</p>
        </div>
      </aside>

      {/* Mobile: hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-zinc-200 rounded-lg shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: slide-in sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-56 bg-white border-r border-zinc-200 z-50 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold font-japanese">日</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 leading-tight">JLPT N5</p>
              <p className="text-[10px] text-zinc-400">Study App</p>
            </div>
          </div>
        </div>
        <NavContent />
      </aside>
    </>
  );
}
