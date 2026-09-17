import React from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';
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
  WELL,
} from '@/features/dashboard/components/primitives';
import { getModuleStyle, getModuleTone } from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];
const BAND_MAX = 9;

/**
 * One module's standing: the score itself, where it sits on the 0–9 scale, and
 * the notch showing the target. The distance between fill and notch is the only
 * number a learner actually acts on, so it is spelled out in words underneath.
 */
function ModuleScoreCard({ module, item, targetBand }) {
  const style = getModuleStyle(module);
  const Icon = style.icon;
  const median = item?.median;
  const hasScore = median !== null && median !== undefined;
  const numericScore = hasScore ? Number(median) : null;
  const sampleCount = Number(item?.sample_count || 0);
  const displayScore = hasScore ? (typeof median === 'number' ? median.toFixed(1) : median) : '—';
  const gap = hasScore ? Number((targetBand - numericScore).toFixed(1)) : null;
  const atTarget = gap !== null && gap <= 0;
  const observed = Array.isArray(item?.observed_range) ? item.observed_range : null;
  const spread = observed && observed[0] !== observed[1];

  return (
    <div
      className={cn(
        TILE,
        'flex flex-col justify-between p-3 sm:p-3.5 transition-all duration-150 hover:border-[#5a63df]/30 hover:bg-[#f8f7fd] hover:shadow-xs dark:hover:border-[#8f97ff]/25 dark:hover:bg-white/[0.06]'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconChip icon={Icon} tone={getModuleTone(module)} className="shrink-0" />
          <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
            {style.label}
          </span>
        </div>
        <span
          className={cn(NUM, 'shrink-0 text-base font-extrabold text-slate-900 dark:text-white')}
        >
          {displayScore}
        </span>
      </div>

      <div className="my-2.5">
        <div className={cn('relative h-2 w-full overflow-hidden rounded-full', WELL)}>
          {hasScore && (
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-out',
                atTarget
                  ? 'bg-[rgb(var(--signal-ok))]'
                  : 'bg-[linear-gradient(90deg,#5a63df,#8f97ff)]'
              )}
              style={{ width: `${Math.min(100, (numericScore / BAND_MAX) * 100)}%` }}
            />
          )}
          <span
            aria-hidden="true"
            title={`Target: ${targetBand.toFixed(1)}`}
            className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-slate-400/90 shadow-2xs dark:bg-white/70"
            style={{ left: `${Math.min(100, (targetBand / BAND_MAX) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-1.5 text-[11px] leading-tight">
        <span
          className={cn(
            'truncate font-semibold',
            !hasScore
              ? 'font-medium text-slate-400 dark:text-slate-500'
              : atTarget
                ? 'text-[rgb(var(--signal-ok))]'
                : 'text-slate-600 dark:text-slate-300'
          )}
          title={
            !hasScore ? 'No score yet' : atTarget ? 'At target' : `${gap.toFixed(1)} below target`
          }
        >
          {!hasScore ? 'No score yet' : atTarget ? 'At target' : `${gap.toFixed(1)} below target`}
        </span>
        <span
          className="shrink-0 font-mono text-[10.5px] font-medium text-slate-400 dark:text-slate-500"
          title={
            hasScore
              ? spread
                ? `Observed range: ${Number(observed[0]).toFixed(1)}–${Number(observed[1]).toFixed(1)}`
                : `${sampleCount} test${sampleCount === 1 ? '' : 's'} recorded`
              : 'Level check required'
          }
        >
          {hasScore
            ? spread
              ? `${Number(observed[0]).toFixed(1)}–${Number(observed[1]).toFixed(1)}`
              : `${sampleCount} test${sampleCount === 1 ? '' : 's'}`
            : 'Needs test'}
        </span>
      </div>
    </div>
  );
}

export default function ReadinessPanel({ readiness, days = [], targetBand = 7, onStart }) {
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
      className={cn(PANEL, 'flex h-full flex-col p-4 sm:p-5')}
      aria-labelledby="readiness-title"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelTitle
          label="Recent practice scores"
          accent
          tip="Median of your scored practice over the last 90 days. Never a predicted exam score."
          action={
            <Pill tone={isAvailable ? 'ok' : 'warn'}>
              {isAvailable && range
                ? `Overall band ${range[0]}–${range[1]}`
                : 'Needs a level check'}
            </Pill>
          }
        />
        <p id="readiness-title" className={cn('text-xs font-medium leading-relaxed', MUTED)}>
          Where you stand today against your target of{' '}
          <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
            {Number(targetBand).toFixed(1)}
          </span>
          . The notch on each bar marks that target.
        </p>

        {/* `flex-1` + `auto-rows-fr`: the four tiles absorb whatever height this
            panel is stretched to by its taller neighbours. Kept as 2x2 grid across
            viewports (responsive layout invariant: grid-cols-2 sm:grid-cols-4 2xl:grid-cols-2)
            so cards never compress into squished vertical tubes with truncated labels. */}
        <div className="mt-3 grid flex-1 auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-2 2xl:grid-cols-2">
          {MODULES.map((module) => (
            <ModuleScoreCard
              key={module}
              module={module}
              item={readiness?.modules?.[module]}
              targetBand={Number(targetBand) || 7}
            />
          ))}
        </div>
      </div>

      {nextCheckTask ? (
        <div
          className={cn(
            TILE,
            'mt-4 flex flex-col gap-3 border-amber-200/80 bg-amber-50/60 p-3.5 shadow-2xs dark:border-amber-500/20 dark:bg-amber-500/8 sm:flex-row sm:items-center sm:justify-between'
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
            <p className={cn('mt-0.5 line-clamp-1 text-[11px] font-medium', MUTED)}>
              Add a score to compare fairly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStart?.(nextCheckTask)}
            className="group inline-flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 text-xs font-bold text-white shadow-xs transition-all duration-150 ease-smooth-out hover:bg-[#4850c8] hover:shadow-sm active:scale-[0.96] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 motion-reduce:transform-none"
          >
            Start score check{' '}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-smooth-out group-hover:translate-x-0.5" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
