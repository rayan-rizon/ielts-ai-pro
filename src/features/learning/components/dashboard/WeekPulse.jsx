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
      <div className="mt-2 space-y-2">
        {rows.map(([module, counts]) => {
          const style = getModuleStyle(module);
          const Icon = style.icon;
          const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

          return (
            <div key={module} className="flex min-w-0 items-center gap-2">
              <IconChip icon={Icon} tone={getModuleTone(module)} />
              <span className="w-16 shrink-0 truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                {style.label}
              </span>
              <span className={cn('h-1.5 flex-1 overflow-hidden rounded-full', WELL)}>
                <span
                  className={cn(
                    'block h-full rounded-full transition-[width] duration-500 ease-out',
                    pct === 100 ? 'bg-[rgb(var(--signal-ok))]' : 'bg-[#5a63df] dark:bg-[#8f97ff]'
                  )}
                  style={{ width: `${Math.max(3, pct)}%` }}
                />
              </span>
              <span
                className={cn(
                  NUM,
                  'w-8 shrink-0 text-right text-[11px] font-bold text-slate-600 dark:text-slate-300'
                )}
              >
                {counts.done}/{counts.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WeekPulse({ days, weeklyCapacity, onCustomize }) {
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
      const module = ['reading', 'writing', 'listening', 'speaking'].includes(rawModule)
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

      <div className="mt-1 flex min-w-0 items-center gap-4">
        <Ring
          value={ringValue}
          size={72}
          stroke={7}
          label={`${stats.completion}%`}
          sublabel="done"
        />
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
          {[
            { label: 'Planned this week', value: formatMinutes(stats.plannedMinutes) },
            { label: 'Time you saved', value: formatMinutes(weeklyCapacity) },
            { label: 'Study days', value: `${stats.plannedStudyDays} of 7` },
          ].map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <span className={cn(MICRO, MUTED, 'truncate')}>{row.label}</span>
              <span
                className={cn(
                  NUM,
                  'shrink-0 text-xs font-extrabold text-slate-900 dark:text-white'
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SubjectProgress moduleStats={stats.moduleStats} />

      <div className="mt-3 flex flex-1 flex-col justify-end space-y-2">
        <div className="rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-2.5 sm:p-3 transition-colors dark:border-white/10 dark:bg-white/4">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#5a63df] dark:text-[#8f97ff]">
            Next study session
          </p>
          {nextStudyTask ? (
            <div className="mt-1 space-y-0.5">
              <p className="line-clamp-1 text-xs font-extrabold leading-snug tracking-tight text-slate-900 dark:text-slate-100">
                {getFriendlyTaskTitle(nextStudyTask)}
              </p>
              <p className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 font-medium">
                {DAY_FORMAT.format(nextStudyDay.date)} ·{' '}
                {formatMinutes(nextStudyTask.estimated_time || nextStudyTask.estimated_minutes)}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              You have finished the scheduled work. Rest or edit your available days.
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-between gap-2.5 rounded-lg border p-2.5 sm:p-3 transition-colors',
            stats.overflowDays
              ? 'border-amber-500/30 bg-amber-500/8 dark:border-amber-500/30 dark:bg-amber-500/10'
              : 'border-emerald-500/30 bg-emerald-500/8 dark:border-emerald-500/30 dark:bg-emerald-500/10'
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <IconChip
              icon={stats.overflowDays ? CircleAlert : CheckCircle2}
              tone={stats.overflowDays ? 'amber' : 'emerald'}
            />
            <p className="min-w-0 text-xs font-bold leading-snug text-slate-800 dark:text-slate-100">
              {stats.overflowDays
                ? `${stats.overflowDays} ${stats.overflowDays === 1 ? 'day has' : 'days have'} more work than your saved time.`
                : 'The scheduled work stays inside your saved weekly capacity.'}
            </p>
          </div>
          {stats.overflowDays > 0 && onCustomize && (
            <button
              type="button"
              onClick={onCustomize}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-amber-700 shadow-xs"
            >
              Fix schedule <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
