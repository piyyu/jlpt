'use client';

import { Volume2, Loader } from 'lucide-react';
import { useState } from 'react';

export default function AudioButton({ text, lang = 'ja-JP', rate = 1.0, className = '' }) {
  const [playing, setPlaying] = useState(false);

  function speak() {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.onstart = () => setPlaying(true);
    utterance.onend   = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      onClick={speak}
      disabled={playing}
      title={`Listen: ${text}`}
      className={`inline-flex items-center gap-1.5 transition-all disabled:opacity-40 ${className}`}
      style={{ color: playing ? 'var(--pink)' : 'var(--text-3)' }}
      onMouseEnter={(e) => { if (!playing) e.currentTarget.style.color = 'var(--pink)'; }}
      onMouseLeave={(e) => { if (!playing) e.currentTarget.style.color = 'var(--text-3)'; }}
    >
      {playing
        ? <Loader size={13} className="animate-spin" />
        : <Volume2 size={13} />}
      <span style={{ fontSize: '11px' }}>{playing ? '再生中…' : '音声'}</span>
    </button>
  );
}
