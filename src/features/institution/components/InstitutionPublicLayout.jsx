import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Logo } from '@/components/shared/Logo';

export default function InstitutionPublicLayout({ children }) {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#f8f8fb] text-slate-800 dark:bg-[#070913] dark:text-slate-100">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.25)_1px,transparent_0)] bg-size-[22px_22px] opacity-60 dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.06)_1px,transparent_0)] dark:opacity-30" />
      </div>
      <header className="relative z-20 border-b border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-[#100f15]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/institution/login"
            aria-label="IELTS Ai Pro Institution Portal"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          >
            <Logo size="sm" animated={false} />
            <span className="hidden items-center rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5a63df] sm:inline-flex dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.12] dark:text-[#bfc3ff]">
              Institution Portal
            </span>
          </Link>
          <nav
            aria-label="Institution entry"
            className="flex items-center gap-2 text-xs font-semibold"
          >
            {[
              ['/institution/login', 'Sign in'],
              ['/institution/apply', 'Request access'],
            ].map(([path, label]) => (
              <Link
                key={path}
                to={path}
                aria-current={location.pathname === path ? 'page' : undefined}
                className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] ${location.pathname === path ? 'border-[#5a63df]/25 bg-[#5a63df]/[0.08] text-[#5a63df] dark:border-[#8f97ff]/30 dark:text-[#bfc3ff]' : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/40 hover:bg-[#f7f6fd] dark:border-white/10 dark:bg-[#141319] dark:text-slate-300 dark:hover:bg-white/5'}`}
              >
                {label}
              </Link>
            ))}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-[#141319] dark:text-slate-400 dark:hover:bg-white/5"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="relative z-10 border-t border-[#e4e2f0]/80 py-4 text-[11px] text-slate-400 dark:border-white/[0.05] dark:text-slate-500">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} IELTS Ai Pro. All rights reserved.</span>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Enterprise & Academic Portal
          </span>
        </div>
      </footer>
    </div>
  );
}
