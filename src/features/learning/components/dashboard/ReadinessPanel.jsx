import React from 'react';
import { ArrowRight, CircleAlert, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getModuleStyle } from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];

function ModuleScoreCard({ module, item }) {
  const style = getModuleStyle(module);
  const Icon = style.icon;
  const median = item?.median;
  const sampleCount = Number(item?.sample_count || 0);
  const sufficient = Boolean(item?.sufficient ?? sampleCount >= 2);
  const displayScore = median ? (typeof median === 'number' ? median.toFixed(1) : median) : '—';
  const labelText = median
    ? sufficient
      ? 'recent typical score'
      : 'one score — add another'
    : 'score check needed';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-md shadow-purple-500/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900/90">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border shadow-2xs',
            style.surface,
            style.color
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <span className="block text-xs font-black text-slate-950 dark:text-slate-100">
            {style.label}
          </span>
          <span className="block text-[9px] font-bold text-slate-400">
            {sampleCount} scored {sampleCount === 1 ? 'practice' : 'practices'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-xl font-black tabular-nums text-slate-950 dark:text-white">
          {displayScore}
        </span>
        <span className="max-w-[95px] text-right text-[8px] font-bold leading-snug text-slate-400">
          {labelText}
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
      className="relative overflow-hidden rounded-3xl border border-purple-100/90 bg-gradient-to-br from-purple-50/70 via-indigo-50/30 to-white/90 p-5 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/15 transition-all duration-300 backdrop-blur dark:border-purple-500/20 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 sm:p-6"
      aria-labelledby="readiness-title"
    >
      {/* Corner Light Gradient Glow */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-purple-300/30 via-pink-300/20 to-transparent blur-2xl dark:from-purple-600/15"
        aria-hidden="true"
      />
      <div className="grid items-center gap-5 lg:grid-cols-[220px_minmax(0,1fr)_230px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              Recent practice scores
            </span>
          </div>
          <h2
            id="readiness-title"
            className="mt-1.5 text-xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            {isAvailable && range
              ? `Your recent level: ${range[0]}–${range[1]}`
              : 'Your score picture'}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Based only on scored practice from the last 90 days.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
          {MODULES.map((module) => (
            <ModuleScoreCard key={module} module={module} item={readiness?.modules?.[module]} />
          ))}
        </div>

        {nextCheckTask ? (
          <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm dark:border-amber-500/20 dark:bg-slate-900/90">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Next score check
              </span>
            </div>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
              {getModuleStyle(nextModule).label} level check
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
              Add a recent score so this subject can be compared fairly.
            </p>
            <button
              type="button"
              onClick={() => onStart?.(nextCheckTask)}
              className="mt-3 inline-flex h-9 w-full items-center justify-between rounded-xl bg-indigo-600 px-3.5 text-[10px] font-black text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Start score check <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 text-emerald-900 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900/90 dark:text-emerald-200">
            <p className="text-[9px] font-black uppercase tracking-wider">All subjects checked</p>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
              Band {range?.[0]}–{range?.[1]}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
              This is a recent practice range, not a predicted exam score.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
