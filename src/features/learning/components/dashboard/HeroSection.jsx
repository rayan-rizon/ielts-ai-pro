import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Gauge,
  RefreshCw,
  Settings2,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Eyebrow,
  IconChip,
  PANEL,
  Pill,
  Stat,
  TITLE,
} from '@/features/dashboard/components/primitives';
import { formatMinutes, getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

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
    <section className={cn(PANEL, 'overflow-hidden')} aria-label="Your personalized IELTS path">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
        <div className="min-w-0">
          <Pill tone="accent">Your personalized IELTS path</Pill>

          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            A clear study plan for your goals
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Guided by recent practice results, target score, exam date, and available time.
          </p>

          <button
            type="button"
            onClick={() => primaryTask && startTask(primaryTask)}
            disabled={!primaryTask}
            className="group mt-4 flex w-full max-w-md flex-col gap-1.5 rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-3 text-left transition-colors duration-150 hover:border-[#c9cdf3] hover:bg-white disabled:cursor-default disabled:hover:border-[#ebeaf7] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>Best next task</Eyebrow>
              {taskDuration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <Clock3 className="h-3 w-3" />
                  {taskDuration}
                </span>
              )}
            </div>
            <div className="flex items-start gap-2.5">
              <IconChip icon={Target} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className={cn(TITLE, 'leading-snug')}>{titleText}</h3>
                <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {getFriendlyPlanText(reasonText)}
                </p>
              </div>
            </div>
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => primaryTask && startTask(primaryTask)}
              disabled={!primaryTask}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9] disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141319]"
            >
              Continue learning <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5f2] px-4 text-sm font-bold text-slate-600 transition-colors hover:border-[#c9cdf3] hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
            >
              <Settings2 className="h-4 w-4" /> Edit plan
            </button>

            <button
              type="button"
              aria-label="Check for updates"
              title="No AI request when nothing changed"
              onClick={refreshPlan}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshing && 'animate-spin motion-reduce:animate-none')}
              />
              {isRefreshActive ? 'Update your plan' : 'Check updates'}
            </button>
          </div>
          <p className="sr-only">Finished tasks are never turned into a predicted IELTS score.</p>
        </div>

        <img
          src="/images/learning-path/ai-coach-study-hero.webp"
          width="1672"
          height="941"
          alt="Learner writing in a notebook beside a laptop and a friendly AI study coach"
          className="hidden min-h-[260px] w-full rounded-lg object-cover lg:block"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 border-t border-[#eeedf7] p-3 dark:border-white/[0.07] sm:grid-cols-4">
        <Stat
          size="sm"
          icon={Target}
          label="Target band"
          value={Number(targetBand || 7).toFixed(1)}
        />
        <Stat size="sm" icon={Gauge} tone="sky" label="Recent score level" value={readinessValue} />
        <Stat
          size="sm"
          icon={Clock3}
          tone="amber"
          label="Weekly study time"
          value={formatMinutes(weeklyCapacity)}
        />
        <button type="button" onClick={() => setCustomizeOpen(true)} className="text-left">
          <Stat
            size="sm"
            icon={CalendarDays}
            tone="rose"
            label="Exam date"
            value={examValue}
            sub={examHint}
          />
        </button>
      </div>
    </section>
  );
}

export default function HeroSection(props) {
  return <HeroBanner {...props} />;
}
