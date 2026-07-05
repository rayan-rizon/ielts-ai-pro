import React from 'react';
import { m } from 'framer-motion';
import { Target, Calendar, Sparkles, Rocket, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from './SharedComponents';

/**
 * Calculates a projected band score based on current progress and pace.
 * @param {Object} params
 * @param {number} params.currentReadiness - Current readiness percentage (0-100)
 * @param {number} params.targetScore - User's target band score (4.0 - 9.0)
 * @param {Date|string} params.testDate - User's target test date
 * @param {number} params.completedActivities - Number of completed activities this week
 * @param {number} params.totalActivities - Total activities scheduled this week
 * @returns {Object} Projection data
 */
function calculateProjection({
  currentReadiness = 0,
  targetScore = 7.0,
  testDate,
  completedActivities = 0,
  totalActivities = 1,
}) {
  const now = new Date();
  const parsedExamDate = testDate ? new Date(testDate) : null;
  const hasTestDate =
    parsedExamDate instanceof Date &&
    Number.isFinite(parsedExamDate.getTime()) &&
    parsedExamDate > now;
  const daysRemaining = hasTestDate ? Math.max(0, differenceInDays(parsedExamDate, now)) : null;

  // Pace calculation: what % of the week's tasks are done?
  const weeklyPace = totalActivities > 0 ? completedActivities / totalActivities : 0;

  // Estimate current band from readiness (rough: 50% readiness ≈ 5.5 band)
  // If no history, this is just a readiness estimate, but we won't show it if locked.
  const estimatedCurrentBand = 4.0 + (currentReadiness / 100) * 4.5;
  const weeksRemaining = hasTestDate ? daysRemaining / 7 : null;
  const potentialGain = hasTestDate ? weeksRemaining * 0.1 * weeklyPace : 0;

  // Projected score (capped at 9.0)
  const projectedScore = hasTestDate ? Math.min(9.0, estimatedCurrentBand + potentialGain) : null;

  // Is user on track?
  const onTrack = hasTestDate && projectedScore >= targetScore;

  // How many extra hours/week needed if not on track?
  const deficit = hasTestDate ? targetScore - projectedScore : 0;
  const extraHoursNeeded = hasTestDate && deficit > 0 ? Math.ceil(deficit * 5) : 0;

  return {
    hasTestDate,
    projectedScore: projectedScore === null ? null : Math.round(projectedScore * 10) / 10,
    estimatedCurrentBand: Math.round(estimatedCurrentBand * 10) / 10,
    daysRemaining,
    weeksRemaining: weeksRemaining === null ? null : Math.round(weeksRemaining),
    weeklyPace: Math.round(weeklyPace * 100),
    onTrack,
    extraHoursNeeded,
    projectedDate: parsedExamDate,
  };
}

export default function ProgressForecast({
  loading = false,
  currentReadiness,
  targetScore,
  testDate,
  completedActivities,
  totalActivities,
  className,
  hasHistory = true,
  onSetDate,
}) {
  const projection = calculateProjection({
    currentReadiness,
    targetScore,
    testDate,
    completedActivities,
    totalActivities,
  });
  const mainForecastLabel = projection.hasTestDate ? 'Projected Score' : 'Weekly Pace';
  const mainForecastValue = projection.hasTestDate
    ? (projection.projectedScore ?? targetScore ?? 7).toFixed(1)
    : String(projection.weeklyPace);
  const mainForecastSuffix = projection.hasTestDate ? '/ 9.0' : '%';
  const completedTaskCount = Number(completedActivities || 0);
  const totalTaskCount = Number(totalActivities || 0);
  const taskProgressLabel =
    totalTaskCount > 0
      ? `${completedTaskCount}/${totalTaskCount} tasks complete`
      : 'No weekly tasks yet';
  const dateLabel = projection.hasTestDate
    ? projection.projectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'Exam date not set';
  const statusLabel = !projection.hasTestDate
    ? 'Date needed'
    : projection.onTrack
      ? 'On track'
      : 'Needs focus';

  if (loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden h-full',
          'bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl',
          'border border-indigo-100 dark:border-indigo-500/20',
          'shadow-xl shadow-indigo-500/10',
          className
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/60 dark:bg-zinc-900/40 rounded-xl p-3 text-center space-y-2"
              >
                <Skeleton className="h-4 w-4 rounded mx-auto" />
                <Skeleton className="h-5 w-10 rounded-full mx-auto" />
                <Skeleton className="h-3 w-16 rounded-full mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </m.div>
    );
  }

  if (!hasHistory) {
    return (
      <GlassCard
        className={cn(
          'p-4 sm:p-6 md:p-8 flex flex-col border-t-2 border-t-indigo-500/30 h-full',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-white/[0.04]">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Score Forecast</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Based on your pace</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 dark:border-white/[0.04]">
            Needs Data
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-2">
            <Sparkles className="w-8 h-8 text-indigo-300 dark:text-indigo-400/50" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Prediction Locked</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed font-semibold">
            Take your first test to unlock your score projection and timeline.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className={cn(
        'p-4 sm:p-5 md:p-6 border-t-2 border-t-violet-500/40 bg-white/95 dark:bg-slate-950/75',
        className
      )}
      data-oid="f1rz38b"
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(135deg,rgba(168,85,247,0.12),rgba(236,72,153,0.05),transparent)] dark:bg-[linear-gradient(135deg,rgba(168,85,247,0.20),rgba(236,72,153,0.08),transparent)] pointer-events-none" />

      <div className="relative z-10 space-y-3" data-oid="7qe348p">
        <div
          className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between"
          data-oid="5_:7dh_"
        >
          <div className="flex min-w-0 items-center gap-2.5" data-oid="h7sui80">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-950/15 dark:bg-white"
              data-oid="6nq2y-8"
            >
              <Rocket className="w-4.5 h-4.5 text-white dark:text-slate-950" data-oid="ehpg49u" />
            </div>
            <div className="min-w-0" data-oid="t728set">
              <h3
                className="text-base font-black tracking-tight text-zinc-900 dark:text-white leading-tight"
                data-oid="7h6eslq"
              >
                Plan Forecast
              </h3>
              <p
                className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
                data-oid="66dq6g0"
              >
                Pace, target, and exam timing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSetDate}
            disabled={!onSetDate}
            className={cn(
              'inline-flex h-8 shrink-0 items-center justify-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.12em] transition-colors',
              !projection.hasTestDate
                ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/15'
                : projection.onTrack
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200',
              !onSetDate && 'cursor-default'
            )}
            data-oid="8rr6mjc"
          >
            {!projection.hasTestDate ? 'Set exam date' : statusLabel}
          </button>
        </div>

        <div
          className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-sm dark:border-slate-700/70 dark:bg-white/[0.03]"
          data-oid="2bxv9bq"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0" data-oid="em13mqp">
              <div
                className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.16em] font-black"
                data-oid="fctthaz"
              >
                {mainForecastLabel}
              </div>
              <div className="mt-1 flex items-baseline gap-1" data-oid="496cghf">
                <span
                  className="text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-purple-300 dark:to-pink-300 sm:text-4xl"
                  data-oid="95z1xi2"
                >
                  {mainForecastValue}
                </span>
                <span
                  className="text-xs font-black text-slate-400 dark:text-slate-500"
                  data-oid="o7pdrmb"
                >
                  {mainForecastSuffix}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {taskProgressLabel}
              </p>
            </div>

            <div
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right dark:border-slate-700 dark:bg-slate-900/70"
              data-oid="566vyb6"
            >
              <div
                className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.16em] font-black"
                data-oid="vc9deu0"
              >
                Target
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1" data-oid="tfybckr">
                <Target
                  className="w-3.5 h-3.5 text-violet-500 dark:text-violet-300"
                  data-oid="5iy1ta_"
                />
                <span
                  className="text-xl font-black text-slate-900 dark:text-white"
                  data-oid="epbaucq"
                >
                  {targetScore?.toFixed(1) || '7.0'}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {dateLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500"
              style={{ width: `${Math.min(100, Math.max(0, projection.weeklyPace))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5" data-oid="acktm14">
          <div
            className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-700/70 dark:bg-white/[0.03]"
            data-oid="g8ldzsj"
          >
            <Calendar
              className="mb-1 w-3.5 h-3.5 text-violet-500 dark:text-violet-300"
              data-oid=":q2d0lz"
            />
            <div className="text-lg font-black text-zinc-900 dark:text-white" data-oid="g73qfzh">
              {projection.daysRemaining ?? '--'}
            </div>
            <div
              className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] font-black"
              data-oid=":gsf330"
            >
              Days Left
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-700/70 dark:bg-white/[0.03]"
            data-oid="onv0iou"
          >
            <Sparkles
              className="mb-1 w-3.5 h-3.5 text-pink-500 dark:text-pink-300"
              data-oid="138fm5o"
            />
            <div className="text-lg font-black text-zinc-900 dark:text-white" data-oid="-5so1pz">
              {completedTaskCount}/{totalTaskCount}
            </div>
            <div
              className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] font-black"
              data-oid=".nq_o0s"
            >
              Tasks Done
            </div>
          </div>
        </div>

        {!projection.hasTestDate && (
          <m.button
            type="button"
            onClick={onSetDate}
            disabled={!onSetDate}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex w-full items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 p-2.5 text-left transition-colors hover:bg-indigo-50 disabled:cursor-default dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:hover:bg-indigo-400/15"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-200 shrink-0" />
            <span className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold leading-snug">
              Add your IELTS exam date for a precise countdown and projected score.
            </span>
          </m.button>
        )}

        {/* Tip if not on track */}
        {!projection.onTrack && projection.extraHoursNeeded > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2"
            data-oid=".t-dz3a"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <p
              className="text-xs text-amber-800 dark:text-amber-300 font-semibold leading-relaxed"
              data-oid="nrjp6ty"
            >
              Add{' '}
              <span className="font-black text-amber-600 dark:text-amber-200" data-oid=".nk0.h3">
                {projection.extraHoursNeeded}+ hours/week
              </span>{' '}
              to reach your target of {targetScore?.toFixed(1)}.
            </p>
          </m.div>
        )}
      </div>
    </GlassCard>
  );
}
