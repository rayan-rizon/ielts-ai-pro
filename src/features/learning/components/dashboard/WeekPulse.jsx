import React from 'react';
import { ArrowRight, CalendarCheck2, CheckCircle2, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DAY_FORMAT, formatMinutes, getFriendlyTaskTitle, getModuleStyle } from './dashboardUtils';

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
    <section className="relative overflow-hidden flex h-full flex-col rounded-3xl border border-sky-100/90 bg-gradient-to-br from-sky-50/70 via-indigo-50/30 to-white/90 p-5 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-sky-500/15 transition-all duration-300 backdrop-blur dark:border-sky-500/20 dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 sm:p-6">
      {/* Corner Light Gradient Glow */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-sky-300/30 via-indigo-300/20 to-transparent blur-2xl dark:from-sky-600/15"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <CalendarCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Weekly overview
            </span>
          </div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
            Your week at a glance
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Time, completed work, and subjects in this plan.
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-inner"
          style={{
            background: `conic-gradient(#4f46e5 ${completion}%, rgba(79,70,229,0.12) ${completion}% 100%)`,
          }}
          aria-label={`${completion}% of this week's plan completed`}
        >
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
            <span className="text-base font-black tabular-nums text-indigo-700 dark:text-indigo-300">
              {completion}%
            </span>
            <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">
              done
            </span>
          </div>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              Study time
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {formatMinutes(plannedMinutes)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              Time available
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {formatMinutes(weeklyCapacity)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              Study days
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {plannedStudyDays}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
              Need moving
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {overflowDays}
            </p>
          </div>
        </div>
      </div>
      {Object.keys(moduleCounts).length > 0 && (
        <div className="mt-4">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
            Subjects this week
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(moduleCounts).map(([module, count]) => {
              const style = getModuleStyle(module);
              const Icon = style.icon;
              return (
                <span
                  key={module}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black shadow-2xs',
                    style.surface
                  )}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {style.label} · {count}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-slate-900/90">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
          Next study session
        </p>
        {nextStudyTask ? (
          <div className="mt-1.5">
            <p className="line-clamp-2 text-xs font-black text-slate-950 dark:text-white">
              {getFriendlyTaskTitle(nextStudyTask)}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {DAY_FORMAT.format(nextStudyDay.date)} ·{' '}
              {formatMinutes(nextStudyTask.estimated_time || nextStudyTask.estimated_minutes)}
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            You have finished the scheduled work. Rest or edit your available days.
          </p>
        )}
      </div>
      <div
        className={cn(
          'mt-auto flex items-start gap-2 rounded-2xl px-3.5 py-2.5 pt-3.5 text-[10px] font-bold leading-relaxed shadow-2xs',
          overflowDays
            ? 'bg-amber-500/10 text-amber-900 border border-amber-200/60 dark:bg-amber-500/20 dark:text-amber-200'
            : 'bg-emerald-500/10 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-500/20 dark:text-emerald-200'
        )}
      >
        {overflowDays ? (
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <span className="min-w-0 flex-1">
          {overflowDays
            ? `${overflowDays} ${overflowDays === 1 ? 'day has' : 'days have'} more work than your saved time.`
            : 'The scheduled work stays inside your saved weekly capacity.'}
        </span>
        {overflowDays > 0 && onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1 text-[9px] font-black text-amber-900 shadow-2xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-white/10 dark:text-amber-100 dark:hover:bg-white/15"
          >
            Fix schedule <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
