'use client';

import { useState, useEffect, useCallback } from 'react';
import AudioButton from '@/components/AudioButton';
import Bar from '@/components/Bar';
import GrammarExamples from '@/components/GrammarExamples';
import { useSettings } from '@/lib/useSettings';
import { toRomaji } from '@/lib/toRomaji';

export default function QuizCard({
  prompt,
  hint,
  options = [],
  correctAnswer,
  onAnswer,
  index,
  total,
  details,
  content_type,
}) {
  const [selected, setSelected] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const answered = selected !== null;
  const { showRomaji } = useSettings();

  useEffect(() => {
    setSelected(null);
    setIsSaved(false);
  }, [prompt]);

  useEffect(() => {
    if (answered && details && content_type) {
      fetch(`/api/selections?type=${content_type}`)
        .then((r) => r.json())
        .then((ids) => setIsSaved(ids.includes(details.id)))
        .catch(() => { });
    }
  }, [answered, details, content_type]);

  async function toggleSelection(e) {
    e.stopPropagation();
    if (!details) return;
    const next = !isSaved;
    setIsSaved(next);
    await fetch('/api/selections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type, content_id: details.id, selected: next }),
    });
  }

  const handleSelect = useCallback(
    (option) => {
      if (answered) return;
      setSelected(option);
      if (!details) onAnswer(option === correctAnswer);
    },
    [answered, details, correctAnswer, onAnswer],
  );

  useEffect(() => {
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (answered && details && e.key === 'Enter') {
        onAnswer(selected === correctAnswer);
        setSelected(null);
        return;
      }
      if (!answered && options.length > 0) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < options.length) handleSelect(options[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, details, options, selected, correctAnswer, onAnswer, handleSelect]);

  return (
    <div>
      {index != null && total != null && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.35rem' }}>{index}/{total}</p>
          <Bar value={index - 1} max={total} />
        </div>
      )}

      <p className="jp-display" style={{ fontSize: content_type === 'vocabulary' ? '2rem' : '4.5rem', lineHeight: 1.25 }}>
        {prompt}
      </p>
      {hint && <p className="muted font-japanese">{hint}</p>}

      {!answered && <p className="muted" style={{ fontSize: '0.8rem' }}>Pick 1–{options.length}.</p>}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {options.map((option, i) => {
          let mark = '';
          let style = {};
          let cls = 'opt';
          if (answered) {
            if (option === correctAnswer) { mark = '✓ '; cls = 'opt is-correct'; }
            else if (option === selected) { mark = '✗ '; cls = 'opt is-wrong'; }
            else style = { opacity: 0.35 };
          }
          return (
            <button key={`${index}-${option}`} onClick={() => handleSelect(option)} disabled={answered} className={cls} style={style}>
              <span className="font-japanese">{mark}<span className="opt-index">{i + 1}.</span> {option}</span>
              {content_type === 'vocabulary' && answered && showRomaji && <span className="muted"> ({toRomaji(option)})</span>}
            </button>
          );
        })}
      </div>

      {answered && details && (
        <div className={`feedback ${selected === correctAnswer ? 'good' : 'bad'}`} style={{ marginTop: '1.25rem' }} aria-live="polite">
          <p>
            <span className="muted">Answer: </span>
            <span className="font-japanese"><strong>{correctAnswer}</strong></span>
            {content_type === 'vocabulary' && details.reading && (
              <span className="muted"> · {details.reading}{showRomaji ? ` (${toRomaji(details.reading)})` : ''} — {details.meaning}</span>
            )}
            {content_type === 'kanji' && (
              <span className="muted"> · {details.meaning}</span>
            )}
            {content_type === 'grammar' && (
              <span className="muted"> · {details.meaning}</span>
            )}
          </p>
          {content_type === 'grammar' && details.structure && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>Form: <span className="font-japanese">{details.structure}</span></p>
          )}
          {content_type === 'grammar' && details.source_url && (
            <p style={{ fontSize: '0.85rem' }}>
              <a href={details.source_url} target="_blank" rel="noreferrer">Read explanation →</a>
            </p>
          )}
          {content_type === 'grammar' && <GrammarExamples grammarId={details.id} />}
          {(details.example_jp || details.example_en || details.example_word1) && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              {details.example_jp || [details.example_word1, details.example_word2].filter(Boolean).join(' · ')}
              {details.example_en ? ` — ${details.example_en}` : ''}
            </p>
          )}
          {content_type === 'grammar' && showRomaji && details.example_romaji && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>{details.example_romaji}</p>
          )}
          <p style={{ fontSize: '0.85rem' }}>
            <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={toggleSelection}>
              {isSaved ? '[×] remove from review' : '[+] add to review'}
            </button>{' '}
            <AudioButton text={content_type === 'kanji' ? details.character : content_type === 'grammar' ? (details.example_jp || details.pattern) : details.japanese} />
          </p>
          <p>
            <button className="btn" onClick={() => { onAnswer(selected === correctAnswer); setSelected(null); }}>
              Next →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
