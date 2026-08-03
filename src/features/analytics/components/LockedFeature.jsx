import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

const BENEFITS = ['Per-module trends over time', 'Personalised, evidence-ranked focus areas'];

/**
 * Pro gate.
 *
 * The previous version stacked a 2rem-radius amber card, a rotating gradient
 * badge and four stock-photo avatars captioned "Join 2,500+ successful
 * students" — numbers and faces the app has no basis for. It says what is
 * behind the gate and where to unlock it; nothing invented.
 *
 * The overlay card carries its own panel background rather than sitting
 * directly on the blurred preview — legibility depends on contrast against
 * whatever happens to be underneath, and card content isn't reliably light or
 * dark at that spot.
 */
const LockedFeature = React.memo(function LockedFeature({
  isLocked,
  children,
  className,
  compact = false,
}) {
  if (!isLocked) return children;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div aria-hidden="true" className="pointer-events-none select-none opacity-20 blur-[6px]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div
          className={cn(
            PANEL,
            'flex w-full flex-col items-center gap-2.5 p-4 text-center shadow-[0_8px_24px_-8px_rgba(15,15,30,0.25)]',
            compact ? 'max-w-[250px]' : 'max-w-[300px]'
          )}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <Crown className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <p className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Unlock with Pro
          </p>

          <ul className="w-full space-y-1 text-left">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className={cn(TILE, 'flex items-center gap-1.5 px-2 py-1.5 text-left')}
              >
                <Check
                  className="h-3 w-3 shrink-0 text-[rgb(var(--signal-ok))]"
                  strokeWidth={2.75}
                />
                <span className="text-[10.5px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to="/pricing"
            className={cn(
              MICRO,
              'mt-0.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] px-4 text-white',
              'transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4a52c9] hover:shadow-md active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
            )}
          >
            Upgrade to Pro
          </Link>
          <p className={cn('text-[10px] font-medium', MUTED)}>See plans and pricing</p>
        </div>
      </div>
    </div>
  );
});

export default LockedFeature;
