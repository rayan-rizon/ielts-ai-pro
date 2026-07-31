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
  TILE,
} from '@/features/dashboard/components/primitives';
import { getModuleStyle, getModuleTone } from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];

function ModuleScoreCard({ module, item }) {
  const style = getModuleStyle(module);
  const Icon = style.icon;
  const median = item?.median;
  const hasScore = median !== null && median !== undefined;
  const sampleCount = Number(item?.sample_count || 0);
  const displayScore = hasScore ? (typeof median === 'number' ? median.toFixed(1) : median) : '—';

  return (
    <div className={cn(TILE, 'p-3')}>
      <div className="flex items-center gap-2">
        <IconChip icon={Icon} tone={getModuleTone(module)} />
        <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
          {style.label}
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-1">
        <span className={cn(NUM, 'text-lg font-extrabold text-slate-900 dark:text-white')}>
          {displayScore}
        </span>
        <span className={cn(MICRO, 'truncate', MUTED)}>
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
      className={cn(PANEL, 'flex flex-col justify-between p-5 sm:p-6')}
      aria-labelledby="readiness-title"
    >
      <div className="min-w-0">
        <PanelTitle label="Recent practice scores" accent />
        <h2
          id="readiness-title"
          className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          {isAvailable && range
            ? `Your recent level: ${range[0]}–${range[1]}`
            : 'Your score picture'}
        </h2>
        <p className={cn('mt-1 text-[11px] font-medium leading-relaxed', MUTED)}>
          Scored practice (last 90 days).
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {MODULES.map((module) => (
            <ModuleScoreCard key={module} module={module} item={readiness?.modules?.[module]} />
          ))}
        </div>
      </div>

      {nextCheckTask ? (
        <div
          className={cn(
            TILE,
            'mt-4 flex flex-col gap-3 border-amber-200/60 bg-amber-50/40 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.06] sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className={MICRO}>Next score check</span>
            </div>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
              {getModuleStyle(nextModule).label} level check
            </p>
            <p className={cn('mt-0.5 line-clamp-1 text-[10px] font-medium', MUTED)}>
              Add a score to compare fairly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStart?.(nextCheckTask)}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9]"
          >
            Start score check <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            TILE,
            'mt-4 flex flex-col gap-3 border-[rgb(var(--signal-ok)/0.25)] bg-[rgb(var(--signal-ok)/0.05)] p-3.5 sm:flex-row sm:items-center sm:justify-between'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <IconChip icon={CheckCircle2} tone="emerald" />
            <div className="min-w-0">
              <span className={cn(MICRO, 'text-[rgb(var(--signal-ok))]')}>
                All subjects checked
              </span>
              <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                Band {range?.[0]}–{range?.[1]}
              </p>
            </div>
          </div>
          <span
            className={cn(
              MICRO,
              'shrink-0 rounded-lg border border-[#eeedf7] bg-white px-2.5 py-1 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
            )}
          >
            Recent practice range
          </span>
        </div>
      )}
    </section>
  );
}
