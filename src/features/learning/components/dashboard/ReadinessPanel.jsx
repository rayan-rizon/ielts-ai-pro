import React from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getModuleStyle } from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];

function ModuleScoreCard({ module, item }) {
  const style = getModuleStyle(module);
  const Icon = style.icon;
  const median = item?.median;
  const hasScore = median !== null && median !== undefined;
  const sampleCount = Number(item?.sample_count || 0);
  const displayScore = hasScore ? (typeof median === 'number' ? median.toFixed(1) : median) : '—';

  return (
    <div className="rounded-2xl border border-[#cbd3f8]/70 bg-white p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#505bdd] hover:shadow-md dark:border-white/15 dark:bg-[#10131f]/90">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-2xs',
            style.surface,
            style.color
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="truncate text-xs font-black text-slate-950 dark:text-slate-100">
          {style.label}
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-1">
        <span className="text-lg font-black tabular-nums text-slate-950 dark:text-white">
          {displayScore}
        </span>
        <span className="truncate text-[10px] font-bold text-slate-400">
          {hasScore ? `${sampleCount} test${sampleCount === 1 ? '' : 's'}` : 'Needs test'}
        </span>
      </div>
    </div>
  );
}

export default function ReadinessPanel({ readiness, days = [], onStart }) {
  const overall = readiness?.overall;
  const isAvailable = Boolean(overall?.available);
  const range = overall?.range;
  const missing = readiness?.missing_diagnostics || [];
  const nextModule = missing[0];
  const nextCheckTask = nextModule
    ? days
        .flatMap((day) => day.tasks || [])
        .find(
          (task) =>
            String(task.module).toLowerCase() === nextModule &&
            String(task.activity_type).toLowerCase() === 'diagnostic'
        ) || {
        title: `${getModuleStyle(nextModule).label} level check`,
        module: nextModule,
        activity_type: 'diagnostic',
        routing: { route: nextModule, mode: 'diagnostic' },
      }
    : null;

  return (
    <section
      className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white p-5 sm:p-6 shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 backdrop-blur hover:shadow-[0_24px_55px_-38px_rgba(48,58,128,0.85)] dark:border-white/10 dark:bg-[#10131f]"
      aria-labelledby="readiness-title"
    >
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#dcd8ff]/50 blur-2xl dark:bg-indigo-900/30"
        aria-hidden="true"
      />

      <div className="relative min-w-0">
        <div className="flex items-center gap-2 text-[#505bdd] dark:text-indigo-400">
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
            Recent practice scores
          </span>
        </div>
        <h2
          id="readiness-title"
          className="mt-1 text-base font-black tracking-tight text-slate-950 dark:text-white"
        >
          {isAvailable && range
            ? `Your recent level: ${range[0]}–${range[1]}`
            : 'Your score picture'}
        </h2>
        <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          Scored practice (last 90 days).
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {MODULES.map((module) => (
            <ModuleScoreCard key={module} module={module} item={readiness?.modules?.[module]} />
          ))}
        </div>
      </div>

      {nextCheckTask ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-3.5 dark:border-amber-500/15 dark:bg-amber-500/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Next score check
              </span>
            </div>
            <p className="mt-0.5 text-xs font-extrabold text-slate-950 dark:text-white truncate">
              {getModuleStyle(nextModule).label} level check
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
              Add a score to compare fairly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStart?.(nextCheckTask)}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#5661e9] px-3.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#4853d6] active:scale-95"
          >
            Start score check <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-100/80 bg-emerald-50/25 p-3.5 dark:border-emerald-500/15 dark:bg-emerald-500/[0.04]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.14em]">
                  All subjects checked
                </span>
              </div>
              <p className="mt-0.5 text-xs font-extrabold text-slate-950 dark:text-white">
                Band {range?.[0]}–{range?.[1]}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-lg border border-slate-200/60 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-400">
            Recent practice range
          </span>
        </div>
      )}
    </section>
  );
}
