'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProgressBar from '@/components/ProgressBar';
import { RotateCcw, Trophy, Flame, Clock, BookOpen, Square } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        Loading…
      </div>
    );
  }

  const { streak, dueToday, reviewedToday, timeStudiedMinutes, progress, recentQuizzes, lastMockTest } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">JLPT N5 study progress overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Flame size={18} className="text-orange-500" />}
          label="Study Streak"
          value={`${streak} day${streak !== 1 ? 's' : ''}`}
        />
        <StatCard
          icon={<RotateCcw size={18} className="text-blue-500" />}
          label="Due Today"
          value={dueToday}
          accent={dueToday > 0}
        />
        <StatCard
          icon={<Trophy size={18} className="text-green-500" />}
          label="Reviewed Today"
          value={reviewedToday}
        />
        <StatCard
          icon={<Clock size={18} className="text-zinc-400" />}
          label="This Week"
          value={`${timeStudiedMinutes}m`}
        />
      </div>

      {/* Start Review CTA */}
      {dueToday > 0 && (
        <div className="card p-5 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              You have <span className="text-zinc-900 font-semibold">{dueToday} cards</span> due for review
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Keep your streak going — review now!</p>
          </div>
          <Link href="/review" className="btn-primary shrink-0">
            Start Review
          </Link>
        </div>
      )}

      {/* Progress section */}
      <div className="card p-6 mb-8">
        <h2 className="section-title mb-5">Section Progress</h2>
        <div className="space-y-5">
          <ProgressBar
            label="Vocabulary"
            value={progress.vocabulary.mastered}
            max={progress.vocabulary.total}
            colorClass="bg-blue-500"
          />
          <ProgressBar
            label="Kanji"
            value={progress.kanji.mastered}
            max={progress.kanji.total}
            colorClass="bg-purple-500"
          />
        </div>
        <p className="text-xs text-zinc-400 mt-4">
          Mastered = cards with interval ≥ 21 days
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <QuickLink href="/vocabulary" icon={<BookOpen size={16} />} label="Vocabulary" sub="100 words" />
        <QuickLink href="/kanji" icon={<Square size={16} />} label="Kanji" sub="80 characters" />
        <QuickLink href="/quiz" icon={<Trophy size={16} />} label="Quiz" sub="Test yourself" />
        <QuickLink href="/grammar" icon={<BookOpen size={16} />} label="Grammar" sub="20 patterns" />
        <QuickLink href="/listening" icon={<RotateCcw size={16} />} label="Listening" sub="10 exercises" />
        <QuickLink href="/mock-test" icon={<Clock size={16} />} label="Mock Test" sub="55 min exam" />
      </div>

      {/* Recent quizzes */}
      {recentQuizzes?.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Recent Quizzes</h2>
          <div className="space-y-2">
            {recentQuizzes.map((q) => {
              const score = q.total_questions > 0
                ? Math.round((q.correct_answers / q.total_questions) * 100)
                : 0;
              return (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="text-sm text-zinc-700 capitalize">{q.quiz_type} quiz</p>
                    <p className="text-xs text-zinc-400">{q.total_questions} questions · {new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-medium ${score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                    {score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last mock test */}
      {lastMockTest && (
        <div className="card p-6 mt-4">
          <h2 className="section-title mb-4">Last Mock Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCell label="Vocabulary" score={lastMockTest.vocab_score} />
            <ScoreCell label="Grammar" score={lastMockTest.grammar_score} />
            <ScoreCell label="Reading" score={lastMockTest.reading_score} />
            <ScoreCell label="Listening" score={lastMockTest.listening_score} />
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            Taken: {new Date(lastMockTest.taken_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className={`card p-4 ${accent ? 'border-blue-200' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-blue-600' : 'text-zinc-900'}`}>
        {value}
      </p>
    </div>
  );
}

function QuickLink({ href, icon, label, sub }) {
  return (
    <Link href={href} className="card p-4 hover:bg-zinc-50 transition-colors block">
      <div className="flex items-center gap-2 mb-1 text-zinc-600">{icon}<span className="text-sm font-medium text-zinc-900">{label}</span></div>
      <p className="text-xs text-zinc-400">{sub}</p>
    </Link>
  );
}

function ScoreCell({ label, score }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-semibold ${score >= 60 ? 'text-green-600' : 'text-red-500'}`}>{score}%</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
