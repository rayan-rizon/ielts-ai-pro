import React from 'react';
import { ArrowRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';
import {
  DAY_FORMAT,
  formatMinutes,
  getFriendlyTaskTitle,
  getModuleStyle,
  getModuleTone,
} from './dashboardUtils';

export default function WeekPulse({ days, weeklyCapacity, onCustomize }) {
  const tasks = days.flatMap((day) => day.tasks);
  const completed = tasks.filter((task) => task.is_completed).length;
  const plannedStudyDays = days.filter((day) => day.tasks.length > 0).length;
  const plannedMinutes = tasks.reduce(
    (total, task) => total + Number(task.estimated_time || task.estimated_minutes || 0),
    0
  );
  const overflowDays = days.filter((day) => {
    const minutes = day.tasks.reduce(
      (total, task) => total + Number(task.estimated_time || task.estimated_minutes || 0),
      0
    );
    return day.tasks.length > 0 && (!day.capacity || minutes > day.capacity);
  }).length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const moduleCounts = tasks.reduce((counts, task) => {
    const rawModule = String(task.module || '').toLowerCase();
    const module = ['reading', 'writing', 'listening', 'speaking'].includes(rawModule)
      ? rawModule
      : 'general';
    counts[module] = (counts[module] || 0) + 1;
    return counts;
  }, {});
  const nextStudyDay = days.find((day) => day.tasks.some((task) => !task.is_completed));
  const nextStudyTask = nextStudyDay?.tasks.find((task) => !task.is_completed) || null;

  return (
    <section className={cn(PANEL, 'flex h-full min-w-0 flex-col p-5 sm:p-6')}>
      <PanelTitle label="Weekly overview" accent />
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        Your week at a glance
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Time, completed work, and subjects in this plan.
      </p>

      <div className="mt-4 flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#5a63df ${completion}%, rgb(90 99 223 / 0.12) ${completion}% 100%)`,
          }}
          aria-label={`${completion}% of this week's plan completed`}
        >
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white dark:bg-[#131315]">
            <span
              className={cn(NUM, 'text-base font-extrabold text-[#5a63df] dark:text-[#a9afff]')}
            >
              {completion}%
            </span>
            <span className={cn(MICRO, 'text-slate-400')}>done</span>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5">
          <div className={cn(TILE, 'p-3')}>
            <p className={cn(MICRO, MUTED)}>Study time</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
              {formatMinutes(plannedMinutes)}
            </p>
          </div>
          <div className={cn(TILE, 'p-3')}>
            <p className={cn(MICRO, MUTED)}>Time available</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
              {formatMinutes(weeklyCapacity)}
            </p>
          </div>
          <div className={cn(TILE, 'p-3')}>
            <p className={cn(MICRO, MUTED)}>Study days</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
              {plannedStudyDays}
            </p>
          </div>
          <div className={cn(TILE, 'p-3')}>
            <p className={cn(MICRO, MUTED)}>Need moving</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
              {overflowDays}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(moduleCounts).length > 0 && (
        <div className="mt-4">
          <p className={cn(MICRO, 'text-slate-400')}>Subjects this week</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(moduleCounts).map(([module, count]) => {
              const style = getModuleStyle(module);
              const Icon = style.icon;
              return (
                <Pill key={module} tone={getModuleTone(module)}>
                  <Icon className="h-3 w-3" />
                  {style.label} · {count}
                </Pill>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn(TILE, 'mt-4 p-4')}>
        <p className={cn(MICRO, 'text-[#5a63df]')}>Next study session</p>
        {nextStudyTask ? (
          <div className="mt-1.5">
            <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-white">
              {getFriendlyTaskTitle(nextStudyTask)}
            </p>
            <p className={cn('mt-1 text-[10px] font-medium', MUTED)}>
              {DAY_FORMAT.format(nextStudyDay.date)} ·{' '}
              {formatMinutes(nextStudyTask.estimated_time || nextStudyTask.estimated_minutes)}
            </p>
          </div>
        ) : (
          <p className={cn('mt-1.5 text-xs font-medium leading-relaxed', MUTED)}>
            You have finished the scheduled work. Rest or edit your available days.
          </p>
        )}
      </div>

      <div
        className={cn(
          TILE,
          'mt-auto flex items-center justify-between gap-3 p-3.5',
          overflowDays
            ? 'border-amber-200/60 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/[0.06]'
            : 'border-[rgb(var(--signal-ok)/0.25)] bg-[rgb(var(--signal-ok)/0.05)]'
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <IconChip
            icon={overflowDays ? CircleAlert : CheckCircle2}
            tone={overflowDays ? 'amber' : 'emerald'}
          />
          <p className="min-w-0 text-xs font-bold leading-snug text-slate-900 dark:text-white">
            {overflowDays
              ? `${overflowDays} ${overflowDays === 1 ? 'day has' : 'days have'} more work than your saved time.`
              : 'The scheduled work stays inside your saved weekly capacity.'}
          </p>
        </div>
        {overflowDays > 0 && onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          >
            Fix schedule <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}
