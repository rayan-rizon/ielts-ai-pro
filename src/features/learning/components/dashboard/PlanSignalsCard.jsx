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
    chip: 'border-[#5a63df]/35 bg-[#5a63df]/10 text-[#5a63df] dark:text-[#afb5ff] dark:border-[#8f97ff]/35 dark:bg-[#8f97ff]/12',
    label: 'text-[#5a63df] dark:text-[#afb5ff]',
    rail: 'bg-slate-200 dark:bg-white/12',
  },
  next: {
    chip: 'border-[#e4e2f0] bg-slate-50/80 text-slate-400 dark:border-white/10 dark:bg-white/4 dark:text-slate-500',
    label: 'text-slate-400 dark:text-slate-500',
    rail: 'bg-slate-200 dark:bg-white/12',
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
    <li className="relative flex min-w-0 gap-3 pb-3.5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={cn('absolute left-[13.5px] top-7 h-[calc(100%-1.6rem)] w-0.5', tone.rail)}
        />
      )}
      <span
        className={cn(
          'relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-2xs',
          tone.chip
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(MICRO, 'truncate', tone.label)}>{label}</p>
        <p className="mt-0.5 text-xs font-bold leading-snug text-slate-900 dark:text-white">
          {title}
        </p>
        <p className={cn('mt-0.5 text-[11px] font-medium leading-relaxed', MUTED)} title={detail}>
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
  generatedAt,
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
      className={cn(
        TILE,
        'flex min-w-0 flex-col p-3.5 sm:p-4 shadow-2xs transition-all duration-150',
        className
      )}
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
            className="truncate text-[13px] font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Your plan guide
          </h2>
        </div>
        <Pill tone={refreshing ? 'accent' : planUpdateAvailable ? 'warn' : 'ok'}>
          {refreshing ? 'Updating plan' : planUpdateAvailable ? 'Update needed' : 'Saved plan'}
        </Pill>
      </div>
      <p className={cn('mt-1 text-[11px] font-medium leading-relaxed', MUTED)}>
        {generatedAt && Number.isFinite(Date.parse(generatedAt))
          ? `Last updated ${new Date(generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}. `
          : 'Your first plan uses your goals and available study time. '}
        Check below to see why each task helps.
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
          detail="Scored tests and practice update your focus. An expired week renews when you open this page."
          isLast
        />
      </ol>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-3.5">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Checks your latest results; reuses the saved plan when nothing changed"
            className={cn(
              'group inline-flex h-8.5 items-center justify-center rounded-lg px-2.5 text-[11px] font-bold shadow-xs transition-all duration-150 ease-smooth-out disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-[#8f97ff] dark:focus-visible:ring-offset-[#141319]',
              planUpdateAvailable
                ? 'border border-amber-300/80 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 hover:text-amber-950 hover:shadow-sm active:scale-[0.97] active:bg-amber-200/80 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:border-amber-400/50 dark:hover:bg-amber-500/20 dark:hover:text-amber-100'
                : 'border border-[#e2e5f2] bg-white text-slate-700 hover:border-[#5a63df]/35 hover:bg-[#f4f3fb] hover:text-[#5a63df] hover:shadow-sm active:scale-[0.97] active:bg-[#edeafa] dark:border-white/11 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white'
            )}
          >
            <RefreshCw
              className={cn(
                'mr-1.5 h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transform-none',
                refreshing && 'animate-spin motion-reduce:animate-none'
              )}
            />
            <span className="truncate">
              {refreshing ? 'Updating…' : planUpdateAvailable ? 'Update plan' : 'Check for updates'}
            </span>
          </button>
        )}
        {onCustomize && (
          <button
            type="button"
            onClick={onCustomize}
            className="group inline-flex h-8.5 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-xs transition-all duration-150 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f4f3fb] hover:text-[#5a63df] hover:shadow-sm active:scale-[0.97] active:bg-[#edeafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 motion-reduce:transform-none dark:border-white/11 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-[#8f97ff] dark:focus-visible:ring-offset-[#141319]"
          >
            <Settings2 className="mr-1.5 h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transform-none" />{' '}
            <span className="truncate">Edit plan</span>
          </button>
        )}
      </div>
    </aside>
  );
}
