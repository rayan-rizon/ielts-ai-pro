import React, { useState } from 'react';
import { CalendarClock, CalendarDays, Check, ChevronDown, Play, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/cn';
import {
  DAY_FORMAT,
  formatMinutes,
  getDaySummaryMeta,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getModuleStyle,
} from './dashboardUtils';

function TaskDetails({ task, canReschedule, onReschedule }) {
  const selectedDate = React.useMemo(() => {
    if (!task.scheduled_date) return undefined;
    const parsed = parseISO(task.scheduled_date);
    return isValid(parsed) ? parsed : undefined;
  }, [task.scheduled_date]);

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-white/5 dark:text-slate-300 sm:ml-10">
      <p>
        <strong className="font-black text-slate-900 dark:text-white">Why this helps:</strong>{' '}
        {getFriendlyPlanText(
          task.reason || task.description || 'This matches your recent practice results.'
        )}
      </p>
      <p className="mt-1.5">
        <strong className="font-black text-slate-900 dark:text-white">Goal:</strong>{' '}
        {getFriendlyPlanText(task.success_criterion || 'Complete the task and review the outcome.')}
      </p>
      {task.id && canReschedule && (
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
          <CalendarClock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />{' '}
          Move to date
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 min-w-0 flex-1 justify-start rounded-xl border border-slate-200 bg-white px-2.5 text-[10px] font-bold dark:border-white/10 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all outline-none"
              >
                {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-2xl border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden"
              align="start"
            >
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onReschedule(task, format(date, 'yyyy-MM-dd'));
                  }
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

function CompletionControl({ task, friendlyTitle, onToggle, size = 'sm' }) {
  const verified = task.completion_policy === 'verified';
  const dimensions = size === 'md' ? 'h-9 w-9' : 'h-8 w-8';

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
          'flex shrink-0 items-center justify-center rounded-xl border',
          dimensions,
          task.is_completed
            ? 'border-emerald-300 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400'
            : 'border-indigo-200 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/30 dark:text-indigo-300'
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
        'flex shrink-0 items-center justify-center rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        dimensions,
        task.is_completed
          ? 'border-emerald-300 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-400'
          : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10'
      )}
    >
      <Check className="h-4 w-4" />
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
        'min-w-0 rounded-2xl bg-white p-2.5 shadow-sm dark:bg-slate-950/60 sm:p-3',
        task.is_completed && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-2.5">
        <CompletionControl
          task={task}
          friendlyTitle={friendlyTitle}
          onToggle={onToggle}
          size="sm"
        />
        <span
          className={cn(
            'hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold sm:flex',
            style.surface,
            style.color
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <button
          type="button"
          onClick={onExpand}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="flex items-center gap-2">
            <span className="line-clamp-2 text-xs font-black leading-snug text-slate-900 dark:text-white">
              {friendlyTitle}
            </span>
            {task.is_optional && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">
                Optional
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {formatMinutes(task.estimated_time || task.estimated_minutes)} ·{' '}
            <span className="capitalize">{task.priority || 'medium'} priority</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onStart(task)}
          aria-label={`Start ${friendlyTitle}`}
          className="flex h-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-3 text-[10px] font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <Play className="h-3 w-3 fill-current sm:mr-1" />{' '}
          <span className="hidden sm:inline">Start</span>
        </button>
        <button
          type="button"
          onClick={onExpand}
          aria-label={`${expanded ? 'Hide' : 'Show'} details for ${friendlyTitle}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-white/5"
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

function DayDateBadge({ date, isToday }) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl text-center transition-all duration-200',
        isToday
          ? 'bg-[#505bdd] text-white shadow-sm'
          : 'border border-slate-200/60 bg-slate-50/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
      )}
    >
      <span
        className={cn(
          'text-[8px] font-extrabold uppercase tracking-wider',
          isToday ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-400'
        )}
      >
        {DAY_FORMAT.format(date).split(',')[0]}
      </span>
      <span className="mt-0.5 text-base font-black leading-none">{date.getDate()}</span>
    </div>
  );
}

function PrimaryTaskSummary({ primary, day, isToday, onExpand }) {
  const { titleText, durationText, overflow, additionalTasks } = getDaySummaryMeta(day, primary);
  const friendlyTitle = primary ? getFriendlyTaskTitle(primary) : titleText;

  return (
    <button
      type="button"
      onClick={onExpand}
      className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'line-clamp-2 min-w-0 flex-1 text-xs font-black leading-snug text-slate-900 dark:text-white',
            primary?.is_completed && 'line-through opacity-50'
          )}
        >
          {friendlyTitle}
        </span>
        {additionalTasks > 0 && (
          <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[8px] font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            +{additionalTasks}
          </span>
        )}
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
        <span>{isToday ? 'Today' : DAY_FORMAT.format(day.date)}</span>
        <span>{durationText}</span>
        {overflow && (
          <span className="font-black text-amber-600 dark:text-amber-400">
            Move to an available day
          </span>
        )}
      </span>
    </button>
  );
}

function PrimaryTaskActions({ primary, onToggle, onStart }) {
  if (!primary) return null;
  const friendlyTitle = getFriendlyTaskTitle(primary);

  return (
    <div className="flex items-center gap-2">
      <CompletionControl
        task={primary}
        friendlyTitle={friendlyTitle}
        onToggle={onToggle}
        size="md"
      />
      <button
        type="button"
        onClick={() => onStart(primary)}
        aria-label={`Start ${friendlyTitle}`}
        className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        <Play className="h-3 w-3 fill-current sm:mr-1.5" />
        <span className="hidden sm:inline">Start</span>
      </button>
    </div>
  );
}

function ExpandedDayTaskList({
  tasks,
  canReschedule,
  expandedTask,
  setExpandedTask,
  onToggle,
  onStart,
  onReschedule,
}) {
  return (
    <div className="space-y-2 border-t border-slate-200/80 bg-slate-50/80 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.02]">
      <p className="px-1 text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
        All tasks for this day
      </p>
      {tasks.map((task) => (
        <TaskRow
          key={task.activity_key}
          task={task}
          canReschedule={canReschedule}
          expanded={expandedTask === task.activity_key}
          onExpand={() =>
            setExpandedTask((current) => (current === task.activity_key ? null : task.activity_key))
          }
          onToggle={onToggle}
          onStart={onStart}
          onReschedule={onReschedule}
        />
      ))}
    </div>
  );
}

function ScheduleDayRow({
  day,
  isToday,
  expanded,
  onExpand,
  canReschedule,
  expandedTask,
  setExpandedTask,
  onToggle,
  onStart,
  onReschedule,
}) {
  const primary = day.tasks[0] || null;
  return (
    <div
      className={cn(
        'border-b border-slate-200/80 last:border-b-0 dark:border-white/10',
        isToday && 'bg-indigo-500/[0.05] dark:bg-indigo-500/[0.08]'
      )}
    >
      <div className="grid min-h-[72px] grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:px-3.5">
        <DayDateBadge date={day.date} isToday={isToday} />
        <PrimaryTaskSummary primary={primary} day={day} isToday={isToday} onExpand={onExpand} />
        <div className="col-start-2 flex items-center justify-end gap-1.5 sm:col-start-3 sm:row-start-1">
          <PrimaryTaskActions primary={primary} onToggle={onToggle} onStart={onStart} />
          <button
            type="button"
            onClick={onExpand}
            aria-label={`${expanded ? 'Hide' : 'Show'} ${DAY_FORMAT.format(day.date)} tasks`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-white/5"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {expanded && day.tasks.length > 0 && (
        <ExpandedDayTaskList
          tasks={day.tasks}
          canReschedule={canReschedule}
          expandedTask={expandedTask}
          setExpandedTask={setExpandedTask}
          onToggle={onToggle}
          onStart={onStart}
          onReschedule={onReschedule}
        />
      )}
    </div>
  );
}

export default function WeekPlan({
  days,
  canReschedule,
  expandedTask,
  setExpandedTask,
  onToggle,
  onStart,
  onReschedule,
}) {
  const [showFullWeek, setShowFullWeek] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const visibleDays = showFullWeek ? days : days.slice(0, 4);
  const plannedDays = days.filter((day) => day.tasks.length > 0).length;
  const openDays = days.filter((day) => day.tasks.length === 0).length;
  const daysToMove = days.filter((day) => {
    const plannedMinutes = day.tasks.reduce(
      (total, task) => total + Number(task.estimated_time || task.estimated_minutes || 0),
      0
    );
    return day.tasks.length > 0 && (!day.capacity || plannedMinutes > day.capacity);
  }).length;

  return (
    <section
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 backdrop-blur hover:shadow-[0_24px_55px_-38px_rgba(48,58,128,0.85)] md:col-span-2 2xl:col-span-1 dark:border-white/10 dark:bg-[#10131f] p-5 sm:p-6"
      aria-labelledby="week-plan-title"
    >
      {/* Corner Light Gradient Glow matching Grammar Lab */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#dcd8ff]/50 blur-2xl dark:bg-indigo-900/30"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe3ff] bg-[#eef0ff] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#505bdd] shadow-2xs dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            <CalendarDays
              className="h-3.5 w-3.5 text-[#505bdd] dark:text-indigo-300"
              aria-hidden="true"
            />
            <span>This week's plan</span>
          </div>
          <h2
            id="week-plan-title"
            className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl"
          >
            Your next 7 days
          </h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            See one main task per day. Open a day for the reason and extra practice.
          </p>
        </div>
        <Badge className="whitespace-nowrap rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3 py-0.5 text-[9px] font-bold text-indigo-600 backdrop-blur-md shadow-2xs dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/25">
          {plannedDays} study {plannedDays === 1 ? 'day' : 'days'}
        </Badge>
      </div>

      <div className="mt-5 flex-1 overflow-hidden rounded-2xl border border-[#e0e4f1] bg-white shadow-sm dark:border-white/10 dark:bg-[#10131f]/90">
        {visibleDays.map((day, dayIndex) => (
          <ScheduleDayRow
            key={day.dateKey}
            day={day}
            isToday={dayIndex === 0}
            expanded={expandedDay === day.dateKey}
            onExpand={() =>
              setExpandedDay((current) => (current === day.dateKey ? null : day.dateKey))
            }
            canReschedule={canReschedule}
            expandedTask={expandedTask}
            setExpandedTask={setExpandedTask}
            onToggle={onToggle}
            onStart={onStart}
            onReschedule={onReschedule}
          />
        ))}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {daysToMove
            ? `${daysToMove} ${daysToMove === 1 ? 'day needs' : 'days need'} moving`
            : `${openDays} open ${openDays === 1 ? 'day' : 'days'}`}
        </p>
        <button
          type="button"
          onClick={() => setShowFullWeek((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#505bdd] transition-colors hover:bg-[#eef0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5661e9] dark:text-indigo-300 dark:hover:bg-indigo-500/20"
        >
          {showFullWeek ? 'Show key days' : 'Show all 7 days'}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              showFullWeek && 'rotate-180'
            )}
          />
        </button>
      </div>
    </section>
  );
}
