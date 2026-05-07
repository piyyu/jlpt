'use client';

import { useState } from 'react';
import QuizCard from '@/components/QuizCard';
import { Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

const TYPES = ['mixed', 'vocabulary', 'kanji', 'grammar'];
const COUNTS = [5, 10, 15, 20];

export default function QuizPage() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'quiz' | 'results'
  const [quizType, setQuizType] = useState('mixed');
  const [count, setCount] = useState(10);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function startQuiz() {
    setLoading(true);
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_type: quizType, count }),
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
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Quiz</h1>
        <p className="text-sm text-zinc-500 mt-1">Test your knowledge with multiple choice questions</p>
      </div>

      {phase === 'setup' && (
        <div className="max-w-sm">
          <div className="card p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-2">Quiz Type</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setQuizType(t)}
                    className={`py-2 px-3 rounded-lg text-sm capitalize border transition-colors ${quizType === t ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-2">Number of Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTS.map((c) => (
                  <button key={c} onClick={() => setCount(c)}
                    className={`py-2 px-3 rounded-lg text-sm border transition-colors ${count === c ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startQuiz} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <Trophy size={14} />
              {loading ? 'Starting…' : 'Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {phase === 'quiz' && questions[qIndex] && (
        <QuizCard
          prompt={questions[qIndex].prompt}
          hint={questions[qIndex].hint}
          options={questions[qIndex].options}
          correctAnswer={questions[qIndex].correct_answer}
          onAnswer={handleAnswer}
          index={qIndex + 1}
          total={questions.length}
        />
      )}

      {phase === 'results' && (
        <div className="max-w-xl mx-auto">
          <div className="card p-8 text-center mb-6">
            <p className="text-5xl font-semibold text-zinc-900 mb-1">{score}%</p>
            <p className="text-zinc-500 text-sm">{correctCount} / {answers.length} correct</p>
            <p className={`text-sm font-medium mt-2 ${score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
              {score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good job!' : '📚 Keep studying!'}
            </p>
          </div>

          {/* Answer review */}
          <div className="card overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-zinc-100">
              <p className="text-sm font-medium text-zinc-900">Answer Review</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  {a.wasCorrect
                    ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                    : <XCircle size={14} className="text-red-500 shrink-0" />}
                  <span className="font-japanese text-sm text-zinc-800">{a.prompt}</span>
                  <span className="text-xs text-zinc-400 ml-auto">{a.correct_answer}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={startQuiz} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Retry
            </button>
            <button onClick={() => setPhase('setup')} className="btn-secondary flex-1">New Quiz</button>
          </div>
        </div>
      )}
    </div>
  );
}
