import './globals.css';
import AppSidebar from '@/components/AppSidebar';

export const metadata = {
  title: 'Kotoba',
  description: 'Kotoba: minimal JLPT N5 vocabulary and kanji study with spaced repetition.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kotoba-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <AppSidebar />
        <main className="app-main">
          <div className="app-main-inner">{children}</div>
        </main>
      </body>
    </html>
  );
}
