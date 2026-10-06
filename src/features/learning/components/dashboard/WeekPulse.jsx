import React, { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
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
  Ring,
  WELL,
} from '@/features/dashboard/components/primitives';
import {
  DAY_FORMAT,
  formatMinutes,
  getFriendlyTaskTitle,
  getModuleStyle,
  getModuleTone,
} from './dashboardUtils';

const taskMinutes = (task) => Number(task.estimated_time || task.estimated_minutes || 0);
const dayMinutes = (day) => day.tasks.reduce((total, task) => total + taskMinutes(task), 0);

/**
 * Completion split by subject.
 *
 * This slot used to hold a per-day load chart, which the week calendar now shows
 * in full — so it answers a question nothing else on the page does: of the work
 * scheduled this week, which subjects are actually getting finished.
 */
function SubjectProgress({ moduleStats }) {
  const rows = Object.entries(moduleStats).sort((a, b) => b[1].total - a[1].total);
  if (rows.length === 0) return null;

  return (
    <div className="mt-4">
      <p className={cn(MICRO, MUTED)}>Finished by subject</p>
      <div className="mt-2 space-y-1.5">
        {rows.map(([module, counts]) => {
          const style = getModuleStyle(module);
          const Icon = style.icon;
          const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

          return (
            <div
              key={module}
              className="group flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-[#f8f7fd] dark:hover:bg-white/[0.04]"
            >
              <IconChip icon={Icon} tone={getModuleTone(module)} />
              <span className="w-18 shrink-0 truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                {style.label}
              </span>
              <div
                className={cn('h-2 flex-1 overflow-hidden rounded-full', WELL)}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${style.label}: ${counts.done} of ${counts.total} completed`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
                    pct === 100
                      ? 'bg-[rgb(var(--signal-ok))]'
                      : 'bg-[linear-gradient(90deg,#5a63df,#8f97ff)]'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums">
                <span
                  className={
                    counts.done > 0
                      ? pct === 100
                        ? 'text-[rgb(var(--signal-ok))] font-extrabold'
                        : 'text-[#5a63df] dark:text-[#afb5ff] font-extrabold'
                      : 'text-slate-400 dark:text-slate-500'
                  }
                >
                  {counts.done}
                </span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-slate-600 dark:text-slate-300">{counts.total}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WeekPulse({ days, weeklyCapacity, onCustomize, onStart }) {
  const reduceMotion = useReducedMotion();
  const stats = useMemo(() => {
    const tasks = days.flatMap((day) => day.tasks);
    const completed = tasks.filter((task) => task.is_completed).length;
    const overflowDays = days.filter((day) => {
      const minutes = dayMinutes(day);
      return day.tasks.length > 0 && (!day.capacity || minutes > day.capacity);
    }).length;
    const moduleStats = tasks.reduce((counts, task) => {
      const rawModule = String(task.module || '').toLowerCase();
      // Grammar and Vocabulary have their own label and colour; folding them
      // into "General" named the same task differently from the week plan.
      const module = [
        'reading',
        'writing',
        'listening',
        'speaking',
        'grammar',
        'vocabulary',
      ].includes(rawModule)
        ? rawModule
        : 'general';
      const entry = counts[module] || { total: 0, done: 0 };
      entry.total += 1;
      if (task.is_completed) entry.done += 1;
      counts[module] = entry;
      return counts;
    }, {});

    return {
      total: tasks.length,
      completed,
      overflowDays,
      moduleStats,
      plannedStudyDays: days.filter((day) => day.tasks.length > 0).length,
      plannedMinutes: tasks.reduce((total, task) => total + taskMinutes(task), 0),
      completion: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  }, [days]);

  // The ring transitions its stroke, so it has to mount empty for that
  // transition to be visible at all.
  const [ringValue, setRingValue] = useState(reduceMotion ? stats.completion : 0);
  useEffect(() => {
    if (reduceMotion) {
      setRingValue(stats.completion);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setRingValue(stats.completion));
    return () => cancelAnimationFrame(frame);
  }, [stats.completion, reduceMotion]);

  const nextStudyDay = days.find((day) => day.tasks.some((task) => !task.is_completed));
  const nextStudyTask = nextStudyDay?.tasks.find((task) => !task.is_completed) || null;

  return (
    <section className={cn(PANEL, 'flex h-full min-w-0 flex-col p-4 sm:p-5')}>
      <PanelTitle
        label="Your week at a glance"
        accent
        tip="Time, completed work, and subjects in this plan."
        action={
          <Pill tone={stats.overflowDays ? 'warn' : 'ok'}>
            {stats.completed}/{stats.total} done
          </Pill>
        }
      />

      <div className="mt-2 flex min-w-0 items-center gap-4">
        <Ring
          value={ringValue}
          size={72}
          stroke={7}
          label={`${stats.completion}%`}
          sublabel="done"
        />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
          <div className="flex items-baseline justify-between gap-2 border-b border-[#eceafa]/60 pb-1 dark:border-white/[0.04]">
            <span className={cn(MICRO, MUTED, 'truncate')}>Planned this week</span>
            <span
              className={cn(NUM, 'shrink-0 text-xs font-extrabold text-slate-900 dark:text-white')}
            >
              {formatMinutes(stats.plannedMinutes)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 border-b border-[#eceafa]/60 pb-1 dark:border-white/[0.04]">
            <span className={cn(MICRO, MUTED, 'truncate')}>Your weekly budget</span>
            <span
              className={cn(NUM, 'shrink-0 text-xs font-extrabold text-slate-900 dark:text-white')}
            >
              {formatMinutes(weeklyCapacity)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn(MICRO, MUTED, 'truncate')}>Study days</span>
            <span className="shrink-0 text-xs font-extrabold text-slate-900 dark:text-white">
              <span className="font-mono tabular-nums">{stats.plannedStudyDays}</span>
              <span className="mx-1 font-sans text-[11px] font-medium text-slate-400 dark:text-slate-500">
                of
              </span>
              <span className="font-mono tabular-nums">7</span>
            </span>
          </div>
        </div>
      </div>

      <SubjectProgress moduleStats={stats.moduleStats} />

      <div className="mt-4 flex flex-1 flex-col justify-end space-y-2.5">
        <div className="rounded-xl border border-[#ebe9f6] bg-white/90 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>Next study session</p>
            {nextStudyTask && onStart && (
              <button
                type="button"
                onClick={() => onStart(nextStudyTask)}
                aria-label={`Start ${getFriendlyTaskTitle(nextStudyTask)}`}
                className="inline-flex items-center gap-1 rounded-md bg-[#5a63df] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs transition-all duration-150 hover:bg-[#4850c8] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                Start <ArrowRight className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
          {nextStudyTask ? (
            <div className="mt-1.5">
              <p className="line-clamp-1 text-xs font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-100">
                {getFriendlyTaskTitle(nextStudyTask)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {DAY_FORMAT.format(nextStudyDay.date)}
                </span>
                <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300">
                  {formatMinutes(nextStudyTask.estimated_time || nextStudyTask.estimated_minutes)}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              All scheduled tasks completed for this week. Great work!
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-between gap-2.5 rounded-xl border p-2.5 sm:p-3 transition-colors',
            stats.overflowDays
              ? 'border-amber-500/25 bg-amber-500/8 dark:border-amber-500/30 dark:bg-amber-500/10'
              : 'border-[rgb(var(--signal-ok)/0.22)] bg-[rgb(var(--signal-ok)/0.05)] dark:border-[rgb(var(--signal-ok)/0.25)] dark:bg-[rgb(var(--signal-ok)/0.08)]'
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <IconChip
              icon={stats.overflowDays ? CircleAlert : CheckCircle2}
              tone={stats.overflowDays ? 'amber' : 'emerald'}
            />
            <p className="min-w-0 text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">
              {stats.overflowDays
                ? `${stats.overflowDays} ${stats.overflowDays === 1 ? 'day has' : 'days have'} more work than your saved time.`
                : 'The scheduled work stays inside your weekly budget.'}
            </p>
          </div>
          {stats.overflowDays > 0 && onCustomize && (
            <button
              type="button"
              onClick={onCustomize}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs transition-all duration-150 hover:bg-amber-700 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Fix schedule <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
