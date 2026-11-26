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
      className="inline-flex min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-white/70 bg-white/15 px-2 py-0.5 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-white/25 active:scale-[0.97]"
    >
      <span className={cn(NUM, 'truncate text-[11px] font-bold text-white')}>{code}</span>
      <Icon className="h-3 w-3 shrink-0 text-white/90" aria-hidden="true" />
    </button>
  );
}

/**
 * The learner's offer as a compact red ribbon at the top of a plan card:
 * row 1 pairs the limited-offer badge with the ticking clock, and row 2 pairs the
 * label with the copyable code so every edge stays flush at any card width.
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
      className={cn('flex flex-col gap-1.5 bg-[#c93c34] px-5 py-2.5 text-white', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-wider">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none"
            aria-hidden="true"
          />
          Limited offer{percent ? ` · ${percent}% off` : ''}
        </span>
        <span
          role="timer"
          aria-label="Offer ends in"
          className={cn(
            NUM,
            'shrink-0 text-xs font-extrabold',
            remaining < 3_600_000 && 'animate-none'
          )}
        >
          {formatClock(remaining)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-1.5">
        <span className="text-[11px] font-medium text-white/85">Promo code</span>
        <CodeChip code={code} />
      </div>
    </div>
  );
}
