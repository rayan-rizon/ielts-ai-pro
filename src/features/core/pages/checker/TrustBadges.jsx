import React from 'react';
import { BarChart3, ShieldCheck, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

const BADGES = [
  [
    Zap,
    'Instant Results',
    'Get your estimated band score and feedback in seconds.',
    'text-violet-600 dark:text-violet-400',
    'bg-violet-50 dark:bg-violet-500/15',
  ],
  [
    Target,
    'Band-Focused Feedback',
    'Aligned with official IELTS band descriptors to help you improve.',
    'text-emerald-600 dark:text-emerald-400',
    'bg-emerald-50 dark:bg-emerald-500/15',
  ],
  [
    BarChart3,
    'Track Your Progress',
    'Check your writing regularly and see consistent improvement.',
    'text-blue-600 dark:text-blue-400',
    'bg-blue-50 dark:bg-blue-500/15',
  ],
  [
    ShieldCheck,
    '100% Free to Use',
    'Powerful AI feedback at no cost. Upgrade anytime for more.',
    'text-amber-600 dark:text-amber-400',
    'bg-amber-50 dark:bg-amber-500/15',
  ],
];

export default function TrustBadges() {
  return (
    <section className="border-y border-slate-100/80 bg-slate-50/30 py-6 sm:py-8 dark:border-white/[0.07] dark:bg-white/[0.02]">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {BADGES.map(([Icon, title, text, iconColor, iconBgColor]) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.04)] hover:border-slate-200/60 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:shadow-none dark:hover:shadow-none dark:hover:border-white/[0.15]"
          >
            <div
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-full',
                iconBgColor,
                iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-extrabold text-[#0d1740] dark:text-white leading-snug">
                {title}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
