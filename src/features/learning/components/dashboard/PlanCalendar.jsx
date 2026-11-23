import React, { useMemo, useState } from 'react';
import { Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { CARD, INSET, SECONDARY_TEXT } from './PlanCard';
import { formatMinutes, getFriendlyTaskTitle, getModuleStyle } from './dashboardUtils';
import { buildMonthGrid, getPlanMonths, taskKey } from './studyPlanModel';

const taskMinutes = (task) => Number(task?.estimated_time || task?.estimated_minutes || 0);

const weekday = (date) => date.toLocaleDateString(undefined, { weekday: 'short' });
const shortDate = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const COLUMN =
  'flex flex-col rounded-2xl md:min-h-[200px] border border-[#e4e2f0] bg-[#f4f3fb] transition-colors duration-150 dark:border-white/[0.07] dark:bg-white/[0.03]';
const HATCH =
  'bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgb(90_99_223/0.06)_8px_9px)] dark:bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgba(255_255_255/0.035)_8px_9px)]';

function TaskBlock({ task, selected, draggable, onSelect, onDragStart, onDragEnd }) {
  const Icon = getModuleStyle(task.module).icon;
  const done = Boolean(task.is_completed);

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(task)}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full min-w-0 flex-col gap-2 rounded-lg border border-[#e4e2f0] bg-white p-3 text-left shadow-[0_1px_2px_rgb(30_27_75/0.04)] transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/[0.07] dark:bg-white/[0.07] dark:shadow-none [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_4px_12px_rgb(30_27_75/0.09)] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.1] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-none',
        selected && 'ring-1 ring-[#5a63df] dark:ring-[#8f97ff]',
        draggable && 'cursor-grab',
        done && 'bg-transparent opacity-60 shadow-none dark:bg-transparent'
      )}
    >
      <span className="flex items-center justify-between gap-1.5">
        <span
          className={cn(
            'flex min-w-0 items-center gap-1.5 text-[11px] font-semibold',
            SECONDARY_TEXT
          )}
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#afb5ff]"
            strokeWidth={2.25}
            aria-hidden="true"
          />
          <span className="truncate">{getModuleStyle(task.module).label}</span>
        </span>
        {done && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgb(var(--signal-ok))] text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-label="Done" />
          </span>
        )}
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-snug tracking-tight text-slate-900 [overflow-wrap:anywhere] dark:text-white',
          done &&
            'font-medium text-slate-500 line-through decoration-slate-400/60 dark:text-slate-400'
        )}
      >
        {getFriendlyTaskTitle(task)}
      </span>
      <span className={cn(NUM, 'mt-auto flex items-center gap-1 text-[10px]', SECONDARY_TEXT)}>
        <Clock className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden="true" />
        {formatMinutes(taskMinutes(task))}
        {task.is_optional ? ' · optional' : ''}
      </span>
    </button>
  );
}

function PlanDay({ day, today, selectedKey, canReschedule, drag, onSelect, onDrop }) {
  const isToday = day.dateKey === today;
  const unplanned = day.inPlan === false && day.tasks.length === 0 && !day.isExamDay;
  const over = drag.overKey === day.dateKey;

  return (
    <div
      onDragOver={(event) => {
        if (!drag.key) return;
        event.preventDefault();
        drag.setOver(day.dateKey);
      }}
      onDragLeave={() => drag.setOver(null)}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(day);
      }}
      className={cn(
        COLUMN,
        !day.tasks.length && HATCH,
        isToday && 'bg-[#5a63df]/[0.09] dark:bg-[#8f97ff]/[0.1]',
        over &&
          'border-[#5a63df] bg-[#5a63df]/[0.12] dark:border-[#8f97ff] dark:bg-[#8f97ff]/[0.16]'
      )}
    >
      <header className="flex items-center justify-between px-2.5 pb-1.5 pt-2.5 md:flex-col md:items-start md:gap-1">
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.08em]', SECONDARY_TEXT)}>
          {isToday ? 'Today' : weekday(day.date)}
        </span>
        <span
          className={cn(
            NUM,
            'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-bold',
            isToday ? 'bg-[#5a63df] text-white' : ''
          )}
        >
          {day.date.getDate()}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2">
        {day.tasks.map((task) => (
          <TaskBlock
            key={taskKey(task)}
            task={task}
            selected={taskKey(task) === selectedKey}
            draggable={canReschedule && Boolean(task.id) && !task.is_completed}
            onSelect={onSelect}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', taskKey(task));
              drag.setKey(taskKey(task));
            }}
            onDragEnd={() => {
              drag.setKey(null);
              drag.setOver(null);
            }}
          />
        ))}
        {!day.tasks.length && (
          <p
            className={cn(
              'm-auto px-1 py-3 text-center text-[11px]',
              day.isExamDay ? 'font-semibold text-[#5a63df] dark:text-[#afb5ff]' : SECONDARY_TEXT
            )}
          >
            {day.isExamDay ? 'Exam day' : unplanned ? 'Not planned yet' : 'Rest day'}
          </p>
        )}
      </div>
    </div>
  );
}

const MODULE_LABEL = (module) => getModuleStyle(module).label;

function HistoryDay({ day }) {
  const missed = day.status === 'missed';
  return (
    <div
      className={cn(
        COLUMN,
        day.status === 'rest' && HATCH,
        missed &&
          'border-[rgb(var(--signal-fault)/0.4)] bg-[rgb(var(--signal-fault)/0.06)] dark:bg-[rgb(var(--signal-fault)/0.08)]'
      )}
    >
      <header className="flex items-center justify-between px-2.5 pb-1.5 pt-2.5 md:flex-col md:items-start md:gap-1">
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.08em]', SECONDARY_TEXT)}>
          {weekday(new Date(`${day.dateKey}T12:00:00`))}
        </span>
        <span className={cn(NUM, 'text-sm font-bold')}>
          {new Date(`${day.dateKey}T12:00:00`).getDate()}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2">
        {day.status === 'practised' && (
          <div className="grid gap-1 rounded-lg border border-[#ebeaf7] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.035]">
            <span className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--signal-ok))]">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              Practised
            </span>
            <span className="text-[11px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
              {[...new Set(day.modules)].map(MODULE_LABEL).join(', ') || 'Plan activity'}
            </span>
            {day.minutes > 0 && (
              <span className={cn(NUM, 'text-[11px]', SECONDARY_TEXT)}>
                {formatMinutes(day.minutes)}
              </span>
            )}
          </div>
        )}
        {missed && (
          <div className="grid gap-0.5 p-1">
            <span className="text-xs font-bold text-[rgb(var(--signal-fault))]">No practice</span>
            <span className={cn(NUM, 'text-[11px]', SECONDARY_TEXT)}>
              {formatMinutes(day.capacity)} set aside
            </span>
          </div>
        )}
        {day.status === 'rest' && (
          <p className={cn('m-auto px-1 py-3 text-center text-[11px]', SECONDARY_TEXT)}>Rest day</p>
        )}
      </div>
    </div>
  );
}

const NAV_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-700 transition-[transform,border-color,color] duration-150 hover:border-[#5a63df] hover:text-[#5a63df] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#8f97ff] dark:hover:text-[#afb5ff]';

const WEEK = 7;
const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
const minutesOf = (task) => Number(task?.estimated_time || task?.estimated_minutes || 0);
const HISTORY_PAGE = -1;

/** Counts for the days on screen, main tasks only. */
const summarizeDays = (days) => {
  const main = days.flatMap((day) => day.tasks).filter((task) => !task.is_optional);
  const done = main.filter((task) => task.is_completed);
  return {
    done: done.length,
    total: main.length,
    doneMinutes: done.reduce((sum, task) => sum + minutesOf(task), 0),
    plannedMinutes: main.reduce((sum, task) => sum + minutesOf(task), 0),
  };
};

const pageOfTask = (pages, selectedKey) => {
  const index = pages.findIndex((page) =>
    page.some((day) => day.tasks.some((task) => taskKey(task) === selectedKey))
  );
  return Math.max(0, index);
};

const rangeLabel = (days) => `${shortDate(days[0].dateKey)} – ${shortDate(days.at(-1).dateKey)}`;

function historyCaption(historyDays) {
  const practised = historyDays.filter((day) => day.status === 'practised').length;
  const skipped = historyDays.filter((day) => day.status === 'missed').length;
  return `${practised} practised · ${skipped} skipped`;
}

function planFooter({ canReschedule, pageCount, endsAtExam }) {
  const parts = ['Hatched days are rest days.'];
  if (canReschedule) parts.push('Drag a session to another day, or use Move to.');
  if (endsAtExam) parts.push('The plan ends the day before your exam.');
  else if (pageCount > 1) parts.push('Later weeks are planned on your latest results.');
  return parts.join(' ');
}

const monthName = (monthKey) =>
  new Date(`${monthKey}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

const CELL_BASE =
  'relative flex min-h-[64px] flex-col gap-1.5 rounded-xl p-1.5 transition-colors duration-150 sm:min-h-[96px]';

function MonthChip({ task, selected, onSelect }) {
  const done = Boolean(task.is_completed);
  const Icon = getModuleStyle(task.module).icon;
  const minutes = taskMinutes(task);

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      aria-pressed={selected}
      title={getFriendlyTaskTitle(task)}
      className={cn(
        'group/chip grid min-w-0 gap-0.5 rounded-md px-1.5 py-1 text-left transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] max-sm:h-1.5 max-sm:gap-0 max-sm:overflow-hidden max-sm:rounded-full max-sm:border-0 max-sm:p-0',
        selected
          ? 'bg-[#5a63df]/[0.1] ring-1 ring-[#5a63df] dark:bg-[#8f97ff]/[0.2] dark:ring-[#8f97ff] max-sm:bg-[#5a63df]'
          : 'bg-[#eceaf8] hover:bg-[#e2e0f4] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] max-sm:bg-slate-400',
        done && 'opacity-60'
      )}
    >
      <span
        className={cn(
          'line-clamp-2 text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100 max-sm:sr-only',
          done && 'line-through'
        )}
      >
        {getFriendlyTaskTitle(task)}
      </span>
      <span
        className={cn(NUM, 'flex items-center gap-1 text-[10px] max-sm:hidden', SECONDARY_TEXT)}
      >
        <Icon className="h-2.5 w-2.5" aria-hidden="true" />
        {minutes ? `${minutes}m` : ''}
        {done && (
          <Check
            className="ml-auto h-2.5 w-2.5 text-[rgb(var(--signal-ok))]"
            strokeWidth={3.5}
            aria-label="Done"
          />
        )}
      </span>
    </button>
  );
}

function MonthCell({ cell, selectedKey, onSelect }) {
  if (!cell.dateKey) {
    return <div aria-hidden="true" className="rounded-xl bg-[#f4f3fb]/50 dark:bg-white/[0.015]" />;
  }
  const missed = cell.status === 'missed';
  const practised = cell.status === 'practised';
  const past = Boolean(cell.status) || (!cell.isToday && cell.dateKey < cell.todayKey);

  return (
    <div
      className={cn(
        CELL_BASE,
        past
          ? 'bg-[#f7f6fc] dark:bg-white/[0.02]'
          : 'border border-[#e4e2f0] bg-white dark:border-white/[0.07] dark:bg-white/[0.03]',
        cell.isToday && 'border-transparent bg-[#5a63df]/[0.1] dark:bg-[#8f97ff]/[0.12]',
        missed && 'bg-[rgb(var(--signal-fault)/0.07)]',
        cell.isExamDay && 'border-0 bg-[#5a63df]/[0.08] dark:bg-[#8f97ff]/[0.1]'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            NUM,
            'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[13px] font-semibold leading-none',
            cell.isToday
              ? 'bg-[#5a63df] text-white shadow-xs'
              : past
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100'
          )}
        >
          {cell.day}
        </span>
        {missed && (
          <span className="rounded-md bg-[rgb(var(--signal-fault)/0.1)] px-1 py-0.5 text-[9.5px] font-semibold leading-none text-[rgb(var(--signal-fault))] max-sm:sr-only">
            Skipped
          </span>
        )}
        {practised && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgb(var(--signal-ok)/0.14)] text-[rgb(var(--signal-ok))]">
            <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-label="Practised" />
          </span>
        )}
        {cell.isExamDay && (
          <span className="rounded-md bg-[#5a63df]/12 px-1 py-0.5 text-[9.5px] font-semibold leading-none text-[#4a52c9] dark:text-[#afb5ff]">
            Exam
          </span>
        )}
      </div>
      {cell.tasks.map((task) => (
        <MonthChip
          key={taskKey(task)}
          task={task}
          selected={taskKey(task) === selectedKey}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function MonthView({ monthKey, days, historyDays, todayKey, selectedKey, onSelect }) {
  const grid = useMemo(
    () => buildMonthGrid({ monthKey, days, historyDays, todayKey }),
    [monthKey, days, historyDays, todayKey]
  );
  return (
    <div className="p-3">
      <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => (
          <span
            key={name}
            className={cn('px-1 text-[10px] font-bold uppercase tracking-[0.06em]', SECONDARY_TEXT)}
          >
            {name}
          </span>
        ))}
      </div>
      <div className="grid gap-1 sm:gap-1.5">
        {grid.map((week, index) => (
          <div key={index} className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {week.map((cell, column) => (
              <MonthCell
                key={cell.dateKey || `blank-${index}-${column}`}
                cell={{ ...cell, todayKey }}
                selectedKey={selectedKey}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The page's working surface. Week shows the plan seven days at a time, with the
 * last 7 days of real practice one step back; Month shows the whole plan at once.
 * A skipped study day reads as skipped rather than disappearing.
 */
export default function PlanCalendar({
  days,
  historyDays,
  todayKey,
  selectedKey,
  canReschedule,
  onSelect,
  onReschedule,
}) {
  const pages = useMemo(() => chunk(days, WEEK), [days]);
  const months = useMemo(() => getPlanMonths(days, todayKey), [days, todayKey]);
  const [view, setView] = useState('week');
  const [page, setPage] = useState(() => pageOfTask(pages, selectedKey));
  const [monthIndex, setMonthIndex] = useState(0);
  const [motion, setMotion] = useState({ shift: 0, lift: 4 });
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const inMonth = view === 'month';
  const inHistory = !inMonth && page === HISTORY_PAGE;
  const pageIndex = Math.min(Math.max(page, 0), pages.length - 1);
  const visible = pages[pageIndex];
  const totals = summarizeDays(inMonth ? days : visible);
  const endsAtExam = Boolean(days.at(-1)?.isExamDay);
  const monthPos = Math.min(monthIndex, months.length - 1);

  const switchView = (next) => {
    if (next === view) return;
    setMotion({ shift: 0, lift: 6 });
    setView(next);
  };

  const step = (direction) => {
    setMotion({ shift: direction * 14, lift: 0 });
    if (inMonth)
      return setMonthIndex(Math.min(Math.max(monthPos + direction, 0), months.length - 1));
    setPage(Math.min(Math.max(page + direction, HISTORY_PAGE), pages.length - 1));
  };
  const canBack = inMonth ? monthPos > 0 : page > HISTORY_PAGE;
  const canForward = inMonth ? monthPos < months.length - 1 : page < pages.length - 1;
  const backLabel = inMonth ? 'Previous month' : page === 0 ? 'Show last 7 days' : 'Previous week';

  const handleDrop = (day) => {
    const key = dragKey;
    setDragKey(null);
    setOverKey(null);
    if (day.isExamDay) return;
    const task = days.flatMap((item) => item.tasks).find((item) => taskKey(item) === key);
    if (task && task.scheduled_date !== day.dateKey) onReschedule(task, day.dateKey);
  };

  let title;
  if (inMonth) title = monthName(months[monthPos]);
  else title = rangeLabel(inHistory ? historyDays : visible);

  return (
    <section className={cn(CARD, 'min-w-0')} aria-label="Study calendar">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#eceafa] px-3.5 py-3 dark:border-white/[0.07]">
        <div
          className={cn('relative inline-grid grid-cols-2 rounded-[10px] p-[3px]', INSET)}
          role="group"
          aria-label="Calendar view"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-lg bg-white shadow-[0_0_0_1px_#e4e2f0] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none dark:bg-white/10 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            style={{ transform: `translateX(${inMonth ? '100%' : '0%'})` }}
          />
          {[
            ['week', 'Week'],
            ['month', 'Month'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => switchView(id)}
              className={cn(
                'relative z-10 h-7 min-w-[68px] rounded-lg px-3 text-xs font-semibold transition-colors duration-200',
                view === id
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={NAV_BUTTON}
            aria-label={backLabel}
            disabled={!canBack}
            onClick={() => step(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={NAV_BUTTON}
            aria-label={inMonth ? 'Next month' : 'Next week'}
            disabled={!canForward}
            onClick={() => step(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-[15px] font-semibold tracking-tight">
          {title}
          {!inMonth && !inHistory && pages.length > 1 && (
            <span className={cn('ml-2 text-xs font-normal', SECONDARY_TEXT)}>
              Week {pageIndex + 1} of {pages.length}
            </span>
          )}
          {inHistory && (
            <span className={cn('ml-2 text-xs font-normal', SECONDARY_TEXT)}>Last 7 days</span>
          )}
        </h2>
        <p className={cn(NUM, 'ml-auto text-xs', SECONDARY_TEXT)}>
          {inHistory
            ? historyCaption(historyDays)
            : `${totals.done}/${totals.total} done · ${formatMinutes(totals.doneMinutes)} of ${formatMinutes(totals.plannedMinutes)}`}
        </p>
      </div>

      <div
        key={`${view}-${page}-${monthPos}`}
        className="animate-plan-view"
        style={{ '--plan-shift': `${motion.shift}px`, '--plan-lift': `${motion.lift}px` }}
      >
        {inMonth ? (
          <MonthView
            monthKey={months[monthPos]}
            days={days}
            historyDays={historyDays}
            todayKey={todayKey}
            selectedKey={selectedKey}
            onSelect={onSelect}
          />
        ) : (
          <div className="grid gap-2 p-3 md:grid-cols-7">
            {inHistory
              ? historyDays.map((day) => <HistoryDay key={day.dateKey} day={day} />)
              : visible.map((day) => (
                  <PlanDay
                    key={day.dateKey}
                    day={day}
                    today={todayKey}
                    selectedKey={selectedKey}
                    canReschedule={canReschedule}
                    drag={{ key: dragKey, setKey: setDragKey, overKey, setOver: setOverKey }}
                    onSelect={onSelect}
                    onDrop={handleDrop}
                  />
                ))}
          </div>
        )}
      </div>

      <p className={cn('px-3.5 pb-3 text-[11px] leading-relaxed', SECONDARY_TEXT)}>
        {inHistory
          ? 'A skipped day is one where you set study time aside but did no scored practice.'
          : inMonth
            ? `Showing your ${days.length - (endsAtExam ? 1 : 0)}-day plan${endsAtExam ? ', which ends the day before your exam' : ''}. Days before today show what you did.`
            : planFooter({ canReschedule, pageCount: pages.length, endsAtExam })}
      </p>
    </section>
  );
}
