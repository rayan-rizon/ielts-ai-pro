import React from 'react';
import { CheckCircle2, ListChecks, RefreshCw, Settings2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, Pill, TILE } from '@/features/dashboard/components/primitives';
import { getFriendlyPlanText } from './dashboardUtils';

function friendlyTrigger(trigger) {
  return String(trigger || 'current revision')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STEP_STATE = {
  done: {
    chip: 'border-[rgb(var(--signal-ok)/0.35)] bg-[rgb(var(--signal-ok)/0.10)] text-[rgb(var(--signal-ok))]',
    label: 'text-[rgb(var(--signal-ok))]',
    rail: 'bg-[rgb(var(--signal-ok)/0.35)]',
  },
  active: {
    chip: 'border-[#5a63df]/35 bg-[#5a63df]/10 text-[#5a63df] dark:text-[#afb5ff]',
    label: 'text-[#5a63df] dark:text-[#afb5ff]',
    rail: 'bg-[#eceafa] dark:bg-white/[0.12]',
  },
  next: {
    chip: 'border-[#ebeaf7] bg-white text-slate-400 dark:border-white/[0.11] dark:bg-white/[0.04] dark:text-slate-500',
    label: 'text-slate-400 dark:text-slate-500',
    rail: 'bg-[#eceafa] dark:bg-white/[0.12]',
  },
};

/**
 * One rung of the plan guide. The rail runs *behind* the chip and stops at the
 * last step, so three rows read as a single continuous flow rather than three
 * unrelated blocks.
 */
function GuideStep({ icon: Icon, state, label, title, detail, isLast }) {
  const tone = STEP_STATE[state] || STEP_STATE.next;

  return (
    <li className="relative flex min-w-0 gap-2.5 pb-3 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn('absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px', tone.rail)}
        />
      )}
      <span
        className={cn(
          'relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
          tone.chip
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(MICRO, 'truncate', tone.label)}>{label}</p>
        <p className="mt-0.5 line-clamp-1 text-[11.5px] font-bold leading-snug text-slate-900 dark:text-white">
          {title}
        </p>
        <p className={cn('mt-0.5 line-clamp-2 text-[11px] font-medium leading-relaxed', MUTED)}>
          {detail}
        </p>
      </div>
    </li>
  );
}

/**
 * "Your plan guide" — the three-beat explanation of why the plan looks the way
 * it does (evidence in → checkpoint → path updates), plus the two controls that
 * govern the plan itself: keeping it current, and changing its inputs.
 *
 * Starting a task lives in the "Do this next" tile beside this card, not here —
 * a card that explains *why* the plan looks this way shouldn't also duplicate
 * the *do it* button next to it. This card owns exactly two actions: refresh
 * and edit, each with a single home on the page.
 */
export default function PlanSignalsCard({
  trigger,
  changeReason,
  checkpoint,
  readiness,
  onCustomize,
  planUpdateAvailable = false,
  refreshing = false,
  onRefresh,
  className,
}) {
  const checkpointTitle = getFriendlyPlanText(checkpoint?.title || 'Complete a scored level check');
  const checkpointDetail = getFriendlyPlanText(
    checkpoint?.progress_definition ||
      readiness?.overall?.disclaimer ||
      'Complete next activity to add evidence.'
  );
  const isLive = !refreshing && !planUpdateAvailable;

  return (
    <aside
      className={cn(TILE, 'flex min-w-0 flex-col p-4', className)}
      aria-labelledby="plan-signals-title"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-[3px] shrink-0 rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
          />
          <h2
            id="plan-signals-title"
            className="truncate text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100"
          >
            Your plan guide
          </h2>
        </div>
        <Pill tone={refreshing ? 'accent' : planUpdateAvailable ? 'warn' : 'ok'}>
          {refreshing ? 'Refreshing' : planUpdateAvailable ? 'Update ready' : 'Plan is live'}
        </Pill>
      </div>
      <p className={cn('mt-1 text-[11px] font-medium leading-relaxed', MUTED)}>
        What changed, and what to do next.
      </p>

      <ol className="mt-3.5 min-w-0">
        <GuideStep
          icon={RefreshCw}
          state="done"
          label="Evidence received"
          title={friendlyTrigger(trigger)}
          detail={getFriendlyPlanText(
            changeReason || 'Your plan updates with new practice scores.'
          )}
        />
        <GuideStep
          icon={ListChecks}
          state="active"
          label="Your checkpoint"
          title={checkpointTitle}
          detail={checkpointDetail}
        />
        <GuideStep
          icon={isLive ? CheckCircle2 : Sparkles}
          state="next"
          label="Then"
          title="Your path updates"
          detail="Your stage, focus areas, and next tasks refresh together."
          isLast
        />
      </ol>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3.5">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title={planUpdateAvailable ? undefined : 'No AI request when nothing changed'}
            className={cn(
              'inline-flex h-8 flex-1 items-center justify-center rounded-lg px-3 text-[11px] font-bold transition-colors disabled:opacity-50',
              planUpdateAvailable
                ? 'border border-amber-300/60 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200'
                : 'border border-[#e2e5f2] bg-white text-slate-600 hover:border-[#c9cdf3] hover:text-slate-900 dark:border-white/[0.11] dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
            )}
          >
            <RefreshCw
              className={cn(
                'mr-1.5 h-3.5 w-3.5',
                refreshing && 'animate-spin motion-reduce:animate-none'
              )}
            />
            {refreshing ? 'Updating…' : planUpdateAvailable ? 'Update plan' : 'Check for updates'}
          </button>
        )}
        {onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="inline-flex h-8 items-center rounded-lg border border-[#e2e5f2] bg-white px-3 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#c9cdf3] hover:text-slate-900 dark:border-white/[0.11] dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Edit plan
          </button>
        )}
      </div>
    </aside>
  );
}
