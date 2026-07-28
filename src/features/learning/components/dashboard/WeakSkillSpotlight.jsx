import React from 'react';
import { Target, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import { GlassCard } from '@/features/learning/components/SharedComponents';

export default function WeakSkillSpotlight({ spotlightSkills, className, loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-amber-500/30', className)}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500/80" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-3.5 w-48 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]"
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="space-y-2 min-w-0 flex-1">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-4 w-[65%] rounded-full" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full mb-3" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-[60%] rounded-full" />
                <Skeleton className="h-8 w-24 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-amber-500/30', className)}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Target className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight dark:text-white">
              Weak Skill Spotlight
            </h2>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Skills that can raise your score fastest
            </div>
          </div>
        </div>
        <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest">
          NEXT UP
        </Badge>
      </div>

      {!spotlightSkills.length ? (
        <div className="py-12 flex flex-col items-center text-center space-y-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transform -rotate-2">
            <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="max-w-[220px]">
            <h4 className="text-sm font-black dark:text-white mb-1">
              Skill priorities coming soon
            </h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Complete a few activities and we will show your top improvement skills here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {spotlightSkills.map((s) => {
            const masteryPct = Math.round((Number(s.mastery) || 0) * 100);
            const module = s?.module || 'reading';
            return (
              <div
                key={s.skill_code}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  s.is_due
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      {module}
                    </div>
                    <div className="text-sm font-black tracking-tight dark:text-white truncate">
                      {s.skill_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.is_due && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[8px] h-5 px-2 rounded-full font-black">
                        DUE
                      </Badge>
                    )}
                    <Badge className="bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white border-0 text-[10px] font-black h-6 px-3 rounded-full">
                      {masteryPct}%
                    </Badge>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      masteryPct >= 80 ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${masteryPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {s.why || 'Practice this skill next to close your current gap.'}
                  </div>
                  <Button
                    size="sm"
                    className="rounded-2xl h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                    onClick={() =>
                      navigate(
                        buildActivityUrl({
                          module,
                          skill_targets: [s.skill_code],
                          routing: { route: module, mode: s.is_due ? 'review' : 'practice' },
                        })
                      )
                    }
                  >
                    Practice now
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
