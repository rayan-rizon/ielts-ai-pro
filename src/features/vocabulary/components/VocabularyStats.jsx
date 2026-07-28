import React from 'react';
import { motion } from 'framer-motion';
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
      iconStyle:
        'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300',
    },
    {
      icon: Target,
      value: stats.masteredWords,
      label: 'Mastered',
      sub: 'Band 8.0+',
      iconStyle:
        'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      icon: Clock,
      value: dueCount,
      label: 'Due Today',
      sub: dueCount > 0 ? 'Review ready' : 'Up to date',
      urgent: dueCount > 0,
      iconStyle:
        dueCount > 0
          ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
    },
    {
      icon: Flame,
      value: `${stats.streak} Days`,
      label: 'Streak',
      sub: 'Active',
      iconStyle:
        'bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300',
    },
    {
      icon: Trophy,
      value: 'Band 8.0+',
      label: 'Goal',
      sub: 'Target Score',
      iconStyle:
        'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300',
    },
  ];

  return (
    <div
      className={cn('flex flex-wrap items-center justify-start xl:justify-end gap-2.5', className)}
    >
      {statItems.map((stat, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border border-[#e0e4f1] bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] shadow-xs transition-all duration-200 hover:border-[#6570ee]/40 hover:shadow-md cursor-default dark:border-white/10 dark:from-[#10131f] dark:to-[#10131f]"
        >
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
              stat.iconStyle
            )}
          >
            <stat.icon className={cn('w-4.5 h-4.5', stat.urgent && 'animate-pulse')} />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
              {stat.value}
            </span>
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 mt-1 leading-none">
              {stat.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
