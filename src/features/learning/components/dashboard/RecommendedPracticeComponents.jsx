import React from 'react';
import { m } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTaskTitle } from '../../utils/learningUtils';
import { GlassCard } from '@/features/learning/components/SharedComponents';

export function LoadingSkeleton({ compact }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-full text-left bg-white/70 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/70',
            compact && 'p-3'
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-4 w-[70%] rounded-full" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-3.5 w-full rounded-full mb-1.5" />
          <Skeleton className="h-3.5 w-[85%] rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyPracticeState({ compact }) {
  return (
    <div
      className={cn(
        'text-center space-y-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700',
        compact ? 'py-8' : 'py-10'
      )}
    >
      <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
      <div className={cn('mx-auto space-y-1', compact ? 'max-w-[220px]' : 'max-w-[240px]')}>
        <h4 className="text-sm font-black dark:text-white">No recommendations yet</h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Keep following your plan and we will suggest extra practice here when useful.
        </p>
      </div>
    </div>
  );
}

export function PracticeItem({ item, compact, onClick }) {
  return (
    <m.button
      type="button"
      whileHover={{ x: 5 }}
      onClick={() => onClick(item)}
      className={cn(
        'w-full text-left bg-white/70 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 shadow-md dark:shadow-slate-950/20 transition-all duration-300 group',
        'hover:scale-[1.01] hover:border-cyan-300 dark:hover:border-cyan-400/40 hover:bg-cyan-50/85 dark:hover:bg-cyan-500/15 hover:shadow-lg hover:shadow-cyan-500/10 dark:hover:shadow-[0_0_18px_rgba(6,182,212,0.18)]',
        compact && 'p-3.5'
      )}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h4
          className={cn(
            'font-black tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-800 dark:group-hover:text-cyan-200 transition-colors duration-200',
            compact ? 'text-xs' : 'text-[11px]'
          )}
        >
          {formatTaskTitle(item.title)}
        </h4>
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-200 transition-colors duration-200 shrink-0 mt-0.5" />
      </div>
      <p
        className={cn(
          'leading-relaxed text-slate-500 dark:text-slate-400 font-medium line-clamp-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-200',
          compact ? 'text-[11px]' : 'text-[10px]'
        )}
      >
        {formatTaskTitle(item.description || item.reason)}
      </p>
    </m.button>
  );
}

export function RecommendedPracticeLoading({ compact, className }) {
  return (
    <GlassCard
      className={cn(
        compact
          ? 'p-4 sm:p-5 border-t-2 border-t-cyan-400/40'
          : 'p-4 sm:p-5 md:p-7 border-t-2 border-t-cyan-400/40',
        className
      )}
    >
      <div className={cn('flex items-center gap-3', compact ? 'mb-4' : 'mb-5')}>
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cyan-700/80 dark:text-cyan-300/80" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44 rounded-full" />
          <Skeleton className="h-3.5 w-52 rounded-full" />
        </div>
      </div>
      <LoadingSkeleton compact={compact} />
    </GlassCard>
  );
}
