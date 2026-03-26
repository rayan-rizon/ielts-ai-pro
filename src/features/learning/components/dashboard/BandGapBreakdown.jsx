import React from 'react';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GlassCard } from '@/features/learning/components/SharedComponents';
import { moduleConfig } from '@/features/learning/utils/moduleConfig';

export default function BandGapBreakdown({ bandGaps, targetBand, className }) {
  const navigate = useNavigate();

  return (
    <GlassCard className={cn('p-5 md:p-8 border-t-2 border-t-emerald-500/30', className)}>
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
              Where to focus to raise your band score
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
        <div className="py-10 text-center space-y-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
          <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold max-w-[260px] mx-auto leading-relaxed">
            Complete at least one practice test per module to unlock accurate band forecasting.
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
                className="w-full text-left p-4 rounded-3xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all group"
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
            <div className="p-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                Fastest gains
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
        </div>
      )}
    </GlassCard>
  );
}
