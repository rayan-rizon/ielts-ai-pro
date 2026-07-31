import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  ListChecks,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  PanelTitle,
  TILE,
} from '@/features/dashboard/components/primitives';
import { getFriendlyPlanText, getFriendlyTaskTitle } from './dashboardUtils';

function friendlyTrigger(trigger) {
  return String(trigger || 'current revision')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PlanSignalsCard({
  trigger,
  changeReason,
  checkpoint,
  readiness,
  nextTask,
  onStart,
  onCustomize,
  planUpdateAvailable = false,
  refreshing = false,
  onRefresh,
}) {
  const checkpointTitle = getFriendlyPlanText(checkpoint?.title || 'Complete a scored level check');
  const checkpointDetail = getFriendlyPlanText(
    checkpoint?.progress_definition ||
      readiness?.overall?.disclaimer ||
      'Complete next activity to add evidence.'
  );
  const canStart = Boolean(nextTask && onStart);
  const isLive = !refreshing && !planUpdateAvailable;

  return (
    <section
      className={cn(PANEL, 'flex flex-col justify-between p-5 sm:p-6')}
      aria-labelledby="plan-signals-title"
    >
      <div className="min-w-0">
        <PanelTitle label="Your plan guide" accent />
        <h2
          id="plan-signals-title"
          className="text-base font-extrabold text-slate-900 dark:text-white"
        >
          What changed, and what to do next
        </h2>

        <div className="mt-6">
          <div className="relative flex items-center justify-between">
            <div
              aria-hidden="true"
              className="absolute left-4 right-1/2 top-4 hidden h-0.5 -translate-y-1/2 bg-[#eeedf7] dark:bg-white/10 sm:block"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 right-4 top-4 hidden h-0.5 -translate-y-1/2 bg-[#eeedf7] dark:bg-white/10 sm:block"
            />
            <IconChip icon={RefreshCw} size="md" className="relative z-10" />
            <IconChip icon={ListChecks} size="md" tone="sky" className="relative z-10" />
            <IconChip icon={CheckCircle2} size="md" tone="neutral" className="relative z-10" />
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 text-left">
              <p className={cn(MICRO, 'truncate text-slate-400')}>Evidence received</p>
              <p className="mt-0.5 line-clamp-1 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                {friendlyTrigger(trigger)}
              </p>
              <p className={cn('mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed', MUTED)}>
                {getFriendlyPlanText(changeReason || 'Your plan updates with new practice scores.')}
              </p>
            </div>

            <div className="min-w-0 text-left sm:text-center">
              <p className={cn(MICRO, 'truncate text-slate-400')}>Your checkpoint</p>
              <p className="mt-0.5 line-clamp-1 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                {checkpointTitle}
              </p>
              <p className={cn('mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed', MUTED)}>
                {checkpointDetail}
              </p>
            </div>

            <div className="min-w-0 text-left sm:text-right">
              <p className={cn(MICRO, 'truncate text-slate-400')}>Then</p>
              <p className="mt-0.5 line-clamp-1 text-xs font-bold leading-snug text-slate-900 dark:text-white">
                Your path updates
              </p>
              <p className={cn('mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed', MUTED)}>
                Refreshes your stage & evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <aside className={cn(TILE, 'mt-5 p-4')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <IconChip icon={CircleDotDashed} tone={isLive ? 'emerald' : 'amber'} size="md" />
            <div className="min-w-0">
              <p
                className={cn(
                  MICRO,
                  isLive ? 'text-[rgb(var(--signal-ok))]' : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {refreshing
                  ? 'Refreshing evidence'
                  : planUpdateAvailable
                    ? 'New evidence ready'
                    : 'Plan is live'}
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                {canStart ? getFriendlyTaskTitle(nextTask) : checkpointTitle}
              </p>
              <p className={cn('mt-0.5 line-clamp-1 text-[11px] font-medium', MUTED)}>
                {canStart
                  ? 'Open the next planned task to feed back into your path.'
                  : 'Review saved goals to pick your next action.'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {canStart && (
              <button
                type="button"
                onClick={() => onStart(nextTask)}
                className="inline-flex h-9 items-center rounded-lg bg-[#5a63df] px-3 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9]"
              >
                Open next task <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </button>
            )}
            {planUpdateAvailable && onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex h-9 items-center rounded-lg border border-amber-300/60 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200"
              >
                <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', refreshing && 'animate-spin')} />
                {refreshing ? 'Updating…' : 'Update plan'}
              </button>
            )}
            {onCustomize && (
              <button
                type="button"
                onClick={onCustomize}
                className="inline-flex h-9 items-center rounded-lg border border-[#e2e5f2] bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:border-[#c9cdf3] hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Review goals
              </button>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
