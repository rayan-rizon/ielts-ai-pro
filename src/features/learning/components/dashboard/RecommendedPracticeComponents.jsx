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
            'w-full text-left bg-slate-50/50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08]',
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
        'text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/5',
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
        'w-full text-left bg-slate-50/50 dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] transition-all duration-200 group',
        'hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/5 dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.12)]',
        compact && 'p-3'
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <h4
          className={cn(
            'font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors duration-200',
            compact ? 'text-xs' : 'text-[11px]'
          )}
        >
          {formatTaskTitle(item.title)}
        </h4>
        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors duration-200 shrink-0 mt-0.5" />
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
          ? 'p-4 sm:p-5 md:p-6 border-t-2 border-t-slate-300/60 dark:border-t-slate-700/70'
          : 'p-4 sm:p-5 md:p-8 border-t-2 border-t-slate-300/60 dark:border-t-slate-700/70',
        className
      )}
    >
      <div className={cn('flex items-center gap-3', compact ? 'mb-4' : 'mb-5')}>
        <div className="w-9 h-9 rounded-2xl bg-slate-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-slate-600/70 dark:text-slate-300/70" />
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
