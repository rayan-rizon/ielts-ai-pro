import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { GlassCard, ModuleBadge } from '../SharedComponents';
import { inferModuleFromTitle } from '../../utils/learningUtils';

const DailyFocusCard = ({
  dailyFocus,
  loading,
  timerState,
  onTimerToggle,
  onRefresh,
  todaysTasks,
  activityByKey,
  onSelectToday,
  onToggleTask,
  className,
  hasHistory = true,
}) => {
  const navigate = useNavigate();

  const formatTimer = (seconds) => {
    const s = Math.max(0, Number(seconds) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(Math.floor(s % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // --- Empty State: Diagnostic Test ---
  if (!loading && !hasHistory) {
    return (
      <GlassCard className={cn('p-5 md:p-8 relative overflow-hidden', className)}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight dark:text-white">
                  First Step: Diagnostic
                </h2>
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Baseline Assessment
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Welcome!</span> To
                build your personalized AI study plan and forecast your score, we need a baseline.
                <br className="mb-2" />
                Start with a quick <strong>Reading Test</strong> to calibrate the system.
              </div>
            </div>

            <Button
              className="rounded-2xl h-12 w-full sm:w-auto px-8 font-black tracking-tight bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
              onClick={() => navigate(createPageUrl('Reading'))}
            >
              Start Diagnostic Test
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn('p-5 md:p-8', className)} data-oid="94nozna">
      <div
        className="flex flex-col md:flex-row md:items-start justify-between gap-6"
        data-oid="nys3udn"
      >
        <div className="space-y-2 w-full" data-oid="eab17wt">
          <div className="flex items-center gap-3" data-oid="dy3tv55">
            <div
              className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shadow-lg shadow-indigo-500/5"
              data-oid="8jvxwo:"
            >
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" data-oid="x3sc:.7" />
            </div>
            <div data-oid="20ig3:b">
              <h2 className="text-lg font-black tracking-tight dark:text-white" data-oid="t5g7pw5">
                Daily Focus
              </h2>
              <div className="text-[11px] font-semibold text-muted-foreground" data-oid="ilzct5r">
                Your best next step today
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 space-y-2" data-oid=".y1b5ob">
              <Skeleton className="h-4 w-72 rounded-full" data-oid="mv3jk5q" />
              <Skeleton className="h-4 w-56 rounded-full" data-oid="qtczr7_" />
            </div>
          ) : !dailyFocus ? (
            <div className="mt-4 space-y-3">
              <div className="p-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Why this matters
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 h-6 px-3 rounded-full font-black text-[10px]">
                    RECOVERY DAY
                  </Badge>
                </div>
                <div className="text-sm font-black tracking-tight dark:text-white leading-snug">
                  You have no scheduled tasks today. Take this time to review your error log,
                  practice freely, or simply rest.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="rounded-2xl h-11 font-black tracking-tight flex-1 bg-emerald-600 hover:bg-emerald-700 text-white hover:opacity-95 shadow-lg shadow-emerald-500/20"
                  onClick={() => navigate('/cambridge-tests')}
                  disabled={loading}
                >
                  Explore Library
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl h-11 font-black tracking-tight"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                  <RefreshCw className={cn('w-4 h-4 ml-2', loading && 'animate-spin')} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3" data-oid="b05hs70">
              <div
                className="p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.03]"
                data-oid="--2ezfh"
              >
                <div className="flex items-center justify-between gap-3 mb-2" data-oid="b2yc77j">
                  <div
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                    data-oid="nv0pwkl"
                  >
                    Why this matters
                  </div>
                  {dailyFocus?.primary_module && (
                    <ModuleBadge module={dailyFocus.primary_module} data-oid="g-yij32" />
                  )}
                </div>
                <div
                  className="text-sm font-black tracking-tight dark:text-white leading-snug"
                  data-oid="hnou3xw"
                >
                  {dailyFocus?.ai_reason ||
                    'Complete one high-impact activity to keep your streak and improve your weakest skills.'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3" data-oid="njk4my-">
                <Button
                  className="rounded-2xl h-11 font-black tracking-tight flex-1 bg-slate-900 dark:bg-indigo-600 text-white hover:opacity-95"
                  onClick={() => {
                    const m = dailyFocus?.primary_module;
                    if (m) {
                      navigate(createPageUrl(m.charAt(0).toUpperCase() + m.slice(1)));
                      return;
                    }
                    onSelectToday?.();
                  }}
                  disabled={loading}
                  data-oid="oyf0uv."
                >
                  Start
                  <ArrowUpRight className="w-4 h-4 ml-2" data-oid="ij5.b_-" />
                </Button>

                <Button
                  variant="outline"
                  className="rounded-2xl h-11 font-black tracking-tight"
                  onClick={onTimerToggle}
                  data-oid="qmfea5m"
                >
                  {timerState.running ? 'Pause' : '25-min Timer'} (
                  {formatTimer(timerState.secondsLeft)})
                </Button>

                <Button
                  variant="ghost"
                  className="rounded-2xl h-11 font-black tracking-tight"
                  onClick={onRefresh}
                  disabled={loading}
                  data-oid="zhzb5ua"
                >
                  Refresh
                  <RefreshCw
                    className={cn('w-4 h-4 ml-2', loading && 'animate-spin')}
                    data-oid="ng0-uai"
                  />
                </Button>
              </div>

              {!!todaysTasks?.tasks?.length && (
                <div className="pt-2" data-oid="1b1zjbh">
                  <div
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2"
                    data-oid="ln-88:s"
                  >
                    Other tasks for today
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-oid="5l_hs:k">
                    {todaysTasks.tasks.slice(0, 3).map((t, idx) => {
                      const task =
                        typeof t === 'string'
                          ? {
                              title: t,
                              module: inferModuleFromTitle(t),
                              estimated_time: 30,
                            }
                          : t;
                      const activityKey = `${todaysTasks.day}_${idx}`;
                      const done = !!activityByKey[activityKey]?.is_completed;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            onSelectToday?.();
                            onToggleTask(todaysTasks.day, idx);
                          }}
                          className={cn(
                            'text-left p-4 rounded-3xl border transition-all',
                            done
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-primary/30'
                          )}
                          data-oid="d1xd9qi"
                        >
                          <div
                            className="flex items-center justify-between gap-2 mb-2"
                            data-oid="q4-7c97"
                          >
                            <div
                              className="text-[10px] font-bold text-slate-500 dark:text-slate-400"
                              data-oid="baeoyxx"
                            >
                              Option {idx + 1}
                            </div>
                            {done && (
                              <Badge
                                className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] h-5 px-2 rounded-full font-black"
                                data-oid="j.4lz5m"
                              >
                                DONE
                              </Badge>
                            )}
                          </div>
                          <div
                            className={cn(
                              'text-xs font-black tracking-tight line-clamp-2',
                              done && 'opacity-60'
                            )}
                            data-oid="7g7a8dh"
                          >
                            {task.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default memo(DailyFocusCard);
