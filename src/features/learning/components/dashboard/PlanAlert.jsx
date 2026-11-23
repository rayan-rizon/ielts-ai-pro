import React from 'react';
import { AlertTriangle, Clock3, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED } from '@/features/dashboard/components/primitives';
import { formatMinutes, getFriendlyTaskTitle } from './dashboardUtils';

const TONES = {
  warn: {
    shell:
      'border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] dark:bg-[rgb(var(--signal-warn)/0.1)]',
    chip: 'text-[rgb(var(--signal-warn))]',
  },
  fault: {
    shell:
      'border-[rgb(var(--signal-fault)/0.35)] bg-[rgb(var(--signal-fault)/0.07)] dark:bg-[rgb(var(--signal-fault)/0.1)]',
    chip: 'text-[rgb(var(--signal-fault))]',
  },
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** One sentence that says what the numbers mean and what to do about it. */
const describeAttention = ({ kind, daysSincePractice, missedDays, nextTask }) => {
  const next = nextTask
    ? `Start with ${getFriendlyTaskTitle(nextTask)} (${formatMinutes(
        nextTask.estimated_time || nextTask.estimated_minutes
      )}).`
    : 'Pick any practice to get going again.';
  if (kind === 'inactive') {
    return `Your last scored practice was ${plural(daysSincePractice, 'day')} ago. A short session brings you back faster than trying to catch up. ${next}`;
  }
  return `${plural(missedDays, 'day')} in the last 7 had study time set aside but no practice. ${next}`;
};

/**
 * The page's only interruption. It appears when real practice history shows the
 * learner has drifted from the plan, and is silent otherwise.
 */
export default function PlanAlert({
  attention,
  daysSincePractice,
  missedDays,
  nextTask,
  onStart,
  onCustomize,
  onDismiss,
}) {
  if (!attention) return null;
  const tone = TONES[attention.tone] || TONES.warn;
  const Icon = attention.kind === 'inactive' ? Clock3 : AlertTriangle;

  return (
    <section
      role={attention.tone === 'fault' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2 sm:flex-nowrap sm:px-3.5 sm:py-2.5',
        tone.shell
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-white/[0.06]',
          tone.chip
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">
          {attention.title}
        </h2>
        <p className={cn('mt-0.5 text-xs font-medium leading-snug', MUTED)}>
          {describeAttention({ kind: attention.kind, daysSincePractice, missedDays, nextTask })}
        </p>
      </div>
      <div className="flex w-full shrink-0 items-center gap-1.5 sm:w-auto">
        {nextTask && (
          <button
            type="button"
            onClick={() => onStart(nextTask)}
            className="h-7 flex-1 rounded-md bg-[#5a63df] px-2.5 text-[11px] font-bold text-white transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.97] sm:flex-none"
          >
            Start next session
          </button>
        )}
        <button
          type="button"
          onClick={onCustomize}
          className="h-7 flex-1 rounded-md border border-[#e4e2f0] bg-white px-2.5 text-[11px] font-bold text-slate-700 transition-all duration-150 hover:border-[#5a63df]/35 hover:text-[#5a63df] active:scale-[0.97] sm:flex-none dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-[#b8bdff]"
        >
          Change study time
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
