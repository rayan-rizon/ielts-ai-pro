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

  const statItems = [
    {
      icon: BookOpen,
      value: displayLimit,
      shortValue: displayLimit,
      label: 'Saved Words',
      shortLabel: 'Saved',
      iconStyle:
        'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70 dark:bg-indigo-500/15 dark:text-indigo-300',
    },
    {
      icon: Target,
      value: stats.masteredWords,
      shortValue: stats.masteredWords,
      label: 'Mastered',
      shortLabel: 'Mastered',
      iconStyle:
        'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      icon: Clock,
      value: dueCount,
      shortValue: dueCount,
      label: 'Due Today',
      shortLabel: 'Due',
      urgent: dueCount > 0,
      iconStyle:
        dueCount > 0
          ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400',
    },
    {
      icon: Flame,
      value: `${stats.streak} Days`,
      shortValue: `${stats.streak}d`,
      label: 'Streak',
      shortLabel: 'Streak',
      iconStyle:
        'bg-amber-50 text-amber-600 ring-1 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300',
    },
    {
      icon: Trophy,
      value: 'Band 8.0+',
      shortValue: '8.0+',
      label: 'Goal',
      shortLabel: 'Goal',
      iconStyle:
        'bg-violet-50 text-violet-600 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300',
    },
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-5 w-full xl:w-auto xl:flex xl:flex-nowrap items-center justify-between gap-1 sm:gap-2.5 py-1',
        className
      )}
    >
      {statItems.map((stat, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -2, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2.5 px-1 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-2xl border border-[#e0e4f1] bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] shadow-xs transition-all duration-200 hover:border-[#6570ee]/40 hover:shadow-md cursor-default dark:border-white/10 dark:from-[#10131f] dark:to-[#10131f] min-w-0"
        >
          <div
            className={cn(
              'w-5 h-5 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-md sm:rounded-xl flex items-center justify-center shrink-0 shadow-xs',
              stat.iconStyle
            )}
          >
            <stat.icon
              className={cn(
                'w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5',
                stat.urgent && 'animate-pulse'
              )}
            />
          </div>

          <div className="flex flex-col min-w-0 text-center sm:text-left overflow-hidden w-full">
            <span className="text-[13px] xs:text-[14px] sm:text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              <span className="sm:hidden">{stat.shortValue || stat.value}</span>
              <span className="hidden sm:inline">{stat.value}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-none truncate">
              <span className="sm:hidden">{stat.shortLabel || stat.label}</span>
              <span className="hidden sm:inline">{stat.label}</span>
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
