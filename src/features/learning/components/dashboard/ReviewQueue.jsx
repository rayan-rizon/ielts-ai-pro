import React from 'react';
import { Clock, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { getTodayIndex } from '@/features/learning/hooks/useLearningPathData';
import { cn } from '@/lib/cn';

export default function ReviewQueue({
  dueReviewSkills,
  setSelectedDayIndex,
  className,
  loading = false,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <GlassCard className={cn('p-4 sm:p-5 border-t-2 border-t-indigo-400/40', className)}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600/80" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-3.5 w-44 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-[70%] rounded-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-4 sm:p-5 border-t-2 border-t-indigo-400/40', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shadow-lg shadow-indigo-500/5 shrink-0">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Review Queue
            </h2>
            <div className="text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400">
              Short reviews to protect your progress
            </div>
          </div>
        </div>
        <Badge className="shrink-0 whitespace-nowrap rounded-full border border-indigo-200/70 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 text-[10px] font-black h-6 px-2.5 tracking-[0.08em]">
          {dueReviewSkills.length || 0} due
        </Badge>
      </div>

      {!dueReviewSkills.length ? (
        <div className="py-8 text-center space-y-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold max-w-[220px] mx-auto leading-relaxed">
            No reviews are due right now. Keep practicing and we will schedule your next review
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dueReviewSkills.map((s) => {
            const masteryPct = Math.round((Number(s.mastery) || 0) * 100);
            const module = s?.module || 'reading';
            return (
              <button
                key={s.skill_code}
                type="button"
                onClick={() =>
                  navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)))
                }
                className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-700/70 transition-all group text-left hover:border-indigo-300 dark:hover:border-indigo-400/40 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/15 hover:shadow-md hover:shadow-indigo-500/5"
              >
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-1">
                    {module}
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {s.skill_name}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200 border-0 text-[8px] h-5 px-2 rounded-full font-black">
                    DUE
                  </Badge>
                  <div className="text-[10px] font-black text-slate-700 dark:text-white">
                    {masteryPct}%
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </button>
            );
          })}

          <Button
            variant="outline"
            className="w-full rounded-2xl border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:hover:bg-indigo-400/15 dark:text-indigo-200 font-black text-xs h-10"
            onClick={() => {
              const first = dueReviewSkills[0];
              const module = first?.module || null;
              if (module) {
                navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)));
                return;
              }
              setSelectedDayIndex(getTodayIndex());
            }}
          >
            Start due review (10 min)
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
