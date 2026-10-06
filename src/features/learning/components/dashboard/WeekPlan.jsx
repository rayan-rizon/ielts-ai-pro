import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarClock, Check, CheckCircle2, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  WELL,
} from '@/features/dashboard/components/primitives';
import {
  formatMinutes,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getModuleStyle,
  getModuleTone,
  getTaskModeLabel,
  getTaskPurpose,
} from './dashboardUtils';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const FULL_DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});
const SHORT_DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const taskMinutes = (task) => Number(task.estimated_time || task.estimated_minutes || 0);
const sumMinutes = (tasks) => tasks.reduce((total, task) => total + taskMinutes(task), 0);
const plannedMinutes = (day) => sumMinutes(day.tasks);
const doneMinutes = (day) => sumMinutes(day.tasks.filter((task) => task.is_completed));
const isOverloaded = (day) =>
  day.tasks.length > 0 && (!day.capacity || plannedMinutes(day) > day.capacity);
/** Matches the scheduler and the reschedule RPC: under 20 minutes is a rest day. */
const MIN_STUDY_MINUTES = 20;
const isStudyDay = (day) => Number(day.capacity || 0) >= MIN_STUDY_MINUTES;
/** An empty day past the end of the saved plan has simply not been planned yet. */
const isUnplanned = (day) => day.inPlan === false && day.tasks.length === 0;
const isDayDone = (day) => day.tasks.length > 0 && day.tasks.every((task) => task.is_completed);

const emptyDayLabel = (day) =>
  isUnplanned(day) ? 'Not planned yet' : isStudyDay(day) ? 'Nothing scheduled' : 'Rest day';

const dayHeading = (day, index) => {
  if (index === 0) return `Today · ${SHORT_DAY_FORMAT.format(day.date)}`;
  if (index === 1) return `Tomorrow · ${SHORT_DAY_FORMAT.format(day.date)}`;
  return FULL_DAY_FORMAT.format(day.date);
};

function TaskDetails({ task, canReschedule, onReschedule, movableDates }) {
  const selectedDate = useMemo(() => {
    if (!task.scheduled_date) return undefined;
    const parsed = parseISO(task.scheduled_date);
    return isValid(parsed) ? parsed : undefined;
  }, [task.scheduled_date]);
  const reason = task.reason || task.description;

  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-3 text-[12px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
      <dt className="font-extrabold text-slate-900 dark:text-slate-100">Goal</dt>
      <dd>
        {getFriendlyPlanText(task.success_criterion || 'Complete the task and review the outcome.')}
      </dd>
      {reason && (
        <>
          <dt className="font-extrabold text-slate-900 dark:text-slate-100">Why</dt>
          <dd>{getFriendlyPlanText(reason)}</dd>
        </>
      )}
      {task.id && canReschedule && !task.is_completed && (
        <>
          <dt className="self-center font-extrabold text-slate-900 dark:text-slate-100">Day</dt>
          <dd>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  aria-label="Move to another study day"
                  className="h-8 min-w-0 justify-start gap-1.5 rounded-lg border-[#e4e2f0] bg-white px-2.5 font-mono text-[11px] font-bold tabular-nums text-slate-800 transition-colors hover:bg-slate-50 dark:border-white/15 dark:bg-[#141319] dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <CalendarClock className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#8f97ff]" />
                  {selectedDate ? format(selectedDate, 'EEE, MMM d') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-0 shadow-sm dark:border-white/15 dark:bg-[#141319]"
                align="start"
              >
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) onReschedule(task, format(date, 'yyyy-MM-dd'));
                  }}
                  // Only study days inside this week: a date past it would drop
                  // the task out of view, and the server refuses rest days.
                  disabled={(date) => !movableDates?.has(format(date, 'yyyy-MM-dd'))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </dd>
        </>
      )}
    </dl>
  );
}

/**
 * The circle at the start of a task row. Verified tasks complete themselves
 * from the activity result, so for them it is a status light, not a control.
 */
function CompletionControl({ task, friendlyTitle, onToggle }) {
  const done = Boolean(task.is_completed);
  const shape = cn(
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
    done
      ? 'border-[rgb(var(--signal-ok))] bg-[rgb(var(--signal-ok))] text-white'
      : 'border-slate-300 bg-white text-transparent dark:border-white/25 dark:bg-transparent'
  );

  if (task.completion_policy === 'verified') {
    return (
      <span
        role="img"
        aria-label={
          done ? `${friendlyTitle}: done` : `${friendlyTitle}: not done yet, ticks off by itself`
        }
        title={done ? 'Done' : 'Ticks off by itself when you finish it'}
        className={shape}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(task)}
      aria-label={done ? `Mark ${friendlyTitle} not done` : `Mark ${friendlyTitle} done`}
      className={cn(
        shape,
        'active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        !done && 'hover:border-[#5a63df] hover:text-[#5a63df]/40'
      )}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
}

/**
 * One day in the strip: weekday, date and a bar that fills as that day's tasks
 * are finished. Rest and not-yet-planned days say so in one word.
 */
function CalendarDay({ day, isToday, isSelected, onSelect }) {
  const minutes = plannedMinutes(day);
  const allDone = isDayDone(day);
  const donePct = minutes ? Math.round((doneMinutes(day) / minutes) * 100) : 0;
  const hasTasks = day.tasks.length > 0;
  const label = hasTasks ? null : isUnplanned(day) ? '—' : isStudyDay(day) ? 'Free' : 'Rest';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${FULL_DAY_FORMAT.format(day.date)}. ${
        hasTasks
          ? `${day.tasks.length} task${day.tasks.length === 1 ? '' : 's'}, ${formatMinutes(minutes)} planned${
              allDone ? ', all done' : ''
            }`
          : emptyDayLabel(day)
      }.`}
      className={cn(
        'group flex min-w-0 flex-col items-center gap-1 rounded-lg border px-0 py-1.5 transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] sm:rounded-xl sm:py-2',
        isSelected
          ? 'border-[#5a63df] bg-white shadow-xs dark:border-[#8f97ff]/70 dark:bg-white/8'
          : 'border-transparent hover:border-[#e4e2f0] hover:bg-white dark:hover:border-white/10 dark:hover:bg-white/5'
      )}
    >
      <span
        className={cn(
          'max-w-full truncate text-[9px] font-bold uppercase tracking-wide sm:text-[10px]',
          isToday ? 'text-[#5a63df] dark:text-[#afb5ff]' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {WEEKDAY_FORMAT.format(day.date).slice(0, 3)}
      </span>

      <span
        className={cn(
          NUM,
          'flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-extrabold sm:h-8 sm:w-8 sm:text-[15px]',
          isToday
            ? 'bg-[#5a63df] text-white'
            : allDone
              ? 'bg-[rgb(var(--signal-ok)/0.15)] text-[rgb(var(--signal-ok))]'
              : hasTasks
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 dark:text-slate-500'
        )}
      >
        {allDone && !isToday ? <Check className="h-4 w-4" strokeWidth={3} /> : day.date.getDate()}
      </span>

      {label ? (
        <span className="h-1.5 text-[9px] font-bold leading-[6px] text-slate-400 sm:text-[10px] dark:text-slate-500">
          {label}
        </span>
      ) : (
        <span
          className="h-1.5 w-[65%] overflow-hidden rounded-full bg-slate-200/90 dark:bg-white/12"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full bg-[rgb(var(--signal-ok))] transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${donePct}%` }}
          />
        </span>
      )}
    </button>
  );
}

function TaskRow({
  task,
  canReschedule,
  movableDates,
  expanded,
  onExpand,
  onToggle,
  onStart,
  onReschedule,
}) {
  const reduceMotion = useReducedMotion();
  const style = getModuleStyle(task.module);
  const Icon = style.icon;
  const friendlyTitle = getFriendlyTaskTitle(task);
  const detailsId = `task-details-${task.activity_key || task.id}`;
  const isExam = getTaskModeLabel(task) === 'Exam Mode';
  const done = Boolean(task.is_completed);

  return (
    <li className="min-w-0 border-b border-[#eceafa] px-3 py-2.5 last:border-b-0 dark:border-white/[0.07]">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <CompletionControl task={task} friendlyTitle={friendlyTitle} onToggle={onToggle} />
        <IconChip
          icon={Icon}
          tone={getModuleTone(task.module)}
          size="md"
          className="hidden sm:inline-flex"
        />

        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="group min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
        >
          <span
            className={cn(
              'block text-[13px] font-extrabold leading-snug tracking-tight text-slate-900 sm:text-[13.5px] dark:text-slate-50',
              done && 'text-slate-500 line-through decoration-slate-400 dark:text-slate-400'
            )}
          >
            {friendlyTitle}
            {isExam && (
              <Pill tone="amber" className="ml-1.5 align-[2px]">
                Exam
              </Pill>
            )}
          </span>
          <span
            className={cn(
              'mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0 text-[11.5px] font-medium',
              MUTED
            )}
          >
            <span className={cn(NUM, 'shrink-0 font-bold text-slate-700 dark:text-slate-200')}>
              {formatMinutes(taskMinutes(task))}
            </span>
            <span className="min-w-0">
              {getTaskPurpose(task)}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'ml-0.5 inline h-3.5 w-3.5 align-[-3px] text-slate-400 transition-transform duration-200 ease-smooth-out group-hover:text-[#5a63df]',
                  expanded && 'rotate-180'
                )}
              />
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStart(task)}
          aria-label={`${done ? 'Open' : 'Start'} ${friendlyTitle}`}
          className={cn(
            'flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] sm:h-9 sm:px-4',
            done
              ? 'border border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/15 dark:bg-transparent dark:text-slate-300'
              : 'bg-[#5a63df] text-white shadow-xs hover:bg-[#4850c8]'
          )}
        >
          {done ? (
            'Open'
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">Start</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key={detailsId}
            id={detailsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: reduceMotion
                ? { duration: 0 }
                : {
                    height: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2, delay: 0.04, ease: [0.22, 1, 0.36, 1] },
                  },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: reduceMotion
                ? { duration: 0 }
                : {
                    opacity: { duration: 0.15, ease: 'easeOut' },
                    height: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                  },
            }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 sm:pl-[4.25rem]">
              <TaskDetails
                task={task}
                canReschedule={canReschedule}
                onReschedule={onReschedule}
                movableDates={movableDates}
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/**
 * The week calendar.
 *
 * The whole week is visible at once as a strip of day columns; picking a day
 * opens its tasks. Each task carries its minutes and a few words on why it is
 * there — everything else waits behind a tap. Main tasks come first; extras sit
 * under "If you have time". Text appears below the list only for a warning.
 */
export default function WeekPlan({
  days,
  canReschedule,
  onCustomize,
  expandedTask,
  setExpandedTask,
  onToggle,
  onStart,
  onReschedule,
}) {
  // Open on today when there is work on it, otherwise on the next day that has
  // something outstanding — the day the learner most likely came here to see.
  const defaultIndex = useMemo(() => {
    if (days[0]?.tasks.length) return 0;
    const next = days.findIndex((day) => day.tasks.some((task) => !task.is_completed));
    return next >= 0 ? next : 0;
  }, [days]);
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  useEffect(() => setSelectedIndex(defaultIndex), [defaultIndex]);

  const selectedDay = days[selectedIndex] || days[0];
  const allTasks = days.flatMap((day) => day.tasks);
  const doneTasks = allTasks.filter((task) => task.is_completed).length;
  const plannedDays = days.filter((day) => day.tasks.length > 0).length;
  const unplannedDays = days.filter(isUnplanned).length;
  const daysToMove = days.filter(isOverloaded).length;
  const movableDates = useMemo(
    () => new Set(days.filter(isStudyDay).map((day) => day.dateKey)),
    [days]
  );
  const selectedOver = selectedDay ? isOverloaded(selectedDay) : false;
  const mainTasks = selectedDay?.tasks.filter((task) => !task.is_optional) || [];
  const extraTasks = selectedDay?.tasks.filter((task) => task.is_optional) || [];

  const renderTask = (task) => (
    <TaskRow
      key={task.activity_key}
      task={task}
      canReschedule={canReschedule}
      movableDates={movableDates}
      expanded={expandedTask === task.activity_key}
      onExpand={() =>
        setExpandedTask((current) => (current === task.activity_key ? null : task.activity_key))
      }
      onToggle={onToggle}
      onStart={onStart}
      onReschedule={onReschedule}
    />
  );

  const warning = daysToMove
    ? `${daysToMove} ${daysToMove === 1 ? 'day is' : 'days are'} over your study time.`
    : unplannedDays
      ? `${unplannedDays} ${unplannedDays === 1 ? 'day is' : 'days are'} not planned yet.`
      : null;

  return (
    <section
      className={cn(PANEL, 'flex h-full min-w-0 flex-col p-3.5 sm:p-5')}
      aria-labelledby="week-plan-title"
    >
      <PanelTitle
        label={<span id="week-plan-title">{"This week's plan"}</span>}
        accent
        tip="Tasks tick off by themselves when you finish them. The bar under each day fills as you go."
        action={
          allTasks.length > 0 && (
            <Pill tone={doneTasks === allTasks.length ? 'ok' : 'accent'}>
              <span className={NUM}>
                {doneTasks}/{allTasks.length}
              </span>{' '}
              done
            </Pill>
          )
        }
      />

      <div
        className={cn(
          'mt-3 grid grid-cols-7 gap-0.5 rounded-xl border border-[#e4e2f0] p-1 sm:gap-1.5 sm:p-2 dark:border-white/8',
          WELL
        )}
      >
        {days.map((day, index) => (
          <CalendarDay
            key={day.dateKey}
            day={day}
            isToday={index === 0}
            isSelected={selectedIndex === index}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {selectedDay && (
        <div className="mt-3.5 flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="min-w-0 truncate text-[13.5px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              {dayHeading(selectedDay, selectedIndex)}
            </h3>
            {selectedDay.tasks.length > 0 && (
              <span
                className={cn(
                  NUM,
                  'shrink-0 text-[12px] font-bold',
                  selectedOver ? 'text-[rgb(var(--signal-warn))]' : MUTED
                )}
              >
                {formatMinutes(plannedMinutes(selectedDay))}
              </span>
            )}
          </div>

          {selectedOver && (
            <p className="mt-1 text-[11.5px] font-semibold text-[rgb(var(--signal-warn))]">
              Over your time for this day — move to an available day in a task&apos;s details.
            </p>
          )}

          {selectedDay.tasks.length > 0 ? (
            <div className="mt-2 space-y-2">
              {mainTasks.length > 0 && (
                <ul className="overflow-hidden rounded-xl border border-[#e4e2f0] bg-white dark:border-white/8 dark:bg-white/2">
                  {mainTasks.map(renderTask)}
                </ul>
              )}
              {extraTasks.length > 0 && (
                <div>
                  <p className={cn(MICRO, 'mb-1 px-1 text-slate-500 dark:text-slate-400')}>
                    {mainTasks.length > 0 ? 'If you have time' : 'Extra practice'}
                  </p>
                  <ul className="overflow-hidden rounded-xl border border-dashed border-[#dcd9ee] bg-white/60 dark:border-white/12 dark:bg-white/[0.015]">
                    {extraTasks.map(renderTask)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-[#e4e2f0] bg-white dark:border-white/8 dark:bg-white/2">
              {isUnplanned(selectedDay) ? (
                <Empty icon={CalendarClock}>
                  Not planned yet. It is added when your plan renews.
                </Empty>
              ) : plannedDays === 0 ? (
                // Nothing scheduled *all week* is not a rest day, it is a plan
                // with no work in it, so offer the way out.
                <div className="flex flex-col items-center gap-2.5 px-4 py-7 text-center">
                  <IconChip icon={CalendarClock} tone="amber" size="md" />
                  <p className="text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Nothing is scheduled this week
                  </p>
                  {onCustomize && (
                    <button
                      type="button"
                      onClick={onCustomize}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                    >
                      Set your study days <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <Empty icon={CheckCircle2}>
                  {isStudyDay(selectedDay) ? 'Nothing scheduled. Pick another day.' : 'Rest day.'}
                </Empty>
              )}
            </div>
          )}
        </div>
      )}

      {warning && (
        <p
          className={cn(
            'mt-3 text-[11.5px] font-semibold',
            daysToMove ? 'text-[rgb(var(--signal-warn))]' : MUTED
          )}
        >
          {warning}
        </p>
      )}
    </section>
  );
}
