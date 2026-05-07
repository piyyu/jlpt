'use client';

import { useEffect, useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

const SETTINGS_DEF = [
  { key: 'daily_goal',    label: 'Daily Review Goal',       type: 'number', min: 1, max: 200, description: 'Number of cards to review per day' },
  { key: 'show_english',  label: 'Show English on Cards',   type: 'toggle', description: 'Show the English meaning on the front of review cards (helpful for beginners)' },
  { key: 'furigana',      label: 'Show Furigana',           type: 'toggle', description: 'Display reading above Japanese characters' },
  { key: 'romaji',        label: 'Show Romaji',             type: 'toggle', description: 'Display romanized pronunciation' },
  { key: 'audio_speed',   label: 'Audio Speed',             type: 'range',  min: 0.5, max: 2.0, step: 0.1, description: 'Playback speed for text-to-speech' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, []);

  async function saveSetting(key, value) {
    setSaving(key);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    setSettings((s) => ({ ...s, [key]: String(value) }));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  async function resetProgress() {
    // Reset SRS cards to defaults
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'reset_progress', value: String(Date.now()) }),
    });
    setResetConfirm(false);
    alert('Note: To fully reset SRS progress, run: npm run db:reset');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Customize your study experience</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="max-w-lg space-y-4">
          {SETTINGS_DEF.map((def) => (
            <div key={def.key} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{def.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{def.description}</p>
                </div>

                {def.type === 'toggle' && (
                  <button
                    onClick={() => saveSetting(def.key, settings[def.key] === 'true' ? 'false' : 'true')}
                    className="relative w-11 h-6 rounded-full transition-all shrink-0"
                    style={{
                      background: settings[def.key] === 'true' ? 'var(--pink)' : 'var(--bg-elevated)',
                      border: `1px solid ${settings[def.key] === 'true' ? 'var(--pink)' : 'var(--border)'}`,
                    }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${settings[def.key] === 'true' ? 'translate-x-5' : ''}`}
                      style={{ background: settings[def.key] === 'true' ? '#fff' : 'var(--text-3)' }}
                    />
                  </button>
                )}

                {def.type === 'number' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={def.min}
                      max={def.max}
                      value={settings[def.key] || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, [def.key]: e.target.value }))}
                      className="w-20 px-2 py-1.5 text-sm border border-zinc-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <button
                      onClick={() => saveSetting(def.key, settings[def.key])}
                      disabled={saving === def.key}
                      className={`p-1.5 rounded-lg transition-colors ${saved === def.key ? 'text-green-600' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                      <Save size={14} />
                    </button>
                  </div>
                )}

                {def.type === 'range' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="range"
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={settings[def.key] || 1}
                      onChange={(e) => setSettings((s) => ({ ...s, [def.key]: e.target.value }))}
                      onMouseUp={(e) => saveSetting(def.key, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-zinc-600 w-8 text-right">{parseFloat(settings[def.key] || 1).toFixed(1)}×</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Reset progress */}
          <div className="card p-5 border-red-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">Reset All Progress</p>
                <p className="text-xs text-zinc-500 mt-0.5">Delete all SRS progress and re-seed the database</p>
              </div>
              {resetConfirm ? (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setResetConfirm(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                  <button onClick={resetProgress} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">Confirm</button>
                </div>
              ) : (
                <button onClick={() => setResetConfirm(true)} className="shrink-0 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1">
                  <AlertTriangle size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-zinc-400 px-1">
            To fully reset the database, run: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">npm run db:reset</code>
          </div>
        </div>
      )}
    </div>
  );
}
