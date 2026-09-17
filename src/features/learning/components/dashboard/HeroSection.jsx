import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gauge,
  Pencil,
  Sparkles,
  Target,
} from 'lucide-react';
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
  StatRail,
  TILE,
  WELL,
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
 * The journey line, inside the hero.
 *
 * The stage rail lower down the page is the detailed view; this is the one-line
 * answer to "where am I" that belongs beside the task you are being asked to
 * start. Both read the same `pathProgress` object, so the two can never print
 * different numbers for the same journey.
 */
function StageStrip({ pathProgress }) {
  const stage = pathProgress?.currentStage;
  if (!stage) return null;
  const percent = Math.round(Number(pathProgress.overallPercent) || 0);

  return (
    // `mt-auto` collects the column's slack *above* the strip, so the strip and
    // the button below it read as one bottom group. With the slack under the
    // strip instead, this tile carried 72px of blank between them — the plan
    // guide beside it is simply taller, and that height has to go somewhere.
    <div className="mt-auto rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-3 pt-3 dark:border-white/10 dark:bg-white/4">
      {/* The number is the whole journey, so it is labelled as the journey.
          Printing it under a "Stage 2 of 4" heading read as though stage two
          itself were 67% done. */}
      <div className="flex items-baseline justify-between gap-2">
        <p className={cn(MICRO, MUTED, 'truncate')}>Path progress</p>
        <p className="shrink-0 font-mono text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
          {percent}%
        </p>
      </div>
      <div className={cn('mt-2 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#5a63df,#8f97ff)] transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 truncate text-[11px] font-bold text-[#5a63df] dark:text-[#afb5ff]">
        Now: {stage.shortName} · {pathProgress.stagesDone}/{pathProgress.totalStages} cleared
      </p>
      <p className={cn('mt-0.5 text-[11px] font-medium leading-snug', MUTED)}>
        {getFriendlyPlanText(stage.progressRule || stage.progressLabel)}
      </p>
    </div>
  );
}

function QueueList({ tasks, onStart }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {tasks.map((task, index) => {
        const queuedStyle = getModuleStyle(task.module);
        const QueuedIcon = queuedStyle.icon;
        const friendlyTitle = getFriendlyTaskTitle(task);
        const stepNumber = String(index + 2).padStart(2, '0');
        const dayLabel = task.day?.isToday
          ? 'Today'
          : task.day?.date instanceof Date && !Number.isNaN(task.day.date.getTime())
            ? task.day.date.toLocaleDateString(undefined, { weekday: 'short' })
            : task.scheduled_day
              ? String(task.scheduled_day).slice(0, 3)
              : null;
        const durationText = formatMinutes(task.estimated_time || task.estimated_minutes);

        return (
          <li key={task.activity_key || index} className="min-w-0">
            <button
              type="button"
              onClick={() => onStart(task)}
              aria-label={`Step ${index + 2}: Start ${friendlyTitle}${dayLabel ? ` on ${dayLabel}` : ''}`}
              className="group flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-[#e8e6f5] bg-white/95 px-3 py-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f8f7fd] hover:shadow-xs active:scale-[0.985] active:bg-[#f0eefb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 motion-reduce:transform-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-[#8f97ff]/35 dark:hover:bg-white/[0.06] dark:active:bg-white/10 dark:focus-visible:ring-[#8f97ff] dark:focus-visible:ring-offset-[#141319]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#f0eefb] font-mono text-[10px] font-extrabold text-[#5a63df] transition-colors duration-150 group-hover:bg-[#5a63df] group-hover:text-white dark:bg-white/[0.08] dark:text-[#afb5ff] dark:group-hover:bg-[#8f97ff] dark:group-hover:text-slate-900">
                {stepNumber}
              </span>

              <IconChip icon={QueuedIcon} tone={getModuleTone(task.module)} />

              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-slate-700 transition-colors duration-150 group-hover:text-[#5a63df] dark:text-slate-200 dark:group-hover:text-[#afb5ff]">
                  {friendlyTitle}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  {dayLabel && (
                    <span className="rounded border border-[#e5e3f2] bg-[#f8f7fd] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-slate-500 transition-colors group-hover:border-[#5a63df]/20 group-hover:text-[#5a63df] dark:border-white/10 dark:bg-white/6 dark:text-slate-400 dark:group-hover:border-[#8f97ff]/20 dark:group-hover:text-[#afb5ff]">
                      {dayLabel}
                    </span>
                  )}
                  <span
                    className={cn(
                      MICRO,
                      'rounded border border-[#e8e6f4] bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 transition-colors duration-150 group-hover:border-[#5a63df]/20 group-hover:bg-[#5a63df]/10 group-hover:text-[#5a63df] dark:border-white/10 dark:bg-white/6 dark:text-slate-400 dark:group-hover:border-[#8f97ff]/20 dark:group-hover:bg-[#8f97ff]/15 dark:group-hover:text-[#afb5ff]'
                    )}
                  >
                    {durationText}
                  </span>
                </div>
              </div>

              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none',
                  ROW_CHEVRON
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Hero content: the one decision to make right now ("do this next") beside the
 * plan guide that explains why, then a four-tile instrument strip.
 *
 * Every control here has exactly one job and one home. Starting the recommended
 * task lives only in the task tile (the primary CTA); goal edits and plan
 * refreshes live only in the plan guide beside it.
 *
 * The tile is deliberately never empty. When the seven-day schedule has nothing
 * outstanding, `primaryTask` is a task derived from evidence instead (a missing
 * starting score, the weakest measured skill, an unsat timed attempt), and the
 * space the queue would occupy carries the stage strip. The previous version
 * rendered a headline, one sentence and a disabled button into a tile stretched
 * to the height of the plan guide beside it — roughly two hundred pixels of
 * nothing at the top of the page.
 */
function HeroBanner({
  isLegacyPlan,
  primaryTask,
  isFallbackTask,
  todayIsRestDay,
  primaryTaskIsToday,
  primaryTaskDayLabel,
  today,
  path,
  targetBand,
  examDate,
  examDatePassed,
  daysLeft,
  readiness,
  weeklyCapacity,
  pathProgress,
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
    'This fits the study time you set aside for today.';

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

  const hasExamDays = daysLeft !== null && !examDatePassed;
  const examValue = examDatePassed
    ? 'Date passed'
    : daysLeft === null
      ? 'Not set'
      : String(daysLeft);

  const examUnit = hasExamDays ? (daysLeft === 1 ? 'day left' : 'days left') : undefined;

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

  const readinessSub = readiness?.overall?.available ? 'Scored practice' : 'Needs 1 test';

  return (
    <>
      <PageHeader />

      <section
        className={cn(
          PANEL,
          'mt-3 overflow-hidden',
          // A soft accent bloom off the top-left corner, so the panel a learner
          // is meant to read first is the one that catches the eye. It layers a
          // background-image over PANEL's flat background-color rather than
          // replacing it, which keeps the surface token — and the dark-mode
          // value — exactly as the panel system defines them.
          'bg-[radial-gradient(115%_160%_at_0%_0%,rgba(90,99,223,0.13),rgba(90,99,223,0.035)_40%,transparent_72%)]',
          'dark:bg-[radial-gradient(115%_160%_at_0%_0%,rgba(143,151,255,0.16),rgba(143,151,255,0.04)_40%,transparent_72%)]',
          // Elevation through the border rule, which is how this panel system
          // says "this one first" — never a drop shadow.
          'border-[#d9dcf4] dark:border-white/[0.14]'
        )}
        aria-label="Your personalized IELTS path"
      >
        <div className="grid gap-2.5 p-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] sm:p-3">
          <div className={cn(TILE, 'flex min-w-0 flex-col p-3.5 sm:p-4')}>
            {/* Step 1: Active Focus Card with direct action anchoring */}
            <div className="rounded-xl border border-[#e2e0f0] bg-gradient-to-b from-white to-[#fbfaff] p-3.5 shadow-2xs dark:border-white/[0.09] dark:from-white/[0.05] dark:to-white/[0.02] sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5a63df]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df] dark:bg-[#8f97ff]" />
                    {isFallbackTask || primaryTaskIsToday
                      ? 'STEP 1 · DO THIS NEXT'
                      : 'STEP 1 · NEXT IN PLAN'}
                  </span>
                  {todayIsRestDay && !isFallbackTask && <Pill tone="neutral">Rest day today</Pill>}
                  {isFallbackTask && (
                    <Pill tone="accent">
                      <Sparkles className="h-3 w-3" />
                      Suggested
                    </Pill>
                  )}
                </div>
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

              <h2 className="mt-2.5 text-base font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-lg">
                {titleText}
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {getFriendlyPlanText(reasonText)}
              </p>
              {goalText && (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#ebe9f6] bg-[#f8f7fd]/80 px-2.5 py-1.5 text-xs text-slate-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-300">
                  <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />
                  <span className="min-w-0 flex-1">
                    <strong className="font-bold text-slate-900 dark:text-white">Goal:</strong>{' '}
                    {goalText}
                  </span>
                </div>
              )}

              {/* Direct action bar right under Step 1 */}
              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#eeecf8] pt-3 dark:border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => primaryTask && startTask(primaryTask)}
                  disabled={!primaryTask}
                  className="group inline-flex h-9.5 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all duration-150 ease-smooth-out hover:bg-[#4850c8] hover:shadow-sm active:scale-[0.96] disabled:cursor-default disabled:opacity-50 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]"
                >
                  {isFallbackTask ? 'Start this' : 'Continue learning'}{' '}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 ease-smooth-out group-hover:translate-x-0.5" />
                </button>
                <p className={cn('text-[11px] font-medium leading-snug sm:flex-1', MUTED)}>
                  {isFallbackTask
                    ? 'Nothing is scheduled today — this is the work that moves your stage furthest.'
                    : todayIsRestDay && primaryTaskDayLabel
                      ? `Your plan keeps today free. This is scheduled for ${primaryTaskDayLabel} — start it early if you want to.`
                      : primaryTaskDayLabel
                        ? `Scheduled for ${primaryTaskDayLabel}. Finishing it feeds your next score check.`
                        : 'Finishing it feeds your next score check.'}
                </p>
              </div>
            </div>

            {/* Step 2+: Upcoming Flow / Queue */}
            {queuedTasks.length > 0 ? (
              <div className="mt-3.5 flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <Eyebrow className="text-slate-500 dark:text-slate-400">
                    Then in your queue
                  </Eyebrow>
                  <span className="rounded-full bg-[#f4f3fb] px-2 py-0.5 font-mono text-[10px] font-bold text-[#5a63df] dark:bg-white/8 dark:text-[#afb5ff]">
                    {queuedTasks.length} upcoming
                  </span>
                </div>
                <QueueList tasks={queuedTasks} onStart={startTask} />
              </div>
            ) : (
              <div className="mt-3.5">
                <StageStrip pathProgress={pathProgress} />
              </div>
            )}

            <p className="sr-only">Finished tasks are never turned into a predicted IELTS score.</p>
          </div>

          <PlanSignalsCard
            generatedAt={path?.generated_at}
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

        {/* One instrument rail, not four cards. These are four one-line facts;
            giving each its own bordered panel inside the hero's own panel spent
            a third of the strip's height on chrome and drew three concentric
            rules around a single number. */}
        <StatRail className="border-t border-[#eeedf7] dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            aria-label={`Target band: ${Number(targetBand || 7).toFixed(1)}. Edit your plan goals.`}
            className="group relative text-left transition-all duration-150 ease-smooth-out hover:bg-[#5a63df]/[0.07] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a63df] dark:hover:bg-[#8f97ff]/[0.10]"
          >
            <Stat
              bare
              icon={Target}
              tone="accent"
              label="Target band"
              value={Number(targetBand || 7).toFixed(1)}
              sub="Goal"
              action={
                <Pencil
                  aria-hidden="true"
                  className="h-3 w-3 text-slate-400 opacity-40 transition-all duration-150 group-hover:opacity-100 group-hover:text-[#5a63df] dark:text-slate-400 dark:group-hover:text-[#afb5ff]"
                />
              }
            />
          </button>

          <div className="text-left">
            <Stat
              bare
              icon={Gauge}
              tone={readiness?.overall?.available ? 'sky' : 'neutral'}
              label="Recent score level"
              value={readinessValue}
              sub={readinessSub}
            />
          </div>

          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            aria-label={`Weekly study time: ${formatMinutes(weeklyCapacity)}. Edit your plan goals.`}
            className="group relative text-left transition-all duration-150 ease-smooth-out hover:bg-[#5a63df]/[0.07] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a63df] dark:hover:bg-[#8f97ff]/[0.10]"
          >
            <Stat
              bare
              icon={Clock3}
              tone="amber"
              label="Weekly study time"
              value={formatMinutes(weeklyCapacity)}
              sub="Your budget"
              action={
                <Pencil
                  aria-hidden="true"
                  className="h-3 w-3 text-slate-400 opacity-40 transition-all duration-150 group-hover:opacity-100 group-hover:text-[#5a63df] dark:text-slate-400 dark:group-hover:text-[#afb5ff]"
                />
              }
            />
          </button>

          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            aria-label={`Exam date: ${examHint}. Edit your plan goals.`}
            className="group relative text-left transition-all duration-150 ease-smooth-out hover:bg-[#5a63df]/[0.07] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a63df] dark:hover:bg-[#8f97ff]/[0.10]"
          >
            <Stat
              bare
              icon={CalendarDays}
              tone={examDatePassed ? 'warn' : 'rose'}
              label="Exam date"
              value={examValue}
              unit={examUnit}
              sub={examHint}
              action={
                <Pencil
                  aria-hidden="true"
                  className="h-3 w-3 text-slate-400 opacity-70 transition-all duration-150 group-hover:opacity-100 group-hover:text-[#5a63df] dark:text-slate-400 dark:group-hover:text-[#afb5ff]"
                />
              }
            />
          </button>
        </StatRail>
      </section>
    </>
  );
}

export default function HeroSection(props) {
  return <HeroBanner {...props} />;
}
