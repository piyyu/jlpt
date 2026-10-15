'use client';

import { useEffect, useRef, useState } from 'react';

// Animated KanjiVG stroke order.
// Fetches the bundled SVG for `char`, extracts strokes in order, and draws
// them one by one. Upcoming strokes show faint as tracing guides.
const cache = new Map(); // hex -> string[] (path data, document order)
const STEP_MS = 550;

function hexOf(char) {
  return char.codePointAt(0).toString(16).padStart(5, '0');
}

async function loadStrokes(char) {
  const hex = hexOf(char);
  if (cache.has(hex)) return cache.get(hex);
  const res = await fetch(`/kanjivg/${hex}.svg`);
  if (!res.ok) throw new Error(`no stroke data for ${char}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  // KanjiVG master files carry one <path kvg:type="…"> per stroke in
  // document (stroke) order. Fall back to per-stroke <g> groups.
  const direct = Array.from(doc.getElementsByTagName('path')).filter((p) =>
    p.getAttribute('kvg:type'),
  );
  let strokes = direct.map((p) => p.getAttribute('d'));
  if (strokes.length === 0) {
    const groups = Array.from(doc.getElementsByTagName('g')).filter((g) =>
      g.getAttribute('kvg:type'),
    );
    strokes = groups.flatMap((g) =>
      Array.from(g.getElementsByTagName('path')).map((p) => p.getAttribute('d')),
    );
  }
  strokes = strokes.filter(Boolean);
  if (strokes.length === 0) throw new Error(`no strokes parsed for ${char}`);
  cache.set(hex, strokes);
  return strokes;
}

export default function StrokeOrder({ char }) {
  const [strokes, setStrokes] = useState(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0); // float 0..n
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const progressRef = useRef(0);

  // (Re)load on character change, autoplay from the start.
  useEffect(() => {
    let cancelled = false;
    setStrokes(null);
    setError(false);
    setProgress(0);
    progressRef.current = 0;
    setPlaying(false);
    loadStrokes(char)
      .then((s) => {
        if (cancelled) return;
        setStrokes(s);
        setPlaying(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [char]);

  // rAF driver: advance progress while playing.
  useEffect(() => {
    if (!playing || !strokes) return;
    let last = null;
    const tick = (t) => {
      if (last == null) last = t;
      const dt = t - last;
      last = t;
      const next = Math.min(strokes.length, progressRef.current + dt / STEP_MS);
      progressRef.current = next;
      setProgress(next);
      if (next >= strokes.length) {
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, strokes]);

  if (error) {
    return <p className="muted" style={{ fontSize: '0.85rem' }}>Stroke data unavailable.</p>;
  }
  if (!strokes) {
    return <p className="muted" style={{ fontSize: '0.85rem' }}>Loading strokes…</p>;
  }

  const n = strokes.length;
  const doneCount = Math.floor(progress);
  const frac = progress - doneCount;
  const finished = progress >= n;

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(n, i));
    progressRef.current = clamped;
    setProgress(clamped);
    setPlaying(false);
  };

  const replay = () => {
    goTo(0);
    setPlaying(true);
  };

  // Step back to the start of the stroke currently (or last) drawn.
  const goPrev = () => goTo(Math.ceil(progressRef.current) - 1);

  return (
    <div>
      <div style={{ width: '100%', maxWidth: 220, aspectRatio: '1 / 1' }}>
      <svg
        viewBox="0 0 109 109"
        role="img"
        aria-label={`Stroke order for ${char}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {strokes.map((d, i) => {
          const isDone = i < doneCount;
          const isCurrent = i === doneCount && !finished;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={isDone || isCurrent ? 'var(--heading)' : 'var(--muted)'}
              strokeWidth={isDone || isCurrent ? 3.5 : 2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isDone || isCurrent ? 1 : 0.25}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={isDone ? 0 : isCurrent ? 1 - frac : 1}
            />
          );
        })}
      </svg>
      </div>
      <p className="muted" style={{ fontSize: '0.8rem', margin: '0.35rem 0 0.5rem' }}>
        Stroke {Math.min(n, doneCount + (finished ? 0 : 1))} of {n}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {playing ? (
          <button className="btn" style={smallBtn} onClick={() => setPlaying(false)}>Pause</button>
        ) : (
          <button className="btn" style={smallBtn} onClick={() => (finished ? replay() : setPlaying(true))}>
            {finished ? 'Replay' : progress > 0 ? 'Resume' : 'Play'}
          </button>
        )}
        <button className="btn" style={smallBtn} onClick={goPrev} disabled={progress <= 0}>
          ← Prev
        </button>
        <button className="btn" style={smallBtn} onClick={() => goTo(Math.min(n, doneCount + 1))} disabled={finished}>
          Next →
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.72rem', margin: '0.6rem 0 0' }}>
        Strokes: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">KanjiVG</a> (CC BY-SA)
      </p>
    </div>
  );
}

const smallBtn = { padding: '0.3rem 0.7rem', fontSize: '0.78rem' };
