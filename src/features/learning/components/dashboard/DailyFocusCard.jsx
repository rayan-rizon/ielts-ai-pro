import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { GlassCard, ModuleBadge } from '../SharedComponents';
import { formatTaskTitle, inferModuleFromTitle } from '../../utils/learningUtils';

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
      <GlassCard className={cn('p-4 sm:p-5 md:p-8 relative overflow-hidden', className)}>
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

            <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
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
    <GlassCard
      className={cn('p-4 sm:p-5 md:p-8 relative overflow-hidden', className)}
      data-oid="94nozna"
    >
      <div
        aria-hidden="true"
        className="absolute -top-20 -right-20 w-64 h-64 blur-3xl rounded-full pointer-events-none bg-indigo-500/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-indigo-500/10 via-blue-500/8 to-transparent"
      />

      <div
        className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6"
        data-oid="nys3udn"
      >
        <div className="space-y-2 w-full" data-oid="eab17wt">
          <div className="flex items-center gap-3" data-oid="dy3tv55">
            <div
              className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10"
              data-oid="8jvxwo:"
            >
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" data-oid="x3sc:.7" />
            </div>
            <div data-oid="20ig3:b">
              <h2 className="text-lg font-black tracking-tight dark:text-white" data-oid="t5g7pw5">
                Daily Focus
              </h2>
              <div className="text-[11px] font-semibold text-muted-foreground" data-oid="ilzct5r">
                One clear task to move your score
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3" data-oid=".y1b5ob">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.03] space-y-2">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-[85%] rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-11 w-full rounded-2xl" />
                <Skeleton className="h-11 w-full rounded-2xl" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] space-y-2"
                  >
                    <Skeleton className="h-3 w-14 rounded-full" />
                    <Skeleton className="h-3.5 w-full rounded-full" />
                    <Skeleton className="h-3.5 w-[70%] rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : !dailyFocus ? (
            <div className="mt-4 space-y-3">
              <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Why this task
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0 h-6 px-3 rounded-full font-black text-[10px]">
                    RECOVERY DAY
                  </Badge>
                </div>
                <div className="text-sm font-black tracking-tight dark:text-white leading-snug">
                  No scheduled tasks today. Complete one short practice to keep momentum.
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="rounded-2xl h-11 font-black tracking-tight bg-emerald-600 hover:bg-emerald-700 text-white hover:opacity-95 shadow-lg shadow-emerald-500/20"
                  onClick={() => navigate(createPageUrl('Reading'))}
                  disabled={loading}
                >
                  Start Reading Practice
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl h-11 font-black tracking-tight"
                  onClick={onSelectToday}
                  disabled={loading}
                >
                  Open Weekly Plan
                </Button>
              </div>
              <button
                type="button"
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                onClick={onRefresh}
              >
                Refresh suggestion
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3" data-oid="b05hs70">
              <div
                className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03]"
                data-oid="--2ezfh"
              >
                <div className="flex items-center justify-between gap-3 mb-2" data-oid="b2yc77j">
                  <div
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                    data-oid="nv0pwkl"
                  >
                    Why this task
                  </div>
                  {dailyFocus?.primary_module && (
                    <ModuleBadge module={dailyFocus.primary_module} data-oid="g-yij32" />
                  )}
                </div>
                <div
                  className="text-sm font-black tracking-tight dark:text-white leading-snug"
                  data-oid="hnou3xw"
                >
                  {formatTaskTitle(dailyFocus?.ai_reason) ||
                    'Complete one focused activity to improve your weakest skill and keep your streak.'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3" data-oid="njk4my-">
                <Button
                  className="rounded-2xl h-11 font-black tracking-tight flex-1 text-white hover:opacity-95 border-0 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500"
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
                  Start This Task
                  <ArrowUpRight className="w-4 h-4 ml-2" data-oid="ij5.b_-" />
                </Button>

                <Button
                  variant="outline"
                  className="rounded-2xl h-11 font-black tracking-tight border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={onSelectToday}
                  data-oid="qmfea5m"
                >
                  View Weekly Plan
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  onClick={onTimerToggle}
                >
                  {timerState.running ? 'Pause timer' : 'Start 25-min timer'} (
                  {formatTimer(timerState.secondsLeft)})
                </button>
                <button
                  type="button"
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh reason
                  <RefreshCw className={cn('w-3.5 h-3.5 ml-1.5', loading && 'animate-spin')} />
                </button>
              </div>

              {!!todaysTasks?.tasks?.length && (
                <div className="pt-2" data-oid="1b1zjbh">
                  <div
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2"
                    data-oid="ln-88:s"
                  >
                    If you finish early
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
                      const activityKey = task.activity_key || `${todaysTasks.day}_${idx}`;
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
                            'text-left p-4 rounded-2xl border transition-all',
                            done
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-slate-50/80 dark:hover:bg-white/[0.06] hover:border-primary/30 dark:hover:border-primary/30'
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
                              Task {idx + 1}
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
                            {formatTaskTitle(task.title)}
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
