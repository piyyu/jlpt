import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'JLPT N5 Study App',
  description: 'Complete JLPT N5 Japanese study app with SRS, quizzes, grammar, kanji, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 md:ml-0">
            {/* Mobile top padding for hamburger */}
            <div className="md:hidden h-14" />
            <div className="max-w-5xl mx-auto px-4 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
