import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Play,
  ShieldCheck,
} from 'lucide-react';
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
} from '@/features/dashboard/components/primitives';
import {
  DAY_FORMAT,
  formatMinutes,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getModuleStyle,
  getModuleTone,
} from './dashboardUtils';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const FULL_DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

/** Module dots on the calendar strip, matching the IconChip tone of each module. */
const DOT_TONE = {
  emerald: 'bg-emerald-500 dark:bg-emerald-400',
  rose: 'bg-rose-500 dark:bg-rose-400',
  sky: 'bg-sky-500 dark:bg-sky-400',
  amber: 'bg-amber-500 dark:bg-amber-400',
  accent: 'bg-[#5a63df] dark:bg-[#8f97ff]',
};

const taskMinutes = (task) => Number(task.estimated_time || task.estimated_minutes || 0);
const plannedMinutes = (day) => day.tasks.reduce((total, task) => total + taskMinutes(task), 0);
const isOverloaded = (day) =>
  day.tasks.length > 0 && (!day.capacity || plannedMinutes(day) > day.capacity);

function TaskDetails({ task, canReschedule, onReschedule }) {
  const selectedDate = useMemo(() => {
    if (!task.scheduled_date) return undefined;
    const parsed = parseISO(task.scheduled_date);
    return isValid(parsed) ? parsed : undefined;
  }, [task.scheduled_date]);

  return (
    <div className="mt-2.5 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-3 text-[11px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
      {['reading', 'writing', 'listening', 'speaking'].includes(task.module) && (
        <p className="mb-1.5">
          <strong>
            {['exam', 'mock'].includes(task.requested_mode) ? 'Exam Mode' : 'Practice Mode'}
          </strong>
          {' — '}
          {['exam', 'mock'].includes(task.requested_mode)
            ? 'Check your progress under test conditions, without hints.'
            : 'Learn at your pace and review the feedback.'}
        </p>
      )}
      <p>
        <strong className="font-extrabold text-slate-900 dark:text-slate-100">
          Why this helps:
        </strong>{' '}
        {getFriendlyPlanText(
          task.reason || task.description || 'This matches your recent practice results.'
        )}
      </p>
      <p className="mt-1.5">
        <strong className="font-extrabold text-slate-900 dark:text-slate-100">Goal:</strong>{' '}
        {getFriendlyPlanText(task.success_criterion || 'Complete the task and review the outcome.')}
      </p>
      {task.id && canReschedule && (
        <div
          className={cn(
            'mt-3 flex items-center gap-2',
            MICRO,
            'font-extrabold text-slate-700 dark:text-slate-300'
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#8f97ff]" /> Move
          to date
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 min-w-0 flex-1 justify-start rounded-lg border-[#e4e2f0] bg-white px-2.5 text-[10px] font-mono tabular-nums font-bold text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:bg-[#141319] dark:text-slate-200 dark:hover:bg-white/5 transition-colors"
              >
                {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select date'}
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
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

function CompletionControl({ task, friendlyTitle, onToggle }) {
  const verified = task.completion_policy === 'verified';

  if (verified) {
    return (
      <span
        role="status"
        aria-label={
          task.is_completed
            ? `${friendlyTitle} verified complete`
            : `${friendlyTitle} completes automatically from your activity result`
        }
        title={
          task.is_completed
            ? 'Verified from your completed activity'
            : 'Complete this through the Start button'
        }
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
          task.is_completed
            ? 'border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]'
            : 'border-[#5a63df]/35 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/40 dark:bg-[#8f97ff]/20 dark:text-[#a9afff]'
        )}
      >
        {task.is_completed ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(task)}
      aria-label={
        task.is_completed ? `Mark ${friendlyTitle} incomplete` : `Mark ${friendlyTitle} complete`
      }
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        task.is_completed
          ? 'border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]'
          : 'border-[#e4e2f0] bg-slate-50/80 text-slate-400 hover:border-[#5a63df] hover:text-[#5a63df] dark:border-white/15 dark:bg-white/4 dark:text-slate-300 dark:hover:border-[#8f97ff] dark:hover:text-[#a9afff]'
      )}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

/**
 * One day button in the calendar strip.
 *
 * Carries four signals at a glance without a single word of copy: today's ring,
 * one dot per scheduled task tinted by module, a load bar of planned time
 * against the time saved for that day, and an amber bar when the day is over
 * its capacity.
 */
function CalendarDay({ day, isToday, isSelected, onSelect }) {
  const minutes = plannedMinutes(day);
  const capacity = Number(day.capacity || 0);
  const over = isOverloaded(day);
  const allDone = day.tasks.length > 0 && day.tasks.every((task) => task.is_completed);
  const fill =
    capacity || minutes ? Math.min(100, (minutes / Math.max(capacity, minutes)) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${FULL_DAY_FORMAT.format(day.date)}. ${
        day.tasks.length
          ? `${day.tasks.length} task${day.tasks.length === 1 ? '' : 's'}, ${formatMinutes(minutes)} planned`
          : 'Rest day'
      }.`}
      className={cn(
        'group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        isSelected
          ? 'border-[#5a63df] bg-[#5a63df]/10 dark:border-[#8f97ff]/60 dark:bg-[#8f97ff]/20'
          : 'border-transparent hover:border-[#e4e2f0] hover:bg-white dark:hover:border-white/10 dark:hover:bg-white/5'
      )}
    >
      <span
        className={cn(
          'text-[9px] font-bold uppercase tracking-wider',
          isToday ? 'text-[#5a63df] dark:text-[#afb5ff]' : 'text-slate-500 dark:text-slate-300'
        )}
      >
        {WEEKDAY_FORMAT.format(day.date).slice(0, 2)}
      </span>

      <span
        className={cn(
          NUM,
          'flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-extrabold transition-transform duration-150 group-hover:scale-105',
          isToday
            ? 'bg-[#5a63df] text-white shadow-xs'
            : allDone
              ? 'bg-[rgb(var(--signal-ok)/0.15)] text-[rgb(var(--signal-ok))] font-black'
              : 'text-slate-800 dark:text-slate-100'
        )}
      >
        {day.date.getDate()}
      </span>

      <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
        {day.tasks.length === 0 ? (
          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/30" />
        ) : (
          day.tasks
            .slice(0, 3)
            .map((task, index) => (
              <span
                key={task.activity_key || index}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  task.is_completed
                    ? 'bg-[rgb(var(--signal-ok))]'
                    : DOT_TONE[getModuleTone(task.module)]
                )}
              />
            ))
        )}
      </span>

      <span
        className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/15"
        aria-hidden="true"
      >
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-500 ease-out',
            over ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[#5a63df] dark:bg-[#8f97ff]'
          )}
          style={{ width: `${fill}%` }}
        />
      </span>
    </button>
  );
}

function TaskRow({ task, canReschedule, expanded, onExpand, onToggle, onStart, onReschedule }) {
  const style = getModuleStyle(task.module);
  const Icon = style.icon;
  const friendlyTitle = getFriendlyTaskTitle(task);

  return (
    <div
      className={cn(
        'min-w-0 border-b border-[#eceafa] px-3.5 py-3.5 last:border-b-0 dark:border-white/[0.07] transition-colors hover:bg-slate-50/60 dark:hover:bg-white/2',
        task.is_completed && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-2.5">
        <CompletionControl task={task} friendlyTitle={friendlyTitle} onToggle={onToggle} />
        <IconChip icon={Icon} tone={getModuleTone(task.module)} className="hidden sm:flex" />
        <button
          type="button"
          onClick={onExpand}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
        >
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'line-clamp-2 text-[13px] font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-100',
                task.is_completed && 'line-through'
              )}
            >
              {friendlyTitle}
            </span>
            {task.is_optional && <Pill tone="accent">Optional</Pill>}
          </span>
          <span className="mt-0.5 block text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-300 font-medium">
            {formatMinutes(taskMinutes(task))} ·{' '}
            <span className="font-sans capitalize">{task.priority || 'medium'} priority</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStart(task)}
          aria-label={`Start ${friendlyTitle}`}
          className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#5a63df] hover:bg-[#4850c8] px-3.5 text-[11px] font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] shadow-xs"
        >
          <Play className="h-3 w-3 fill-current sm:mr-1.5" />{' '}
          <span className="hidden sm:inline">Start</span>
        </button>
        <button
          type="button"
          onClick={onExpand}
          aria-label={`${expanded ? 'Hide' : 'Show'} details for ${friendlyTitle}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </button>
      </div>
      {expanded && (
        <TaskDetails task={task} canReschedule={canReschedule} onReschedule={onReschedule} />
      )}
    </div>
  );
}

/**
 * The week calendar.
 *
 * This replaced a collapsed list that showed four of seven days and one task
 * per day: the whole week is now visible at once as a strip of day columns, and
 * picking a day opens every task scheduled on it. Nothing is hidden behind a
 * "show all" toggle, because the shape of the week *is* the information.
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
  const plannedDays = days.filter((day) => day.tasks.length > 0).length;
  const daysToMove = days.filter(isOverloaded).length;
  const selectedMinutes = selectedDay ? plannedMinutes(selectedDay) : 0;
  const selectedCapacity = Number(selectedDay?.capacity || 0);
  const selectedOver = selectedDay ? isOverloaded(selectedDay) : false;
  const weekRange =
    days.length > 0
      ? `${DAY_FORMAT.format(days[0].date)} – ${DAY_FORMAT.format(days[days.length - 1].date)}`
      : '';

  return (
    <section
      className={cn(PANEL, 'flex h-full min-w-0 flex-col p-4 sm:p-5')}
      aria-labelledby="week-plan-title"
    >
      <PanelTitle
        label="This week's plan"
        accent
        tip="Each day is sized to the study time you set aside for it. Amber means the day is over that limit."
        action={
          <Pill tone={daysToMove ? 'warn' : 'accent'}>
            {plannedDays} study {plannedDays === 1 ? 'day' : 'days'}
          </Pill>
        }
      />
      <p
        id="week-plan-title"
        className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400"
      >
        {weekRange} · pick a day to see everything scheduled on it.
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1 rounded-xl border border-[#e4e2f0] dark:border-white/8 bg-[#f4f3fb]/60 dark:bg-white/3 p-2 sm:gap-1.5 sm:p-2.5">
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
        <div className="mt-3 flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              {selectedIndex === 0 ? 'Today' : FULL_DAY_FORMAT.format(selectedDay.date)}
            </h3>
            <span
              className={cn(
                MICRO,
                selectedOver
                  ? 'text-[rgb(var(--signal-warn))]'
                  : 'text-slate-500 dark:text-slate-300 font-bold'
              )}
            >
              {formatMinutes(selectedMinutes)} planned
              {selectedCapacity ? ` of ${formatMinutes(selectedCapacity)}` : ''}
            </span>
          </div>

          {selectedOver && (
            <p className={cn(MICRO, 'mt-1.5 text-[rgb(var(--signal-warn))]')}>
              Over your saved time — move to an available day from a task&apos;s details.
            </p>
          )}

          <div className="mt-2.5 min-h-[168px] flex-1 overflow-hidden rounded-xl border border-[#e4e2f0] bg-white dark:border-white/8 dark:bg-white/2">
            {selectedDay.tasks.length > 0 ? (
              selectedDay.tasks.map((task) => (
                <TaskRow
                  key={task.activity_key}
                  task={task}
                  canReschedule={canReschedule}
                  expanded={expandedTask === task.activity_key}
                  onExpand={() =>
                    setExpandedTask((current) =>
                      current === task.activity_key ? null : task.activity_key
                    )
                  }
                  onToggle={onToggle}
                  onStart={onStart}
                  onReschedule={onReschedule}
                />
              ))
            ) : plannedDays === 0 ? (
              // Nothing scheduled *all week* is not a rest day, it is a plan
              // with no work in it. This panel is now the largest on the page,
              // so that state has to offer the way out rather than leave the
              // biggest surface here reading as an empty box.
              <div className="flex flex-col items-center gap-2.5 px-4 py-8 text-center">
                <IconChip icon={CalendarClock} tone="amber" size="md" />
                <p className="text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                  No study time is scheduled this week
                </p>
                <p className={cn('max-w-xs text-xs font-medium leading-relaxed', MUTED)}>
                  Your plan has no tasks for any of these seven days. Set the days you are free and
                  it will schedule around them.
                </p>
                {onCustomize && (
                  <button
                    type="button"
                    onClick={onCustomize}
                    className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                  >
                    Set your study days <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <Empty icon={CheckCircle2}>
                Rest day — nothing is scheduled. Pick another day, or add time in your goals.
              </Empty>
            )}
          </div>
        </div>
      )}

      <p
        className={cn(
          MICRO,
          'mt-3 border-t border-[#eceafa] pt-2.5 text-slate-500 dark:text-slate-300 font-bold dark:border-white/[0.07]'
        )}
      >
        {daysToMove
          ? `${daysToMove} ${daysToMove === 1 ? 'day is' : 'days are'} over your weekly budget.`
          : `${days.length - plannedDays} ${days.length - plannedDays === 1 ? 'day has' : 'days have'} nothing scheduled this week.`}
      </p>
    </section>
  );
}
