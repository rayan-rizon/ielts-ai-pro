import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, TILE } from '@/features/dashboard/components/primitives';

/**
 * Pro gate.
 *
 * The previous version stacked a 2rem-radius amber card, a rotating gradient
 * badge and four stock-photo avatars captioned "Join 2,500+ successful
 * students" — numbers and faces the app has no basis for. It says what is
 * behind the gate and where to unlock it; nothing invented.
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

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            TILE,
            'flex w-full flex-col items-center gap-2 p-4 text-center',
            compact ? 'max-w-[240px]' : 'max-w-[280px]'
          )}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">
            <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <p className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Included with Pro
          </p>
          <p className={cn('text-[11px] font-medium leading-snug', MUTED)}>
            Per-module trends and personalised focus areas.
          </p>
          <Link
            to="/pricing"
            className={cn(
              MICRO,
              'mt-1 inline-flex h-8 items-center rounded-lg bg-[#5a63df] px-4 text-white',
              'transition-all duration-200 hover:bg-[#4a52c9] active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
            )}
          >
            See plans
          </Link>
        </div>
      </div>
    </div>
  );
});

export default LockedFeature;
