'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuizCard from '@/components/QuizCard';
import AudioButton from '@/components/AudioButton';
import { Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const TYPES = ['mixed', 'vocabulary', 'kanji'];
const COUNTS = [5, 10, 15, 20];

function QuizContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'mixed';
  const initialSelected = searchParams.get('selected_only') === 'true';

  const [phase, setPhase] = useState('setup'); // 'setup' | 'quiz' | 'results'
  const [quizType, setQuizType] = useState(initialType);
  const [count, setCount] = useState(10);
  const [selectedOnly, setSelectedOnly] = useState(initialSelected);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    setQuizType(searchParams.get('type') || 'mixed');
    setSelectedOnly(searchParams.get('selected_only') === 'true');
  }, [searchParams]);

  async function startQuiz() {
    setLoading(true);
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_type: quizType, count, selected_only: selectedOnly }),
    });
    const data = await res.json();
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
      <div className="mb-6">
        <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>小テスト</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Quiz</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Test your knowledge with multiple choice questions</p>
      </div>

      {phase === 'setup' && (
        <div className="max-w-md">
          <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-3" style={{ color: 'var(--text-3)' }}>Quiz Type</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setQuizType(t)}
                    className="py-3 px-3 rounded-lg text-sm font-semibold capitalize transition-all"
                    style={{
                      background: quizType === t ? 'rgba(255,0,128,0.1)' : 'var(--bg-elevated)',
                      border: `1px solid ${quizType === t ? 'var(--pink)' : 'var(--border)'}`,
                      color: quizType === t ? 'var(--pink)' : 'var(--text-2)'
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-3" style={{ color: 'var(--text-3)' }}>Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTS.map((c) => (
                  <button key={c} onClick={() => setCount(c)}
                    className="py-3 px-3 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: count === c ? 'rgba(255,0,128,0.1)' : 'var(--bg-elevated)',
                      border: `1px solid ${count === c ? 'var(--pink)' : 'var(--border)'}`,
                      color: count === c ? 'var(--pink)' : 'var(--text-2)'
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {['vocabulary', 'kanji'].includes(quizType) && (
              <label className="flex items-center gap-3 cursor-pointer mt-4 p-3 rounded-lg transition-colors hover:bg-white/5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  checked={selectedOnly}
                  onChange={(e) => setSelectedOnly(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--pink)' }}
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Quiz Selected Items Only</span>
              </label>
            )}

            <button onClick={startQuiz} disabled={loading}
              className="w-full py-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--text-1)', color: 'var(--bg-base)', opacity: loading ? 0.7 : 1 }}>
              <Trophy size={16} />
              {loading ? 'Starting…' : 'Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {phase === 'quiz' && questions[qIndex] && (
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
      )}

      {phase === 'results' && (
        <div className="max-w-xl mx-auto">
          <div className="rounded-xl p-8 text-center mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="font-japanese text-6xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>{score}<span className="text-3xl">点</span></p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{correctCount} / {answers.length} correct</p>
            <p className="text-sm font-semibold mt-2" style={{ color: score >= 70 ? '#44ddaa' : '#ff3c50' }}>
              {score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
            </p>
          </div>

          {/* Answer review */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
            <div className="px-5 py-3" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Answer Review</p>
            </div>
            <div style={{ background: 'var(--bg-surface)' }}>
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < answers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {a.wasCorrect
                    ? <CheckCircle size={14} style={{ color: '#44ddaa', flexShrink: 0 }} />
                    : <XCircle size={14} style={{ color: '#ff3c50', flexShrink: 0 }} />}
                  <span className="font-japanese text-sm font-medium" style={{ color: 'var(--text-1)' }}>{a.prompt}</span>
                  <span className="font-japanese text-xs ml-auto" style={{ color: 'var(--text-3)' }}>{a.correct_answer}</span>
                  <AudioButton text={a.prompt} className="ml-2 opacity-50 hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={startQuiz}
              className="flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'var(--text-1)', color: 'var(--bg-base)' }}
            >
              <RotateCcw size={14} /> Retry
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 py-3 rounded-lg font-semibold text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center p-8"><span className="text-xl text-[var(--accent)] text-center animate-pulse">Loading quiz environment...</span></div>}>
      <QuizContent />
    </Suspense>
  );
}
