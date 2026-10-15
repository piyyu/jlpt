'use client';

import { Volume2, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AudioButton({ text, lang = 'ja-JP', rate = 1.0, className = '' }) {
  const [playing, setPlaying] = useState(false);
  const [noVoice, setNoVoice] = useState(false);

  // Some browsers (notably Brave) expose speechSynthesis with zero voices,
  // which silently produces no sound. Detect that up front.
  useEffect(() => {
    const check = () => {
      try {
        const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
        setNoVoice(voices.length === 0);
      } catch {
        setNoVoice(true);
      }
    };
    check();
    if (window.speechSynthesis?.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', check);
      return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', check);
    }
  }, []);

  function speak() {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      alert('This browser has no speech voices installed, so sound cannot play. Try Chrome or Firefox.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Prefer a Japanese voice when one exists; otherwise fall back to default.
    const ja = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja'));
    utterance.voice = ja || voices[0];
    utterance.lang = ja ? ja.lang : lang;
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
      title={noVoice ? 'No speech voice in this browser' : `Listen: ${text}`}
      className={`btn ${className}`}
      style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
    >
      {playing
        ? <Loader size={13} className="animate-spin" />
        : <Volume2 size={13} />}
      <span>{playing ? 'playing…' : noVoice ? 'listen (no voice)' : 'listen'}</span>
    </button>
  );
}
