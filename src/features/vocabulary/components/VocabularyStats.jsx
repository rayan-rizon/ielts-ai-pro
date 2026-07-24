import React from 'react';
import { BookOpen, Target, Clock, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Top-Right Header Stats Component
 * Displays compact, high-contrast stats on the right side of the page header.
 */
export default function VocabularyStats({ stats, wordLimit, dueCount = 0, className }) {
  const displayLimit =
    wordLimit === Infinity ? stats.totalWords : `${stats.totalWords}/${wordLimit}`;

  const masteredPercent =
    stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0;

  const statItems = [
    {
      icon: BookOpen,
      value: displayLimit,
      label: 'Saved Words',
      sub: `${masteredPercent}% mastered`,
      iconBg:
        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60',
      cardBg: 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
    },
    {
      icon: Target,
      value: stats.masteredWords,
      label: 'Mastered',
      sub: 'Band 8.0+',
      iconBg:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60',
      cardBg: 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
    },
    {
      icon: Clock,
      value: dueCount,
      label: 'Due Today',
      sub: dueCount > 0 ? 'Review ready' : 'Up to date',
      urgent: dueCount > 0,
      iconBg:
        dueCount > 0
          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border-rose-300 dark:border-rose-800'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      cardBg:
        dueCount > 0
          ? 'bg-rose-50/60 border-rose-200/90 dark:bg-rose-950/30 dark:border-rose-900/50'
          : 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
    },
    {
      icon: Flame,
      value: `${stats.streak} Days`,
      label: 'Streak',
      sub: 'Active',
      iconBg:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
      cardBg: 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
    },
    {
      icon: Trophy,
      value: 'Band 8.0+',
      label: 'Goal',
      sub: 'Target Score',
      iconBg:
        'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60',
      cardBg: 'bg-white/95 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800',
    },
  ];

  return (
    <div
      className={cn('flex flex-wrap items-center justify-start xl:justify-end gap-2.5', className)}
    >
      {statItems.map((stat, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default',
            stat.cardBg
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105',
              stat.iconBg
            )}
          >
            <stat.icon className={cn('w-4 h-4', stat.urgent && 'animate-pulse')} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                {stat.value}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-none">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
