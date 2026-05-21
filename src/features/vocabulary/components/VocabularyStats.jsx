import React from 'react';
import { BookOpen, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Vocabulary Stats Bar Component
 * Displays total words, mastered count, and streak
 */
export default function VocabularyStats({ stats, wordLimit, className }) {
  const displayLimit =
    wordLimit === Infinity ? stats.totalWords : `${stats.totalWords}/${wordLimit}`;

  const statItems = [
    {
      icon: BookOpen,
      value: displayLimit,
      label: 'WORDS',
      color: 'bg-indigo-50/80 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: Target,
      value: stats.masteredWords,
      label: 'MASTERED',
      color: 'bg-emerald-50/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Zap,
      value: stats.streak,
      label: 'STREAK',
      color: 'bg-amber-50/80 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      fill: true,
    },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl rounded-[24px] border border-slate-200/60 dark:border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]',
        className
      )}
      data-oid="qkg3lwo"
    >
      {statItems.map((stat, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-[18px] transition-all hover:scale-105 cursor-default flex-shrink-0 sm:flex-shrink',
            stat.color
          )}
          data-oid="6co:g:4"
        >
          <stat.icon
            className={cn('w-4 h-4 sm:w-5 sm:h-5', stat.fill && 'fill-current')}
            data-oid="-8:j:l1"
          />
          <div className="flex flex-col" data-oid="7bh9897">
            <span
              className="text-lg sm:text-xl font-black leading-none tracking-tight"
              data-oid="6wsel-5"
            >
              {stat.value}
            </span>
            <span
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-80 mt-0.5"
              data-oid="jq:xf6h"
            >
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
