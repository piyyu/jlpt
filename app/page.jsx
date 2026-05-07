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
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'var(--text-3)' }}>
        読み込み中…
      </div>
    );
  }

  const { streak, dueToday, reviewedToday, timeStudiedMinutes, progress, recentQuizzes, lastMockTest } = data;

  return (
    <div>
      {/* Hero header */}
      <div className="mb-8">
        <div className="flex items-end gap-4">
          <div>
            <p className="font-japanese text-xs tracking-widest mb-1" style={{ color: 'var(--pink)' }}>
              日本語能力試験 N5
            </p>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
              ダッシュボード
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Dashboard — study progress overview</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Flame size={16} />} label="連続学習" en="Streak" value={`${streak}日`} />
        <StatCard icon={<RotateCcw size={16} />} label="本日の復習" en="Due Today" value={dueToday} accent={dueToday > 0} />
        <StatCard icon={<Trophy size={16} />} label="今日完了" en="Reviewed" value={reviewedToday} />
        <StatCard icon={<Clock size={16} />} label="今週の学習" en="This Week" value={`${timeStudiedMinutes}分`} />
      </div>

      {/* CTA */}
      {dueToday > 0 && (
        <div
          className="rounded-lg p-5 mb-6 flex items-center justify-between"
          style={{
            background: 'rgba(255,0,128,0.06)',
            border: '1px solid rgba(255,0,128,0.2)',
          }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              <span style={{ color: 'var(--pink)' }}>{dueToday}枚</span> のカードが復習待ちです
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Keep your streak going — start now!
            </p>
          </div>
          <Link href="/review" className="btn-primary shrink-0">
            復習開始 →
          </Link>
        </div>
      )}

      {/* Progress */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="section-title">進捗状況</h2>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Progress</span>
        </div>
        <div className="space-y-5">
          <ProgressBar label="単語 Vocabulary" value={progress.vocabulary.mastered} max={progress.vocabulary.total} colorClass="bg-pink-DEFAULT" />
          <ProgressBar label="漢字 Kanji"       value={progress.kanji.mastered}      max={progress.kanji.total}      colorClass="bg-purple-500" />
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
          習得済み = interval ≥ 21日
        </p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <QuickLink href="/vocabulary" jp="単語" label="Vocabulary" sub="100 words" />
        <QuickLink href="/kanji"      jp="漢字" label="Kanji"      sub="80 characters" />
        <QuickLink href="/quiz"       jp="試験" label="Quiz"       sub="Test yourself" />
        <QuickLink href="/grammar"    jp="文法" label="Grammar"    sub="20 patterns" />
        <QuickLink href="/listening"  jp="聴解" label="Listening"  sub="10 exercises" />
        <QuickLink href="/mock-test"  jp="模試" label="Mock Test"  sub="55 min exam" />
      </div>

      {/* Recent quizzes */}
      {recentQuizzes?.length > 0 && (
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="section-title">最近のクイズ</h2>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Recent Quizzes</span>
          </div>
          <div className="space-y-2">
            {recentQuizzes.map((q) => {
              const score = q.total_questions > 0
                ? Math.round((q.correct_answers / q.total_questions) * 100)
                : 0;
              return (
                <div key={q.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm capitalize" style={{ color: 'var(--text-2)' }}>{q.quiz_type} quiz</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{q.total_questions}問 · {new Date(q.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: score >= 70 ? '#44ddaa' : '#ff6666' }}>{score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last mock test */}
      {lastMockTest && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="section-title">前回の模擬試験</h2>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>Last Mock Test</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '単語', en: 'Vocab',     score: lastMockTest.vocab_score },
              { label: '文法', en: 'Grammar',   score: lastMockTest.grammar_score },
              { label: '読解', en: 'Reading',   score: lastMockTest.reading_score },
              { label: '聴解', en: 'Listening', score: lastMockTest.listening_score },
            ].map(({ label, en, score }) => (
              <div key={en} className="text-center">
                <p className="font-japanese text-base" style={{ color: 'var(--text-3)' }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: score >= 60 ? '#44ddaa' : '#ff6666' }}>{score}%</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{en}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, en, value, accent = false }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: accent ? 'rgba(255,0,128,0.06)' : 'var(--bg-surface)',
        border: `1px solid ${accent ? 'rgba(255,0,128,0.25)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: accent ? 'var(--pink)' : 'var(--text-3)' }}>{icon}</span>
        <span className="font-japanese text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold font-japanese tracking-tight" style={{ color: accent ? 'var(--pink)' : 'var(--text-1)' }}>
        {value}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{en}</p>
    </div>
  );
}

function QuickLink({ href, jp, label, sub }) {
  return (
    <Link
      href={href}
      className="rounded-lg p-4 block transition-all group"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,0,128,0.3)';
        e.currentTarget.style.background = 'rgba(255,0,128,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-surface)';
      }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-japanese text-xl font-bold" style={{ color: 'var(--pink)' }}>{jp}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</p>
    </Link>
  );
}
