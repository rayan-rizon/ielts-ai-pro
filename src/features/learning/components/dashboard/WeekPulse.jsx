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
    <section className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 backdrop-blur hover:shadow-[0_24px_55px_-38px_rgba(48,58,128,0.85)] dark:border-white/10 dark:bg-[#10131f] p-5 sm:p-6">
      {/* Corner Light Gradient Glow matching Grammar Lab */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#dcd8ff]/50 blur-2xl dark:bg-indigo-900/30"
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
      <div className="mt-5 flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center">
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
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-[#dfe3ff] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(48,58,128,0.12)] dark:border-white/10 dark:bg-[#10131f]">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study time
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {formatMinutes(plannedMinutes)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe3ff] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(48,58,128,0.12)] dark:border-white/10 dark:bg-[#10131f]">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Time available
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {formatMinutes(weeklyCapacity)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe3ff] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(48,58,128,0.12)] dark:border-white/10 dark:bg-[#10131f]">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study days
            </p>
            <p className="mt-0.5 text-xs font-black text-slate-950 dark:text-white">
              {plannedStudyDays}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dfe3ff] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(48,58,128,0.12)] dark:border-white/10 dark:bg-[#10131f]">
            <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    'inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 px-3 py-1 text-[10px] font-extrabold shadow-2xs dark:border-white/10',
                    style.surface
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {style.label} · {count}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-[#dfe3ff] bg-white p-4 shadow-[0_4px_18px_-8px_rgba(48,58,128,0.12)] dark:border-white/10 dark:bg-[#10131f]">
        <p className="text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-[#505bdd] dark:text-indigo-400">
          Next study session
        </p>
        {nextStudyTask ? (
          <div className="mt-1.5">
            <p className="line-clamp-2 text-xs font-black text-slate-950 dark:text-white">
              {getFriendlyTaskTitle(nextStudyTask)}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">
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
          'mt-auto flex items-center justify-between gap-3 rounded-2xl border p-3.5 shadow-xs transition-all duration-200',
          overflowDays
            ? 'border-amber-100 bg-amber-50/40 dark:border-amber-500/15 dark:bg-amber-500/[0.05]'
            : 'border-teal-100/80 bg-teal-50/25 dark:border-teal-500/15 dark:bg-teal-500/[0.04]'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border',
              overflowDays
                ? 'border-amber-200/60 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                : 'border-teal-200/60 bg-teal-50 text-teal-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400'
            )}
          >
            {overflowDays ? (
              <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white min-w-0 leading-snug">
            {overflowDays
              ? `${overflowDays} ${overflowDays === 1 ? 'day has' : 'days have'} more work than your saved time.`
              : 'The scheduled work stays inside your saved weekly capacity.'}
          </p>
        </div>
        {overflowDays > 0 && onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
          >
            Fix schedule <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
