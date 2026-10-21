'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';

const TYPES = ['mixed', 'vocabulary', 'kanji', 'grammar', 'mastery'];
const COUNTS = [5, 10, 15, 20];

function QuizContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'mixed';
  const initialSelected = searchParams.get('selected_only') === 'true';

  const [phase, setPhase] = useState('setup');
  const [quizType, setQuizType] = useState(TYPES.includes(initialType) ? initialType : 'mixed');
  const [count, setCount] = useState(10);
  const [selectedOnly, setSelectedOnly] = useState(initialSelected);
  const [masteredOnly, setMasteredOnly] = useState(initialType === 'mastery');
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [masteredCounts, setMasteredCounts] = useState({ vocabulary: 0, kanji: 0 });
  const [error, setError] = useState('');

  const isMastery = quizType === 'mastery' || masteredOnly;
  const isPractice = isMastery;

  useEffect(() => {
    const t = searchParams.get('type') || 'mixed';
    setQuizType(TYPES.includes(t) ? t : 'mixed');
    setSelectedOnly(searchParams.get('selected_only') === 'true');
    if (t === 'mastery') setMasteredOnly(true);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/quiz/mastered-counts').then((r) => r.json()).then((d) => {
      if (d && typeof d === 'object') setMasteredCounts(d);
    }).catch(() => {});
  }, []);

  async function startQuiz() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz_type: quizType,
        count,
        selected_only: selectedOnly && !isMastery,
        mastered_only: isMastery,
      }),
    });
    const data = await res.json();
    if (!data.questions || data.questions.length === 0) {
      setError(
        isMastery
          ? `No mastered words yet (need interval ≥21 days, 3+ reps). Mastered: ${data.masteredCounts?.vocabulary ?? masteredCounts.vocabulary} vocab / ${data.masteredCounts?.kanji ?? masteredCounts.kanji} kanji.`
          : (selectedOnly
            ? 'Your review deck is empty — tick the words you want to study first.'
            : 'No questions available for this filter.')
      );
      setLoading(false);
      return;
    }
    setMasteredCounts(data.masteredCounts || masteredCounts);
    setSessionId(data.session_id);
    setQuestions(data.questions);
    setQIndex(0);
    setAnswers([]);
    setPhase('quiz');
    setLoading(false);
  }

  async function handleAnswer(wasCorrect) {
    const q = questions[qIndex];
    await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        content_type: q.content_type,
        content_id: q.content_id,
        was_correct: wasCorrect,
        practice: isPractice,
      }),
    });
    const newAnswers = [...answers, { ...q, wasCorrect }];
    setAnswers(newAnswers);
    if (qIndex + 1 >= questions.length) {
      setPhase('results');
    } else {
      setQIndex(qIndex + 1);
    }
  }

  const correctCount = answers.filter((a) => a.wasCorrect).length;
  const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>Quiz</h1>

      {phase === 'setup' && (
        <div>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.35rem' }}>Type</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {TYPES.map((t) => (
              <button
                key={t}
                className="btn"
                aria-pressed={quizType === t}
                onClick={() => { setQuizType(t); if (t === 'mastery') setMasteredOnly(true); }}
                style={quizType === t
                  ? { borderColor: 'var(--accent)', color: 'var(--heading)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
                  : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
              >
                {t}
              </button>
            ))}
          </div>
          {isMastery && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Mastery practice — mastered words only, anytime. Doesn&apos;t touch
              SRS, weak points, or streaks. Available: {masteredCounts.vocabulary ?? 0} vocab / {masteredCounts.kanji ?? 0} kanji.
            </p>
          )}
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.35rem' }}>Questions:</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {COUNTS.map((c) => (
              <button
                key={c}
                className="btn"
                aria-pressed={count === c}
                onClick={() => setCount(c)}
                style={count === c
                  ? { borderColor: 'var(--accent)', color: 'var(--heading)', padding: '0.35rem 0.8rem', fontSize: '0.82rem' }
                  : { padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
              >
                {c}
              </button>
            ))}
          </div>
          {['vocabulary', 'kanji', 'grammar', 'mixed'].includes(quizType) && (
            <p style={{ fontSize: '0.85rem' }}>
              <label>
                <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} /> selected only
              </label>
              <br />
              <label>
                <input type="checkbox" checked={masteredOnly} onChange={(e) => setMasteredOnly(e.target.checked)} /> mastered only (isolated)
              </label>
            </p>
          )}
          {error && <p>✗ {error}</p>}
          <p>
            <button className="btn btn-solid" onClick={startQuiz} disabled={loading}>
              {loading ? 'Starting…' : isPractice ? 'Start practice' : 'Start quiz'}
            </button>
          </p>
        </div>
      )}

      {phase === 'quiz' && questions[qIndex] && (
        <div>
          {isPractice && (
            <p className="muted" style={{ fontSize: '0.8rem' }}>Practice mode — results won&apos;t change SRS or weak points.</p>
          )}
          <QuizCard
            key={qIndex}
            prompt={questions[qIndex].prompt}
            hint={questions[qIndex].hint}
            options={questions[qIndex].options}
            correctAnswer={questions[qIndex].correct_answer}
            onAnswer={handleAnswer}
            index={qIndex + 1}
            total={questions.length}
            details={questions[qIndex].details}
            content_type={questions[qIndex].content_type}
          />
        </div>
      )}

      {phase === 'results' && (
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{score}点</h1>
          <p>{correctCount} / {answers.length} correct. {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep studying!'}</p>
          {isPractice && <p className="muted" style={{ fontSize: '0.85rem' }}>Practice run — SRS untouched.</p>}
          <table>
            <tbody>
              {answers.map((a, i) => (
                <tr key={i}>
                  <td className={a.wasCorrect ? 'is-correct' : 'is-wrong'}>{a.wasCorrect ? '✓' : '✗'}</td>
                  <td className="font-japanese">{a.prompt}</td>
                  <td className="muted font-japanese">{a.correct_answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <button className="btn" onClick={startQuiz}>Retry</button>{' '}
            <button className="btn" onClick={() => setPhase('setup')}>New quiz</button>
          </p>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <QuizContent />
    </Suspense>
  );
}
