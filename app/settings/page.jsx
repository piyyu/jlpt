'use client';

import { useEffect, useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

const SETTINGS_DEF = [
  { key: 'daily_goal', label: 'Daily Review Goal', type: 'number', min: 1, max: 200, description: 'Number of cards to review per day' },
  { key: 'show_english', label: 'Show English on Cards', type: 'toggle', description: 'Show the English meaning on the front of review cards (helpful for beginners)' },
  { key: 'furigana', label: 'Show Furigana', type: 'toggle', description: 'Display reading above Japanese characters' },
  { key: 'romaji', label: 'Show Romaji', type: 'toggle', description: 'Display romanized pronunciation' },
  { key: 'audio_speed', label: 'Audio Speed', type: 'range', min: 0.5, max: 2.0, step: 0.1, description: 'Playback speed for text-to-speech' },
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
    alert('Progress has been reset. You can now start fresh!');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-1)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Customize your study experience</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--text-3)' }}>Loading…</div>
      ) : (
        <div className="max-w-lg space-y-4">
          {SETTINGS_DEF.map((def) => (
            <div key={def.key} className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{def.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{def.description}</p>
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
                      className="w-20 px-2 py-1.5 text-sm border rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-pink-500"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
                    />
                    <button
                      onClick={() => saveSetting(def.key, settings[def.key])}
                      disabled={saving === def.key}
                      className={`p-1.5 rounded-lg transition-colors ${saved === def.key ? 'text-green-500' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                      className="w-24 accent-pink-500"
                    />
                    <span className="text-sm w-8 text-right" style={{ color: 'var(--text-2)' }}>{parseFloat(settings[def.key] || 1).toFixed(1)}×</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Reset progress */}
          <div className="card p-5 border-red-900/30" style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Reset All Progress</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(239, 68, 68, 0.7)' }}>Delete all SRS progress and start fresh</p>
              </div>
              {resetConfirm ? (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setResetConfirm(false)} className="text-xs px-3 py-1.5 rounded-md" style={{ color: 'var(--text-3)' }}>Cancel</button>
                  <button onClick={resetProgress} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Confirm</button>
                </div>
              ) : (
                <button onClick={() => setResetConfirm(true)} className="shrink-0 text-xs px-3 py-1.5 border border-red-900/30 text-red-500 rounded-md hover:bg-red-900/10 transition-colors flex items-center gap-1">
                  <AlertTriangle size={12} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
