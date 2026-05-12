import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'KOTOBA — 言葉 JLPT N5',
  description: 'KOTOBA: a complete JLPT N5 Japanese study app with SRS, quizzes, grammar, kanji, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-1)', margin: 0 }}>
        <div className="flex min-h-screen relative">
          {/* Global Japanese decorative watermark */}
          <div
            aria-hidden="true"
            className="fixed bottom-0 right-0 pointer-events-none select-none font-japanese font-bold z-0"
            style={{
              fontSize: '260px',
              lineHeight: 1,
              color: 'rgba(255,0,128,0.03)',
              userSelect: 'none',
            }}
          >
            語
          </div>

          <Sidebar />

          <main className="flex-1 min-w-0 relative z-10 md:ml-[var(--sidebar-width)] transition-[margin] duration-300">
            {/* Mobile spacer */}
            <div className="md:hidden h-14" />
            <div className="max-w-5xl mx-auto px-5 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
