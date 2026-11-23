import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO } from '@/features/dashboard/components/primitives';
import { countdownUnits } from '../offerCountdown';
import { useOfferRemaining } from '../hooks/useOfferRemaining';

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the code is visible and selectable either way */
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy code ${code}`}
      className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#c93c34]/60 bg-white px-2 py-1 dark:bg-white/[0.06]"
    >
      <span className={cn(NUM, 'text-[13px] font-bold text-slate-800 dark:text-slate-100')}>
        {code}
      </span>
      <Icon className="h-3 w-3 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function Clock({ remaining }) {
  const urgent = remaining < 3_600_000;
  return (
    <div role="timer" aria-label="Offer ends in" className="flex items-end gap-1.5">
      <span className={cn(MICRO, 'mb-1.5 mr-0.5 text-slate-500')}>Ends in</span>
      {countdownUnits(remaining).map(([value, unit]) => (
        <span
          key={unit}
          className="flex min-w-[44px] flex-col items-center rounded-lg border border-[#e4e2f0] bg-white px-1.5 py-1 dark:border-white/[0.07] dark:bg-white/[0.06]"
        >
          <span
            className={cn(
              NUM,
              'text-lg font-bold leading-none',
              urgent ? 'text-[#c93c34]' : 'text-slate-800 dark:text-slate-100'
            )}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span className={cn(MICRO, 'mt-0.5 text-[8px] text-slate-500')}>{unit}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * A learner's live offer: the code, what it is worth and a clock that ticks. When the
 * time runs out it calls onExpire so the page stops quoting a discount that has ended.
 */
export default function OfferCountdownBanner({ code, percent, expiresAt, onExpire, className }) {
  const end = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const remaining = useOfferRemaining(end);
  const live = Boolean(code) && Number.isFinite(end) && remaining > 0;

  useEffect(() => {
    if (Number.isFinite(end) && remaining <= 0) onExpire?.();
  }, [end, remaining, onExpire]);

  if (!live) return null;
  return (
    <section
      aria-label="Your offer"
      className={cn(
        'rounded-xl border border-[#f1cfcb] bg-[#fdf5f4] p-3 dark:border-white/[0.07] dark:bg-white/[0.04] sm:p-3.5',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={cn(MICRO, 'text-[#c93c34]')}>
            <span aria-hidden="true">●</span> Limited time
          </p>
          <p className="mt-0.5 text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {percent ? `${percent}% off your first payment` : 'Your personal offer'}
          </p>
          <CopyCode code={code} />
        </div>
        <Clock remaining={remaining} />
      </div>
    </section>
  );
}
