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
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      onClick={speak}
      disabled={playing}
      title={`Listen: ${text}`}
      className={`inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 transition-colors disabled:opacity-50 ${className}`}
    >
      {playing ? (
        <Loader size={14} className="animate-spin" />
      ) : (
        <Volume2 size={14} />
      )}
      <span className="text-xs">{playing ? 'Playing…' : 'Listen'}</span>
    </button>
  );
}
