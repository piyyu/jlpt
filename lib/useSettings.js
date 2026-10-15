'use client';

import { useState, useEffect } from 'react';

const DEFAULTS = {
  show_english: 'false',
  furigana:     'true',
  romaji:       'true',
  audio_speed:  '1.0',
  daily_goal:   '20',
  daily_goal_vocab: '50',
  daily_goal_kanji: '20',
  daily_goal_grammar: '10',
};

/**
 * Reads all settings from the API once on mount.
 * Returns { settings, showEnglish, showRomaji, loading }.
 */
export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULTS, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return {
    settings,
    loading,
    showEnglish: settings.show_english === 'true',
    showRomaji: settings.romaji === 'true',
  };
}
