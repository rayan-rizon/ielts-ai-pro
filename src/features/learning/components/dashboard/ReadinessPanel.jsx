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
    <div className={cn(TILE, 'flex flex-col justify-between p-2.5')}>
      {/* Subject and score share one baseline: the label row carried nothing but
          a name, and the score row nothing but a number, so the card spent two
          rows saying "Reading 1.0". */}
      <div className="flex items-baseline gap-2">
        <IconChip icon={Icon} tone={getModuleTone(module)} className="self-center" />
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-900 dark:text-slate-100">
          {style.label}
        </span>
        <span className={cn(NUM, 'shrink-0 text-lg font-extrabold text-slate-900 dark:text-white')}>
          {displayScore}
        </span>
      </div>

      {/* The spread behind the median. A single "1.0" across 27 tests reads as
          broken until you can see the attempts actually ranged 1.0 to 5.0 —
          and the room for it came free once the card stretched to fill its row. */}
      {spread && (
        <p className={cn(MICRO, MUTED, 'mt-2 truncate')}>
          Range{' '}
          <span className={cn(NUM, 'font-bold text-slate-600 dark:text-slate-300')}>
            {Number(observed[0]).toFixed(1)}–{Number(observed[1]).toFixed(1)}
          </span>
        </p>
      )}

      <div className={cn('relative mt-2 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
        {hasScore && (
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500 ease-out',
              atTarget ? 'bg-[rgb(var(--signal-ok))]' : 'bg-[#5a63df] dark:bg-[#8f97ff]'
            )}
            style={{ width: `${Math.min(100, (numericScore / BAND_MAX) * 100)}%` }}
          />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-slate-400 dark:bg-white/50"
          style={{ left: `${Math.min(100, (targetBand / BAND_MAX) * 100)}%` }}
        />
      </div>

      <p className="mt-1.5 flex items-baseline justify-between gap-1.5 text-[10px] font-bold">
        <span
          className={cn(
            'truncate',
            !hasScore
              ? MUTED
              : atTarget
                ? 'text-[rgb(var(--signal-ok))]'
                : 'text-slate-600 dark:text-slate-300'
          )}
        >
          {!hasScore
            ? 'No score yet'
            : atTarget
              ? 'At your target'
              : `${gap.toFixed(1)} below target`}
        </span>
        <span className={cn(MICRO, MUTED, 'shrink-0')}>
          {hasScore ? `${sampleCount} test${sampleCount === 1 ? '' : 's'}` : 'Needs test'}
        </span>
      </p>
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
            panel is stretched to by its taller neighbours, instead of leaving it
            pooled in one dead band above the footer. */}
        <div className="mt-3 grid flex-1 auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-2">
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
            'mt-4 flex flex-col gap-3 border-amber-200/60 bg-amber-50/40 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/6 sm:flex-row sm:items-center sm:justify-between'
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
      ) : null}
    </section>
  );
}
