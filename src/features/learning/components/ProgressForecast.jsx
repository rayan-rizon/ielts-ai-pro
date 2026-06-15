import React from 'react';
import { m } from 'framer-motion';
import { TrendingUp, Target, Calendar, Sparkles, Rocket, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { addDays, differenceInDays } from 'date-fns';
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
  const examDate = testDate ? new Date(testDate) : addDays(now, 60);
  const daysRemaining = Math.max(0, differenceInDays(examDate, now));

  // Pace calculation: what % of the week's tasks are done?
  const weeklyPace = totalActivities > 0 ? completedActivities / totalActivities : 0;

  // Base projection: assume each week of consistent study adds ~0.1 band
  // Modified by current readiness and pace
  const weeksRemaining = daysRemaining / 7;
  const potentialGain = weeksRemaining * 0.1 * weeklyPace;

  // Estimate current band from readiness (rough: 50% readiness ≈ 5.5 band)
  // If no history, this is just a readiness estimate, but we won't show it if locked.
  const estimatedCurrentBand = 4.0 + (currentReadiness / 100) * 4.5;

  // Projected score (capped at 9.0)
  const projectedScore = Math.min(9.0, estimatedCurrentBand + potentialGain);

  // Is user on track?
  const onTrack = projectedScore >= targetScore;

  // How many extra hours/week needed if not on track?
  const deficit = targetScore - projectedScore;
  const extraHoursNeeded = deficit > 0 ? Math.ceil(deficit * 5) : 0;

  return {
    projectedScore: Math.round(projectedScore * 10) / 10,
    estimatedCurrentBand: Math.round(estimatedCurrentBand * 10) / 10,
    daysRemaining,
    weeksRemaining: Math.round(weeksRemaining),
    weeklyPace: Math.round(weeklyPace * 100),
    onTrack,
    extraHoursNeeded,
    projectedDate: examDate,
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
}) {
  const projection = calculateProjection({
    currentReadiness,
    targetScore,
    testDate,
    completedActivities,
    totalActivities,
  });

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
      className={cn('p-4 sm:p-6 md:p-8 border-t-2 border-t-indigo-500/30', className)}
      data-oid="f1rz38b"
    >
      {/* Background decoration - matching the page's premium feel */}
      <div
        className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
        data-oid=".n-zpb8"
      />

      <div
        className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"
        data-oid="ogkh:x4"
      />

      <div className="relative z-10" data-oid="7qe348p">
        {/* Header */}
        <div className="flex items-center justify-between mb-4" data-oid="5_:7dh_">
          <div className="flex items-center gap-2" data-oid="h7sui80">
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
              data-oid="6nq2y-8"
            >
              <Rocket className="w-4 h-4 text-white" data-oid="ehpg49u" />
            </div>
            <div data-oid="t728set">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white" data-oid="7h6eslq">
                Score Forecast
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400" data-oid="66dq6g0">
                Based on your pace
              </p>
            </div>
          </div>
          <div
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border',
              projection.onTrack
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                : 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
            )}
            data-oid="8rr6mjc"
          >
            {projection.onTrack ? 'On track' : 'Needs focus'}
          </div>
        </div>

        {/* Main projection */}
        <div className="flex items-end gap-6 mb-5" data-oid="2bxv9bq">
          <div className="flex-1" data-oid="em13mqp">
            <div
              className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold mb-1"
              data-oid="fctthaz"
            >
              Projected Score
            </div>
            <div className="flex items-baseline gap-1.5" data-oid="496cghf">
              <span
                className="text-5xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent tracking-tighter"
                data-oid="95z1xi2"
              >
                {projection.projectedScore.toFixed(1)}
              </span>
              <span
                className="text-sm font-black text-slate-400 dark:text-slate-500"
                data-oid="o7pdrmb"
              >
                / 9.0
              </span>
            </div>
          </div>

          <div className="text-right" data-oid="566vyb6">
            <div
              className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold mb-1"
              data-oid="vc9deu0"
            >
              Target
            </div>
            <div className="flex items-center gap-1.5 mt-1" data-oid="tfybckr">
              <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" data-oid="5iy1ta_" />
              <span
                className="text-2xl font-black text-slate-800 dark:text-white"
                data-oid="epbaucq"
              >
                {targetScore?.toFixed(1) || '7.0'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3" data-oid="acktm14">
          <div
            className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-2xl p-3 text-center hover:bg-slate-100/50 dark:hover:bg-white/[0.05] hover:scale-[1.03] transition-all duration-300"
            data-oid="g8ldzsj"
          >
            <Calendar
              className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mx-auto mb-1"
              data-oid=":q2d0lz"
            />
            <div className="text-xl font-black text-zinc-900 dark:text-white" data-oid="g73qfzh">
              {projection.daysRemaining}
            </div>
            <div
              className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold"
              data-oid=":gsf330"
            >
              Days Left
            </div>
          </div>

          <div
            className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-2xl p-3 text-center hover:bg-slate-100/50 dark:hover:bg-white/[0.05] hover:scale-[1.03] transition-all duration-300"
            data-oid="9ta8mwr"
          >
            <TrendingUp
              className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto mb-1"
              data-oid="cf3zwdw"
            />
            <div className="text-xl font-black text-zinc-900 dark:text-white" data-oid="3iyljyb">
              {projection.weeklyPace}%
            </div>
            <div
              className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold"
              data-oid="g09hyc5"
            >
              Weekly Pace
            </div>
          </div>

          <div
            className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] rounded-2xl p-3 text-center hover:bg-slate-100/50 dark:hover:bg-white/[0.05] hover:scale-[1.03] transition-all duration-300"
            data-oid="onv0iou"
          >
            <Sparkles
              className="w-4 h-4 text-purple-500 dark:text-purple-400 mx-auto mb-1"
              data-oid="138fm5o"
            />
            <div className="text-xl font-black text-zinc-900 dark:text-white" data-oid="-5so1pz">
              {projection.estimatedCurrentBand.toFixed(1)}
            </div>
            <div
              className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold"
              data-oid=".nq_o0s"
            >
              Est. Now
            </div>
          </div>
        </div>

        {/* Tip if not on track */}
        {!projection.onTrack && projection.extraHoursNeeded > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5"
            data-oid=".t-dz3a"
          >
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
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
