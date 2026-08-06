import React from 'react';
import { ArrowRight, CalendarDays, ChevronRight, Clock3, Gauge, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Eyebrow,
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  ROW_CHEVRON,
  Stat,
  TILE,
} from '@/features/dashboard/components/primitives';
import PlanSignalsCard from './PlanSignalsCard';
import {
  formatMinutes,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getModuleStyle,
  getModuleTone,
} from './dashboardUtils';

/**
 * Plain page title, styled like every other feature page's header (Vocabulary,
 * Leaderboard, Dashboard): an accent pill, an `h1` at `text-2xl …sm:text-3xl`,
 * one description line. No card, no icon chip, no buttons — it sits on the page
 * background, not inside a panel, so the page reads the same as the rest of the
 * app instead of introducing its own header style.
 */
function PageHeader() {
  return (
    <div>
      <Pill tone="accent">AI Learning Path</Pill>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        A clear study plan for your goals
      </h1>
      <p className={cn('mt-1 max-w-2xl text-sm font-medium', MUTED)}>
        Built from your recent scores, target band, exam date, and free time.
      </p>
    </div>
  );
}

/**
 * Hero content: the one decision to make right now ("do this next") beside the
 * plan guide that explains why, then a four-tile instrument strip.
 *
 * Every control here has exactly one job and one home. Starting the recommended
 * task lives only in the task tile (the primary CTA); goal edits and plan
 * refreshes live only in the plan guide beside it. A page-level button row used
 * to duplicate both of the guide card's own controls, so the same two actions
 * appeared twice on screen at once — that row is gone.
 */
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
  nextTasks,
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

  const goalText = primaryTask?.success_criterion
    ? getFriendlyPlanText(primaryTask.success_criterion)
    : null;

  const taskDuration = primaryTask
    ? formatMinutes(primaryTask.estimated_time || primaryTask.estimated_minutes)
    : null;

  const moduleStyle = primaryTask?.module ? getModuleStyle(primaryTask.module) : null;
  const ModuleIcon = moduleStyle?.icon;

  // What follows the headline task, so "do this next" reads as a queue with a
  // shape rather than one card floating above empty space.
  const queuedTasks = (nextTasks || [])
    .filter((task) => task && task.activity_key !== primaryTask?.activity_key)
    .slice(0, 3);

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
    ? `${readiness.overall.range[0]}–${readiness.overall.range[1]}`
    : 'No score yet';

  return (
    <>
      <PageHeader />

      <section
        className={cn(PANEL, 'mt-3 overflow-hidden')}
        aria-label="Your personalized IELTS path"
      >
        <div className="grid gap-2.5 p-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] sm:p-3">
          <div className={cn(TILE, 'flex min-w-0 flex-col p-4')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow className="text-[#5a63df] dark:text-[#afb5ff]">Do this next</Eyebrow>
              <div className="flex shrink-0 items-center gap-1.5">
                {moduleStyle && (
                  <Pill tone={getModuleTone(primaryTask.module)}>
                    {ModuleIcon && <ModuleIcon className="h-3 w-3" />}
                    {moduleStyle.label}
                  </Pill>
                )}
                {taskDuration && (
                  <Pill tone="neutral">
                    <Clock3 className="h-3 w-3" />
                    {taskDuration}
                  </Pill>
                )}
              </div>
            </div>

            <h2 className="mt-2.5 text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {titleText}
            </h2>
            <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {getFriendlyPlanText(reasonText)}
            </p>
            {goalText && (
              <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                <strong className="font-bold text-slate-700 dark:text-slate-200">Goal:</strong>{' '}
                {goalText}
              </p>
            )}

            {queuedTasks.length > 0 && (
              <div className="mt-4">
                <Eyebrow>Then in your queue</Eyebrow>
                <ul className="mt-2 space-y-1">
                  {queuedTasks.map((task, index) => {
                    const queuedStyle = getModuleStyle(task.module);
                    const QueuedIcon = queuedStyle.icon;
                    return (
                      <li key={task.activity_key || index} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => startTask(task)}
                          className="group flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:hover:bg-white/6"
                        >
                          <IconChip icon={QueuedIcon} tone={getModuleTone(task.module)} />
                          <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                            {getFriendlyTaskTitle(task)}
                          </span>
                          <span className={cn(MICRO, MUTED, 'shrink-0')}>
                            {formatMinutes(task.estimated_time || task.estimated_minutes)}
                          </span>
                          <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', ROW_CHEVRON)} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
              <button
                type="button"
                onClick={() => primaryTask && startTask(primaryTask)}
                disabled={!primaryTask}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5a63df] px-4 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9] disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]"
              >
                Continue learning <ArrowRight className="h-4 w-4" />
              </button>
              <p className={cn('text-[11px] font-medium leading-snug', MUTED)}>
                Finishing it feeds your next score check.
              </p>
            </div>
            <p className="sr-only">Finished tasks are never turned into a predicted IELTS score.</p>
          </div>

          <PlanSignalsCard
            trigger={path?.generation_trigger}
            changeReason={path?.why_plan_changed}
            checkpoint={path?.next_checkpoint}
            readiness={readiness}
            onCustomize={() => setCustomizeOpen(true)}
            onRefresh={refreshPlan}
            planUpdateAvailable={isLegacyPlan || planUpdateAvailable}
            refreshing={refreshing}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-[#eeedf7] p-2.5 dark:border-white/[0.07] sm:grid-cols-4 sm:p-3">
          <Stat
            size="sm"
            icon={Target}
            label="Target band"
            value={Number(targetBand || 7).toFixed(1)}
            sub="Your goal score"
          />
          <Stat
            size="sm"
            icon={Gauge}
            tone="sky"
            label="Recent score level"
            value={readinessValue}
            sub="From scored practice"
          />
          <Stat
            size="sm"
            icon={Clock3}
            tone="amber"
            label="Weekly study time"
            value={formatMinutes(weeklyCapacity)}
            sub="Time you saved"
          />
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          >
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
    </>
  );
}

export default function HeroSection(props) {
  return <HeroBanner {...props} />;
}
