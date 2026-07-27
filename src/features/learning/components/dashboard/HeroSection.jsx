import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Gauge,
  RefreshCw,
  Settings2,
  Target,
  TimerReset,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatMinutes, getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

function Metric({ icon: Icon, label, value, hint, badgeColor = 'indigo', onClick }) {
  const Component = onClick ? 'button' : 'div';

  const badgeStyles = {
    indigo:
      'bg-indigo-50 text-indigo-600 border border-indigo-200/60 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    sky: 'bg-sky-50 text-sky-600 border border-sky-200/60 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    amber:
      'bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    rose: 'bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  };

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative min-w-0 w-full px-3.5 py-2 text-left transition-all duration-200 sm:px-5 sm:py-2.5 bg-transparent border-r border-violet-100/60 dark:border-white/5 last:border-r-0',
        onClick &&
          'hover:bg-violet-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 dark:hover:bg-violet-500/10 cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-110',
            badgeStyles[badgeColor]
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="truncate text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-1 truncate text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight dark:text-white">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-[11px] sm:text-xs font-semibold text-violet-600 dark:text-violet-400">
          {hint}
        </div>
      )}
    </Component>
  );
}

function HeroBanner({
  isLegacyPlan,
  primaryTask,
  today,
  path,
  targetBand,
  examDate,
  examDatePassed,
  daysLeft,
  readiness,
  weeklyCapacity,
  refreshing,
  planUpdateAvailable,
  refreshPlan,
  setCustomizeOpen,
  startTask,
}) {
  const titleText = primaryTask
    ? getFriendlyTaskTitle(primaryTask)
    : today?.capacity
      ? 'Your next task is being prepared'
      : 'Rest and recharge today';

  const reasonText =
    primaryTask?.reason ||
    path?.coach_summary?.explanation ||
    'This fits the study time you saved for today.';

  const taskDuration = primaryTask
    ? formatMinutes(primaryTask.estimated_time || primaryTask.estimated_minutes)
    : null;

  const examValue = examDatePassed
    ? 'Choose a new date'
    : daysLeft === null
      ? 'Add exam date'
      : `${daysLeft} days left`;

  const examHint = examDate
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(`${String(examDate).slice(0, 10)}T12:00:00`))
    : 'Tap to set date';

  const readinessValue = readiness?.overall?.available
    ? `Band ${readiness.overall.range[0]}–${readiness.overall.range[1]}`
    : 'Assessment needed';

  const isRefreshActive = isLegacyPlan || planUpdateAvailable;

  return (
    <section className="overflow-hidden rounded-[28px] border border-purple-100/90 bg-white shadow-xl shadow-purple-500/10 dark:border-white/10 dark:bg-[#0d1120]">
      {/* Light gradient backdrop section matching screenshot reference */}
      <div className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/60 via-indigo-50/40 to-white sm:min-h-[350px] lg:min-h-[340px] dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-[#0d1120]">
        {/* Soft Corner Ambient Light Glows */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/30 via-pink-300/20 to-transparent blur-3xl dark:from-purple-600/20 dark:via-pink-500/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/25 via-sky-300/15 to-transparent blur-3xl dark:from-indigo-600/20 dark:via-sky-500/10"
          aria-hidden="true"
        />

        <img
          src="/images/learning-path/ai-coach-study-hero.webp"
          width="1672"
          height="941"
          alt="Learner writing in a notebook beside a laptop and a friendly AI study coach"
          className="absolute inset-y-0 right-0 h-full w-auto max-w-none object-contain object-right opacity-70 sm:opacity-90 lg:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[52%] to-transparent sm:via-[49%] lg:via-white/92 lg:via-[45%] dark:from-[#0d1120] dark:via-[#0d1120]/95 dark:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent dark:from-[#0d1120]/90" />

        <div className="relative z-10 flex min-h-[360px] max-w-[680px] flex-col justify-center p-6 sm:min-h-[350px] sm:p-7 lg:min-h-[340px] lg:w-[58%] lg:p-9">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[42px] dark:text-white">
            Your personalized{' '}
            <span className="text-[#6d55e8] dark:text-violet-400">IELTS path</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-300">
            A clear study plan for your goals, recent results, exam date, and available time.
          </p>

          {/* Today's Next Step mini-card matching screenshot reference */}
          <button
            type="button"
            onClick={() => primaryTask && startTask(primaryTask)}
            disabled={!primaryTask}
            className="mt-4 flex max-w-lg items-center gap-3.5 rounded-2xl border border-indigo-100/90 bg-white/95 p-3.5 shadow-sm backdrop-blur-md transition-all hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-default dark:border-white/10 dark:bg-slate-950/75"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-300">
              <TimerReset className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                Today’s next step
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-950 dark:text-white">
                {titleText}
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {getFriendlyPlanText(reasonText)}
              </span>
            </span>
            {taskDuration && (
              <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {taskDuration}
              </span>
            )}
          </button>

          {/* Action Buttons row matching screenshot reference */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => primaryTask && startTask(primaryTask)}
              disabled={!primaryTask}
              className="h-10.5 rounded-full bg-[#6d55e8] hover:bg-[#5b43d6] px-6 text-sm font-bold text-white shadow-md shadow-[#6d55e8]/25 transition-all hover:scale-[1.02] active:scale-[0.98] border-0"
            >
              Continue learning <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => setCustomizeOpen(true)}
              className="h-10.5 rounded-full border border-slate-200/90 bg-white/90 px-5 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition-all hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-700 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <Settings2 className="mr-2 h-4 w-4 text-slate-500" /> Edit plan
            </Button>

            <button
              type="button"
              aria-label="Check for updates"
              title="No AI request when nothing changed"
              onClick={refreshPlan}
              disabled={refreshing}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-slate-500 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  refreshing && 'animate-spin motion-reduce:animate-none'
                )}
                aria-hidden="true"
              />
              {isRefreshActive ? 'Update your plan' : 'Check updates'}
            </button>
          </div>
          <p className="sr-only">Finished tasks are never turned into a predicted IELTS score.</p>
        </div>
      </div>

      {/* Upgraded Lower Stat Bar with clean glassmorphic background */}
      <div className="grid grid-cols-2 border-t border-purple-100/90 bg-[#fcfaff]/90 dark:bg-[#0f1426]/90 backdrop-blur-md overflow-hidden rounded-b-[28px] sm:grid-cols-4 dark:border-white/10">
        <Metric
          icon={Target}
          label="Target band"
          value={Number(targetBand || 7).toFixed(1)}
          badgeColor="indigo"
        />
        <Metric icon={Gauge} label="Recent score level" value={readinessValue} badgeColor="sky" />
        <Metric
          icon={Clock3}
          label="Weekly study time"
          value={formatMinutes(weeklyCapacity)}
          badgeColor="amber"
        />
        <Metric
          icon={CalendarDays}
          label="Exam date"
          value={examValue}
          hint={examHint}
          badgeColor="rose"
          onClick={() => setCustomizeOpen(true)}
        />
      </div>
    </section>
  );
}

export default function HeroSection(props) {
  return <HeroBanner {...props} />;
}
