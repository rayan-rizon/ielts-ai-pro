import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  ListChecks,
  RefreshCw,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <section
      className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white p-5 sm:p-6 shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] dark:border-white/10 dark:bg-[#10131f]"
      aria-labelledby="plan-signals-title"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10"
        aria-hidden="true"
      />

      <div className="relative min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Your plan guide
            </p>
            <h2
              id="plan-signals-title"
              className="text-base font-black text-slate-950 dark:text-white"
            >
              What changed, and what to do next
            </h2>
          </div>
        </div>

        {/* 3-Step Timeline spanning 0%, 50%, 100% width */}
        <div className="mt-6">
          {/* Icons + Connecting Line segments */}
          <div className="relative flex items-center justify-between">
            {/* Line Segment 1: Icon 1 -> Icon 2 */}
            <div
              aria-hidden="true"
              className="absolute top-4 left-4 right-1/2 hidden h-0.5 -translate-y-1/2 overflow-hidden bg-slate-200 dark:bg-white/10 sm:block"
            >
              <span className="learning-path-connector-signal block h-full w-full" />
            </div>

            {/* Line Segment 2: Icon 2 -> Icon 3 */}
            <div
              aria-hidden="true"
              className="absolute top-4 left-1/2 right-4 hidden h-0.5 -translate-y-1/2 overflow-hidden bg-slate-200 dark:bg-white/10 sm:block"
            >
              <span className="learning-path-connector-signal block h-full w-full" />
            </div>

            {/* Icon 1 */}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-600 shadow-2xs dark:border-indigo-400/30 dark:bg-[#10131f] dark:text-indigo-300">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </span>

            {/* Icon 2 */}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-700 shadow-2xs dark:border-teal-400/30 dark:bg-[#10131f] dark:text-teal-300">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </span>

            {/* Icon 3 */}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-2xs dark:border-white/10 dark:bg-[#10131f] dark:text-slate-500">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>

          {/* Text columns aligned under each Icon */}
          <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Step 1 Text (Left) */}
            <div className="min-w-0 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 truncate">
                Evidence received
              </p>
              <p className="mt-0.5 text-xs font-extrabold leading-snug text-slate-950 dark:text-white line-clamp-1">
                {friendlyTrigger(trigger)}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                {getFriendlyPlanText(changeReason || 'Your plan updates with new practice scores.')}
              </p>
            </div>

            {/* Step 2 Text (Center) */}
            <div className="min-w-0 text-left sm:text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 truncate">
                Your checkpoint
              </p>
              <p className="mt-0.5 text-xs font-extrabold leading-snug text-slate-950 dark:text-white line-clamp-1">
                {checkpointTitle}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                {checkpointDetail}
              </p>
            </div>

            {/* Step 3 Text (Right) */}
            <div className="min-w-0 text-left sm:text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 truncate">
                Then
              </p>
              <p className="mt-0.5 text-xs font-extrabold leading-snug text-slate-950 dark:text-white line-clamp-1">
                Your path updates
              </p>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                Refreshes your stage & evidence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <aside className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-400/15 dark:bg-teal-500/[0.07]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-xs dark:bg-slate-950/50 dark:text-teal-300">
              <CircleDotDashed className="h-4 w-4" aria-hidden="true" />
              <span
                className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"
                aria-label={
                  refreshing
                    ? 'Refreshing plan evidence'
                    : planUpdateAvailable
                      ? 'New evidence is ready to apply'
                      : 'Plan evidence is current'
                }
              >
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    refreshing || planUpdateAvailable
                      ? 'bg-amber-400 opacity-75 motion-safe:animate-ping'
                      : 'bg-emerald-400 opacity-40 motion-safe:animate-pulse'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    refreshing || planUpdateAvailable ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300 truncate">
                {refreshing
                  ? 'Refreshing evidence'
                  : planUpdateAvailable
                    ? 'New evidence ready'
                    : 'Plan is live'}
              </p>
              <p className="mt-0.5 text-xs font-extrabold text-slate-950 dark:text-white truncate">
                {canStart ? getFriendlyTaskTitle(nextTask) : checkpointTitle}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                {canStart
                  ? 'Open the next planned task to feed back into your path.'
                  : 'Review saved goals to pick your next action.'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {canStart && (
              <Button
                type="button"
                onClick={() => onStart(nextTask)}
                className="h-8.5 rounded-xl bg-teal-700 px-3 text-xs font-extrabold text-white shadow-xs transition hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Open next task <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
            {planUpdateAvailable && onRefresh && (
              <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8.5 rounded-xl border-amber-200 bg-amber-50/80 px-3 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating…' : 'Update plan'}
              </Button>
            )}
            {onCustomize && (
              <Button
                type="button"
                variant="outline"
                onClick={onCustomize}
                className="h-8.5 rounded-xl border-teal-200 bg-white/80 px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 dark:border-teal-400/20 dark:bg-slate-950/30 dark:text-teal-200 dark:hover:bg-teal-500/10"
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Review goals
              </Button>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
