import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { useOfferRemaining } from '../hooks/useOfferRemaining';
import { formatClock } from '../offerCountdown';

function CodeChip({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the code stays visible and selectable */
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Code copied' : `Copy code ${code}`}
      className="inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-md border border-dashed border-white/70 bg-white/15 px-1.5 py-0.5 transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      <span className={cn(NUM, 'truncate text-[11px] font-bold text-white')}>{code}</span>
      <Icon className="h-3 w-3 shrink-0 text-white/90" aria-hidden="true" />
    </button>
  );
}

/**
 * The learner's offer as a compact red ribbon at the top of a plan card: a limited-offer
 * badge with the value, the code to copy and a clock that ticks. One slim row (it wraps on
 * narrow cards), so the offer is the first thing seen without taking a row of the page.
 */
export default function OfferStrip({ code, percent, expiresAt, onExpire, className }) {
  const end = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const remaining = useOfferRemaining(end);
  const live = Boolean(code) && Number.isFinite(end) && remaining > 0;

  useEffect(() => {
    if (Number.isFinite(end) && remaining <= 0) onExpire?.();
  }, [end, remaining, onExpire]);

  if (!live) return null;
  return (
    <div
      aria-label="Your offer"
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 bg-[#c93c34] px-4 py-1.5 text-white',
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"
          aria-hidden="true"
        />
        Limited offer{percent ? ` · ${percent}% off` : ''}
      </span>
      <CodeChip code={code} />
      <span
        role="timer"
        aria-label="Offer ends in"
        className={cn(NUM, 'text-[13px] font-extrabold', remaining < 3_600_000 && 'animate-none')}
      >
        {formatClock(remaining)}
      </span>
    </div>
  );
}
