import React from 'react';
import { BarChart3, ShieldCheck, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TILE, TITLE } from '@/features/dashboard/components/primitives';

const BADGES = [
  [
    Zap,
    'Instant Results',
    'Get your estimated band score and feedback in seconds.',
    'text-violet-600 dark:text-violet-400',
    'bg-violet-500/10 dark:bg-violet-500/15',
  ],
  [
    Target,
    'Band-Focused Feedback',
    'Aligned with official IELTS band descriptors to help you improve.',
    'text-emerald-600 dark:text-emerald-400',
    'bg-emerald-500/10 dark:bg-emerald-500/15',
  ],
  [
    BarChart3,
    'Track Your Progress',
    'Check your writing regularly and see consistent improvement.',
    'text-sky-600 dark:text-sky-400',
    'bg-sky-500/10 dark:bg-sky-500/15',
  ],
  [
    ShieldCheck,
    '100% Free to Use',
    'Powerful AI feedback at no cost. Upgrade anytime for more.',
    'text-amber-600 dark:text-amber-400',
    'bg-amber-500/10 dark:bg-amber-500/15',
  ],
];

export default function TrustBadges() {
  return (
    <section className="border-y border-[#e4e2f0] bg-[#f8f7fd]/40 py-5 sm:py-6 dark:border-white/[0.07] dark:bg-white/[0.015]">
      <div className="mx-auto grid max-w-7xl gap-3.5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {BADGES.map(([Icon, title, text, iconColor, iconBgColor]) => (
          <div key={title} className={cn(TILE, 'flex items-center gap-3.5 p-4')}>
            <div
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#e4e2f0] dark:border-white/10',
                iconBgColor,
                iconColor
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className={cn(TITLE, 'text-xs font-bold leading-snug')}>{title}</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
