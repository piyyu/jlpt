'use client';

import { useEffect, useState } from 'react';

const GROUPS = [
  {
    title: 'Daily goals',
    items: [
      { key: 'daily_goal_vocab', label: 'Vocabulary', type: 'number', min: 1, max: 200, description: 'Cards per day — already-reviewed counts.' },
      { key: 'daily_goal_kanji', label: 'Kanji', type: 'number', min: 1, max: 200, description: 'Cards per day — already-reviewed counts.' },
      { key: 'daily_goal_grammar', label: 'Grammar', type: 'number', min: 1, max: 200, description: 'Cards per day — already-reviewed counts.' },
    ],
  },
  {
    title: 'Card display',
    items: [
      { key: 'show_english', label: 'English meanings', type: 'toggle', description: 'Show the English meaning alongside review cards.' },
      { key: 'furigana', label: 'Furigana', type: 'toggle', description: 'Display reading above Japanese characters.' },
      { key: 'romaji', label: 'Romaji', type: 'toggle', description: 'Display romanized pronunciation.' },
    ],
  },
  {
    title: 'Audio',
    items: [
      { key: 'audio_speed', label: 'Playback speed', type: 'range', min: 0.5, max: 2.0, step: 0.1, description: 'Speed for text-to-speech.' },
    ],
  },
];

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!on)}
    />
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!savedKey) return;
    const t = setTimeout(() => setSavedKey(null), 1500);
    return () => clearTimeout(t);
  }, [savedKey]);

  async function saveSetting(key, value) {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    setSettings((s) => ({ ...s, [key]: String(value) }));
    setSavedKey(key);
  }

  async function resetProgress() {
    setResetting(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'reset_progress', value: String(Date.now()) }),
    });
    setResetting(false);
    setConfirmReset(false);
    alert('Progress has been reset.');
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.25rem' }}>Settings</h1>
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0, marginBottom: '1.5rem' }}>
        Changes save automatically.
      </p>

      {GROUPS.map((group) => (
        <section key={group.title} className="settings-card" aria-label={group.title}>
          <h2>{group.title}</h2>
          {group.items.map((def) => (
            <div key={def.key} className="setting-row">
              <div>
                <div className="setting-label">
                  {def.label}{' '}
                  {savedKey === def.key && (
                    <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 400 }}>· saved ✓</span>
                  )}
                </div>
                <div className="setting-desc muted">{def.description}</div>
              </div>

              {def.type === 'toggle' && (
                <Toggle
                  on={settings[def.key] === 'true'}
                  label={def.label}
                  onChange={(next) => saveSetting(def.key, next)}
                />
              )}

              {def.type === 'number' && (
                <input
                  type="number"
                  min={def.min}
                  max={def.max}
                  aria-label={def.label}
                  value={settings[def.key] || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, [def.key]: e.target.value }))}
                  onBlur={(e) => saveSetting(def.key, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  style={{ width: '4.5rem', textAlign: 'center' }}
                />
              )}

              {def.type === 'range' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    aria-label={def.label}
                    value={settings[def.key] || 1}
                    onChange={(e) => setSettings((s) => ({ ...s, [def.key]: e.target.value }))}
                    onMouseUp={(e) => saveSetting(def.key, e.target.value)}
                    onTouchEnd={(e) => saveSetting(def.key, e.target.value)}
                    style={{ width: '6rem' }}
                  />
                  <span className="muted" style={{ minWidth: '2.5rem', textAlign: 'right' }}>
                    {parseFloat(settings[def.key] || 1).toFixed(1)}×
                  </span>
                </span>
              )}
            </div>
          ))}
        </section>
      ))}

      <section className="settings-card" aria-label="Danger zone" style={{ borderColor: 'var(--red)' }}>
        <h2 style={{ color: 'var(--red-dark)' }}>Danger zone</h2>
        <div className="setting-row">
          <div>
            <div className="setting-label">Reset all progress</div>
            <div className="setting-desc muted">Delete all SRS progress and start fresh. This cannot be undone.</div>
          </div>
          {confirmReset ? (
            <span style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setConfirmReset(false)}>cancel</button>
              <button
                className="btn"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--red)', color: 'var(--red-dark)' }}
                onClick={resetProgress}
                disabled={resetting}
              >
                {resetting ? 'resetting…' : 'confirm'}
              </button>
            </span>
          ) : (
            <button
              className="btn"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--red)', color: 'var(--red-dark)', flexShrink: 0 }}
              onClick={() => setConfirmReset(true)}
            >
              reset
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
