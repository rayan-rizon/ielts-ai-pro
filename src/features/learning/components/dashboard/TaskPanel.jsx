import React from 'react';
import { ArrowRight, Check, Minus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { CARD, SECONDARY_TEXT } from './PlanCard';
import {
  formatMinutes,
  getFriendlyPlanText,
  getFriendlyTaskTitle,
  getModuleStyle,
  getTaskModeLabel,
} from './dashboardUtils';
import { buildSessionChecklist } from './studyPlanModel';

const dayName = (date) =>
  date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function whenLabel(task, day, todayKey) {
  if (!day) return { text: 'Not scheduled', tone: 'neutral' };
  if (task.is_completed) return { text: 'Done', tone: 'ok' };
  if (day.dateKey === todayKey) return { text: 'Today', tone: 'accent' };
  return { text: dayName(day.date), tone: 'accent' };
}

const PRIMARY_BUTTON =
  'h-10 w-full rounded-xl bg-[#5a63df] text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#4a52c9] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2';
const SECONDARY_BUTTON =
  'h-9 w-full rounded-lg border border-[#e4e2f0] bg-white text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-[#5a63df]/35 hover:text-[#5a63df] active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-[#b8bdff]';

const MOVE_CHIPS = 7;

function MoveRow({ task, days, todayKey, onReschedule }) {
  const lastDay = days.at(-1);
  const chips = days.filter((day) => !day.isExamDay).slice(0, MOVE_CHIPS);
  const bookable = days.filter((day) => !day.isExamDay);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Move to</p>
        {bookable.length > MOVE_CHIPS && (
          <label className={cn('flex items-center gap-1.5 text-[11px]', SECONDARY_TEXT)}>
            Another day
            <input
              type="date"
              aria-label="Move to another day in your plan"
              min={days[0].dateKey}
              max={(bookable.at(-1) || lastDay).dateKey}
              value=""
              onChange={(event) => event.target.value && onReschedule(task, event.target.value)}
              className="h-7 rounded-md border border-[#e4e2f0] bg-white px-1.5 text-[11px] text-slate-700 transition-colors focus:border-[#5a63df] focus:ring-1 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            />
          </label>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {chips.map((day) => {
          const current = day.dateKey === task.scheduled_date;
          return (
            <button
              key={day.dateKey}
              type="button"
              aria-pressed={current}
              aria-label={`Move to ${dayName(day.date)}`}
              onClick={() => !current && onReschedule(task, day.dateKey)}
              className={cn(
                'flex h-9 flex-col items-center justify-center rounded-lg border text-[10px] font-bold uppercase leading-tight transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.95]',
                current
                  ? 'border-[#5a63df] bg-[#5a63df] text-white shadow-xs'
                  : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df] hover:text-[#5a63df] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-200'
              )}
            >
              {day.dateKey === todayKey
                ? 'Now'
                : day.date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              <span className={cn(NUM, 'text-[13px] normal-case')}>{day.date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const STEP_ICON = {
  done: {
    node: <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden="true" />,
    style: 'border-[rgb(var(--signal-ok))] bg-[rgb(var(--signal-ok))] text-white',
    text: 'Done',
  },
  missed: {
    node: <X className="h-3 w-3" strokeWidth={3} aria-hidden="true" />,
    style: 'border-[rgb(var(--signal-fault))] text-[rgb(var(--signal-fault))]',
    text: 'Goal not reached',
  },
  unknown: {
    node: <Minus className="h-3 w-3" strokeWidth={3} aria-hidden="true" />,
    style: 'border-slate-300 text-slate-400 dark:border-white/20',
    text: 'Result not recorded',
  },
  pending: {
    node: null,
    style: 'border-slate-300 dark:border-white/20',
    text: 'To do',
  },
};

/**
 * What finishing the session means. Steps are read from what the learner has
 * done, never tapped: a finished attempt ticks the first, and a recorded result
 * at or above the goal ticks the second.
 */
function SessionChecklist({ task, goal }) {
  const steps = buildSessionChecklist(task);
  const doneCount = steps.filter((step) => step.state === 'done').length;
  const anyAuto = steps.some((step) => step.auto);

  return (
    <div className="rounded-xl border border-[#ebeaf7] bg-[#fbfbfe] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.035]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">In this session</p>
        <p className={cn(NUM, 'text-[11px]', SECONDARY_TEXT)}>
          {doneCount}/{steps.length}
        </p>
      </div>
      <ol className="mt-3">
        {steps.map((step, index) => {
          const icon = STEP_ICON[step.state];
          const last = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className="relative flex items-start gap-2.5 pb-3 text-[13px] last:pb-0"
            >
              {!last && (
                <span
                  aria-hidden="true"
                  className="absolute left-[7.5px] top-5 bottom-0 w-px bg-[#e4e2f0] dark:bg-white/10"
                />
              )}
              <span
                role="img"
                aria-label={icon.text}
                className={cn(
                  'relative mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] bg-white transition-colors duration-200 dark:bg-white/10',
                  icon.style
                )}
              >
                {icon.node}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1',
                  step.state === 'done' && 'text-slate-500 dark:text-slate-400'
                )}
              >
                {step.label}
              </span>
              {step.detail && (
                <span
                  className={cn(
                    NUM,
                    'shrink-0 text-[11px]',
                    step.state === 'missed' ? 'text-[rgb(var(--signal-fault))]' : SECONDARY_TEXT
                  )}
                >
                  {step.detail}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {(goal || anyAuto) && (
        <div className="mt-3 grid gap-1 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          {goal && (
            <p className={cn('text-[12px] leading-snug', SECONDARY_TEXT)}>
              <span className="font-semibold text-slate-700 dark:text-slate-200">How: </span>
              {goal}
            </p>
          )}
          {anyAuto && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Ticks automatically from your results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Everything about the selected session in one place: why it is in the plan,
 * what finishing it means, and the actions that make sense for it. A scored
 * activity can only be completed by finishing it, so it never offers a manual
 * "Mark as done".
 */
export default function TaskPanel({
  task,
  day,
  days,
  todayKey,
  canReschedule,
  onStart,
  onToggle,
  onReschedule,
}) {
  if (!task) return null;
  const style = getModuleStyle(task.module);
  const Icon = style.icon;
  const when = whenLabel(task, day, todayKey);
  const verified = task.completion_policy === 'verified';
  const reason = task.reason || task.description;
  const goal = task.success_criterion ? getFriendlyPlanText(task.success_criterion) : null;
  const minutes = Number(task.estimated_time || task.estimated_minutes || 0);
  const isToday = day?.dateKey === todayKey;
  const startLabel = task.is_completed ? 'Review again' : isToday ? 'Start now' : 'Start early';

  return (
    <aside className={cn(CARD, 'p-4 sm:p-5')} aria-label="Selected session">
      <div
        key={task.activity_key || task.title}
        className="animate-plan-view grid gap-4"
        style={{ '--plan-lift': '4px' }}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 font-semibold',
              when.tone === 'ok'
                ? 'bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]'
                : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]'
            )}
          >
            {when.text}
          </span>
          <span className={cn('flex items-center gap-1.5', SECONDARY_TEXT)}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {[style.label, getTaskModeLabel(task), task.is_optional ? 'Optional' : null]
              .filter(Boolean)
              .join(' · ')}
            {minutes > 0 && <span className={NUM}> · {formatMinutes(minutes)}</span>}
          </span>
        </div>

        <div className="grid gap-2">
          <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
            {getFriendlyTaskTitle(task)}
          </h2>
          {reason && (
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
              {getFriendlyPlanText(reason)}
            </p>
          )}
        </div>

        <SessionChecklist task={task} goal={goal} />

        <div className="grid gap-2">
          <button
            type="button"
            className={cn(PRIMARY_BUTTON, 'group')}
            onClick={() => onStart(task)}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              {startLabel}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </span>
          </button>
          {verified ? (
            <p className={cn('text-center text-[11.5px] leading-relaxed', SECONDARY_TEXT)}>
              {task.is_completed
                ? 'Marked done automatically.'
                : 'Marked done automatically when you finish.'}
            </p>
          ) : (
            <button type="button" className={SECONDARY_BUTTON} onClick={() => onToggle(task)}>
              {task.is_completed ? 'Mark as not done' : 'Mark as done'}
            </button>
          )}
        </div>

        {canReschedule && task.id && !task.is_completed && (
          <div className="border-t border-[#eceafa] pt-4 dark:border-white/[0.07]">
            <MoveRow task={task} days={days} todayKey={todayKey} onReschedule={onReschedule} />
          </div>
        )}
      </div>
    </aside>
  );
}
