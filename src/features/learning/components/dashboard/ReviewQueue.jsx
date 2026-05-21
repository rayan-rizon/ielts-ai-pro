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
      <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-indigo-500/30', className)}>
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
    <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-indigo-500/30', className)}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/5">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Review Queue
            </h2>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Short reviews to protect your progress
            </div>
          </div>
        </div>
        <Badge className="bg-indigo-500/10 text-indigo-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest">
          {dueReviewSkills.length || 0} DUE
        </Badge>
      </div>

      {!dueReviewSkills.length ? (
        <div className="py-10 text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold max-w-[220px] mx-auto leading-relaxed">
            No reviews are due right now. Keep practicing and we will schedule your next review
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all group text-left"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    {module}
                  </div>
                  <div className="text-xs font-black dark:text-white truncate">{s.skill_name}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[8px] h-5 px-2 rounded-full font-black">
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
            className="w-full rounded-2xl border-primary/20 hover:bg-primary/5 text-primary font-black text-xs h-11"
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
