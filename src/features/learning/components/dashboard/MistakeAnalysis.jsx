import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import { GlassCard } from '../SharedComponents';
import { mistakeAdvice } from '../../utils/learningUtils';
import { cn } from '@/lib/cn';

const MistakeAnalysis = ({ mistakePatterns, onSelectToday, className, loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <GlassCard className={cn('p-4 sm:p-5 border-t-2 border-t-rose-400/40', className)}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-rose-500/80" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-3.5 w-44 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-4 w-[75%] rounded-full" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={cn(
        'relative p-5 sm:p-6 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white/90 border border-indigo-100/90 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/15 rounded-3xl dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 dark:border-indigo-500/20 transition-all duration-300 overflow-hidden',
        className
      )}
      data-oid="c52ljmm"
    >
      {/* Decorative Aura / Glows */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none dark:bg-indigo-500/5" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none dark:bg-blue-500/5" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-5" data-oid="ut1wf9y">
          <div className="flex min-w-0 items-center gap-3" data-oid="-xss1.4">
            <div
              className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center shadow-lg shadow-indigo-500/5 shrink-0"
              data-oid="9fgr-vd"
            >
              <Zap className="w-5 h-5 text-indigo-500" data-oid="713lnsk" />
            </div>
            <div className="min-w-0" data-oid="o3yj.7i">
              <h2
                className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white"
                data-oid="rmdmnb8"
              >
                Common Mistakes
              </h2>
              <div
                className="text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400"
                data-oid="8zhmqu3"
              >
                Patterns from your recent tests
              </div>
            </div>
          </div>
          <Badge
            className="shrink-0 whitespace-nowrap rounded-full border border-indigo-200/70 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200 text-[10px] font-black h-6 px-2.5 tracking-[0.08em]"
            data-oid="4d3v75t"
          >
            Last 14 days
          </Badge>
        </div>

        {!mistakePatterns.length ? (
          <div
            className="py-8 text-center space-y-3 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700"
            data-oid="c_uvxjt"
          >
            <Zap
              className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto"
              data-oid="w9kcq1q"
            />
            <div className="max-w-[260px] mx-auto space-y-1">
              <h4 className="text-sm font-black dark:text-white">No mistake patterns yet</h4>
              <p
                className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed"
                data-oid="cacxs.a"
              >
                Complete a Reading or Listening test and we will track your common mistakes here.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-3"
            data-oid="7nxl0r3"
            aria-live="polite"
            role="status"
            aria-label="Common mistake patterns"
          >
            {mistakePatterns.map((p) => {
              const advice = mistakeAdvice(p.tag);
              const targetModule = advice.module || p.module;
              return (
                <div
                  key={p.tag}
                  className="min-w-0 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-white/75 dark:bg-slate-950/40 p-4 shadow-md dark:shadow-slate-950/20 transition-all duration-300 hover:scale-[1.01] hover:border-indigo-300 dark:hover:border-indigo-400/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/5"
                  data-oid="m-orq99"
                >
                  <div className="flex items-start justify-between gap-3" data-oid="w4.tuan">
                    <div className="min-w-0 flex-1" data-oid="01rxfn:">
                      <div
                        className="text-[9px] font-black uppercase tracking-[0.14em] text-indigo-500/80 dark:text-indigo-300/80"
                        data-oid="3xghvxo"
                      >
                        {advice.title}
                      </div>
                      <div
                        className="mt-0.5 text-sm font-black tracking-tight text-slate-900 dark:text-white break-words [overflow-wrap:anywhere] line-clamp-2"
                        data-oid="lh.vof2"
                      >
                        {p.tag ? p.tag.charAt(0).toUpperCase() + p.tag.slice(1) : ''}
                      </div>
                    </div>
                    <Badge
                      className="shrink-0 whitespace-nowrap bg-slate-900 text-white dark:bg-white/10 dark:text-white border-0 text-[10px] font-black h-6 px-2.5 rounded-full"
                      data-oid="drlwn06"
                    >
                      {p.count}x
                    </Badge>
                  </div>

                  <div
                    className="mt-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed"
                    data-oid="q7ouzxr"
                  >
                    {advice.tip}
                  </div>

                  <div className="mt-4 grid gap-2" data-oid="7-ipwy8">
                    <div
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                      data-oid="b5dn9bh"
                    >
                      {targetModule
                        ? `Train in ${targetModule.charAt(0).toUpperCase() + targetModule.slice(1)}`
                        : 'Train now'}
                    </div>
                    <Button
                      size="sm"
                      className="w-full justify-center rounded-xl h-9 px-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap border-0"
                      onClick={() => {
                        if (targetModule) {
                          navigate(
                            buildActivityUrl({
                              module: targetModule,
                              routing: { route: targetModule, mode: 'practice' },
                            })
                          );
                          return;
                        }
                        onSelectToday?.();
                      }}
                      data-oid="8v81jf:"
                    >
                      Practice fix
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" data-oid="orl69st" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default memo(MistakeAnalysis);
