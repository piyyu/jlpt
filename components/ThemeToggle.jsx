'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'light');
  }, []);

  function choose(t) {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('kotoba-theme', t);
    } catch {}
    setTheme(t);
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      style={{ display: 'flex', border: '2px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}
    >
      {['light', 'dark'].map((t) => (
        <button
          key={t}
          onClick={() => choose(t)}
          aria-pressed={theme === t}
          style={{
            flex: 1,
            padding: '0.3rem 0',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'capitalize',
            border: 'none',
            cursor: 'pointer',
            background: theme === t ? 'var(--heading)' : 'transparent',
            color: theme === t ? 'var(--bg)' : 'var(--muted)',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
