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
      'bg-[#eef0ff] text-[#505bdd] border border-[#dfe3ff] dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
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
        'group relative min-w-0 w-full border-r border-[#e0e4f1] bg-transparent px-3 py-2.5 text-left transition-all duration-200 last:border-r-0 sm:px-4 dark:border-white/10',
        onClick &&
          'hover:bg-[#f3efff]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5661e9] dark:hover:bg-indigo-500/10 cursor-pointer'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-110',
            badgeStyles[badgeColor]
          )}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
        </span>
        <span className="truncate text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:text-[9px]">
          {label}
        </span>
      </div>
      <div className="mt-0.5 truncate text-sm font-black leading-tight tracking-tight text-slate-950 sm:text-base dark:text-white">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-[9px] font-extrabold text-[#505bdd] dark:text-indigo-400">
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
    <section className="relative overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 backdrop-blur hover:shadow-[0_24px_55px_-38px_rgba(48,58,128,0.85)] dark:border-white/10 dark:bg-[#10131f]">
      {/* Corner Light Gradient Glow matching all other dashboard cards */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 z-20 h-52 w-52 rounded-full bg-[#dcd8ff]/60 blur-2xl dark:bg-indigo-900/40"
        aria-hidden="true"
      />
      {/* Light gradient backdrop matching Grammar Lab header */}
      <div className="relative min-h-[264px] overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#f4f1ff] via-[#f8f7fd] to-white sm:min-h-[248px] lg:min-h-[238px] dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-[#10131f]">
        {/* Soft Ambient Light Gradient Corner Glows */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#c8c1ff] via-[#dcd8ff] to-[#f3efff] opacity-80 blur-3xl dark:from-indigo-600/30 dark:to-purple-900/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-10 -left-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#e0e4ff] via-[#f0eeff] to-transparent opacity-70 blur-3xl dark:from-indigo-900/20"
          aria-hidden="true"
        />

        <img
          src="/images/learning-path/ai-coach-study-hero.webp"
          width="1672"
          height="941"
          alt="Learner writing in a notebook beside a laptop and a friendly AI study coach"
          className="absolute inset-y-0 right-0 h-full w-auto max-w-none object-contain object-right opacity-45 sm:opacity-75 lg:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[52%] to-transparent sm:via-[49%] lg:via-white/92 lg:via-[45%] dark:from-[#10131f] dark:via-[#10131f]/95 dark:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 to-transparent dark:from-[#10131f]/90" />

        <div className="relative z-10 flex min-h-[264px] max-w-[680px] flex-col justify-center p-5 sm:min-h-[248px] sm:px-6 sm:py-5 lg:min-h-[238px] lg:w-[62%] lg:px-7">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#9ea9f5] bg-white px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#3b44b8] shadow-[0_2px_10px_-3px_rgba(59,68,184,0.25)] dark:border-indigo-400/40 dark:bg-[#10131f] dark:text-indigo-300">
              Your personalized IELTS path
            </span>
          </div>

          <h1 className="mt-2 max-w-2xl text-[26px] font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[30px] lg:text-[33px] dark:text-white">
            A clear study plan for your goals
          </h1>
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
            Guided by recent practice results, target score, exam date, and available time.
          </p>

          {/* Today's Next Step mini-card matching Grammar card aesthetics */}
          <button
            type="button"
            onClick={() => primaryTask && startTask(primaryTask)}
            disabled={!primaryTask}
            className="mt-2.5 flex w-full max-w-lg flex-col gap-1.5 rounded-xl border border-[#cbd3f8] bg-white px-3 py-2.5 shadow-[0_4px_18px_-8px_rgba(48,58,128,0.14)] transition-all duration-200 hover:border-[#505bdd] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5661e9] disabled:cursor-default dark:border-white/10 dark:bg-[#10131f]/90 text-left group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-indigo-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#3b44b8] dark:text-indigo-300 border border-[#9ea9f5] dark:border-indigo-400/40 shadow-2xs">
                Best next task
              </span>
              {taskDuration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">
                  <Clock3 className="w-3 h-3 text-slate-400" />
                  {taskDuration}
                </span>
              )}
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#efedff] text-[#5862df] shadow-2xs group-hover:scale-105 transition-transform dark:bg-indigo-500/20 dark:text-indigo-300 mt-0.5">
                <TimerReset className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
                  {titleText}
                </h3>
                <p className="text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {getFriendlyPlanText(reasonText)}
                </p>
              </div>
            </div>
          </button>

          {/* Action Buttons row matching Grammar Hero actions */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => primaryTask && startTask(primaryTask)}
              disabled={!primaryTask}
              className="h-10 rounded-xl bg-[#5661e9] px-5 font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(76,87,225,0.9)] hover:bg-[#4853d6] transition-all"
            >
              Continue learning <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              onClick={() => setCustomizeOpen(true)}
              className="h-10 rounded-xl border border-[#9ea9f5] bg-white px-4 text-xs font-black text-[#3b44b8] shadow-[0_3px_12px_-3px_rgba(59,68,184,0.25)] transition hover:border-[#505bdd] hover:bg-[#f4f1ff] dark:border-indigo-400/40 dark:bg-[#10131f] dark:text-indigo-300 dark:hover:bg-white/10"
            >
              <Settings2 className="mr-2 h-4 w-4 text-[#3b44b8] dark:text-indigo-300" /> Edit plan
            </Button>

            <button
              type="button"
              aria-label="Check for updates"
              title="No AI request when nothing changed"
              onClick={refreshPlan}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#9ea9f5] bg-white px-4 text-xs font-black text-[#3b44b8] shadow-[0_3px_12px_-3px_rgba(59,68,184,0.25)] transition hover:border-[#505bdd] hover:bg-[#f4f1ff] dark:border-indigo-400/40 dark:bg-[#10131f] dark:text-indigo-300 dark:hover:bg-white/10"
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5 text-[#3b44b8] dark:text-indigo-300',
                  refreshing && 'animate-spin motion-reduce:animate-none'
                )}
                aria-hidden="true"
              />
              <span>{isRefreshActive ? 'Update your plan' : 'Check updates'}</span>
            </button>
          </div>
          <p className="sr-only">Finished tasks are never turned into a predicted IELTS score.</p>
        </div>
      </div>

      {/* Upgraded Lower Stat Bar matching Grammar Lab footer stats */}
      <div className="grid grid-cols-2 border-t border-[#e0e4f1] bg-[#f8f7fd]/90 dark:bg-[#10131f]/90 backdrop-blur-md overflow-hidden rounded-b-[26px] sm:grid-cols-4 dark:border-white/10">
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
