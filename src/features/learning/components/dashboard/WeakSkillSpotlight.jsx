import React from 'react';
import { Target, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';

export default function WeakSkillSpotlight({ spotlightSkills, className }) {
  const navigate = useNavigate();

  return (
    <GlassCard className={cn('p-5 md:p-8 border-t-2 border-t-amber-500/30', className)}>
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
              Skills that need attention
            </div>
          </div>
        </div>
        <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest">
          TOP 3
        </Badge>
      </div>

      {!spotlightSkills.length ? (
        <div className="py-12 flex flex-col items-center text-center space-y-4 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transform -rotate-2">
            <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="max-w-[220px]">
            <h4 className="text-sm font-black dark:text-white mb-1">No skill data yet</h4>
            <p className="text-[10px] text-slate-500 font-medium">
              Complete a few activities to generate your skill priorities.
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
                  'p-4 rounded-3xl border transition-all',
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
                  <div className="text-[10px] font-bold text-muted-foreground line-clamp-1">
                    {s.why}
                  </div>
                  <Button
                    size="sm"
                    className="rounded-2xl h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                    onClick={() =>
                      navigate(createPageUrl(module.charAt(0).toUpperCase() + module.slice(1)))
                    }
                  >
                    Practice
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
