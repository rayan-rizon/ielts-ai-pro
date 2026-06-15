import React from 'react';
import { Award, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { moduleConfig } from '@/features/learning/utils/moduleConfig';

export default function BandGapBreakdown({ bandGaps, targetBand, className, loading = false }) {
  const navigate = useNavigate();
  const missingModules = bandGaps?.missingModules || [];

  if (loading) {
    return (
      <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-emerald-500/30', className)}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-600/80" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-3.5 w-52 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-4 sm:p-5 md:p-8 border-t-2 border-t-emerald-500/30', className)}>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight dark:text-white">
              Band Gap Breakdown
            </h2>
            <div className="text-[11px] font-semibold text-muted-foreground">
              Biggest opportunities to lift your score
            </div>
          </div>
        </div>
        {targetBand ? (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest">
            Target {Number(targetBand).toFixed(1)}
          </Badge>
        ) : (
          <Badge className="bg-slate-500/10 text-slate-500 border-0 text-[10px] font-black h-7 px-4 rounded-full tracking-widest">
            Set goal
          </Badge>
        )}
      </div>

      {!bandGaps.hasAny ? (
        <div className="py-10 text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
          <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold max-w-[260px] mx-auto leading-relaxed">
            Complete one practice test in each module to unlock a reliable gap breakdown.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bandGaps.items.map((it) => {
            const config = moduleConfig[it.module];
            const pct = targetBand ? Math.min(100, Math.round((it.current / targetBand) * 100)) : 0;
            return (
              <button
                key={it.module}
                type="button"
                onClick={() =>
                  navigate(createPageUrl(it.module.charAt(0).toUpperCase() + it.module.slice(1)))
                }
                className="w-full text-left p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 transition-all group hover:border-emerald-500/40 dark:hover:border-emerald-400/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/15 hover:shadow-md hover:shadow-emerald-500/5"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <config.icon className={cn('w-4 h-4', config.color)} />
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-emerald-600 transition-colors">
                      {it.module}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {it.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                    {it.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                    <div className="text-sm font-black dark:text-white">
                      {it.current > 0 ? it.current.toFixed(1) : '—'}
                    </div>
                    {targetBand ? (
                      <div className="text-[10px] font-black text-muted-foreground">
                        {it.gap > 0 ? `+${it.gap.toFixed(1)}` : 'On track'}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}

          {!!bandGaps.levers.length && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                Best gains this week
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {bandGaps.levers.map((l) => (
                  <button
                    key={l.module}
                    type="button"
                    onClick={() =>
                      navigate(createPageUrl(l.module.charAt(0).toUpperCase() + l.module.slice(1)))
                    }
                    className="px-3 py-2 rounded-2xl bg-white/80 dark:bg-white/10 border border-emerald-500/10 text-[10px] font-black tracking-widest text-emerald-700 dark:text-emerald-200 hover:bg-white transition-colors"
                  >
                    {l.module} {l.gap > 0 ? `(+${l.gap.toFixed(1)})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {missingModules.length > 0 && (
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 mb-2">
                {missingModules.length === 4
                  ? 'Take your first test'
                  : `Missing ${missingModules.length} module${missingModules.length > 1 ? 's' : ''}`}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {missingModules.map((mod) => {
                  const config = moduleConfig[mod];
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() =>
                        navigate(createPageUrl(mod.charAt(0).toUpperCase() + mod.slice(1)))
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/80 dark:bg-white/10 border border-amber-500/10 text-[10px] font-black tracking-widest text-amber-700 dark:text-amber-200 hover:bg-white hover:border-amber-500/30 transition-colors"
                    >
                      {config && <config.icon className={cn('w-3 h-3', config.color)} />}
                      {mod}
                      <ArrowUpRight className="w-3 h-3 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
