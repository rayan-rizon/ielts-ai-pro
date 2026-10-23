import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, PANEL } from './primitives';

const DISMISS_KEY = 'dashboardV3:featureRequestCardDismissed';

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Feature requests only lived under Settings → Profile, which most learners
 * never open. This is the dashboard door to the same page: one quiet row, no
 * invented numbers, dismissible for good (Settings still links to it).
 */
export default function FeatureRequestCard() {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode: the card simply comes back next visit.
    }
  };

  return (
    <div className={cn(PANEL, 'relative')} data-testid="feature-request-card">
      <Link
        to="/feature-requests"
        className="group flex items-center gap-3 rounded-xl py-3 pl-3.5 pr-10 transition-colors duration-150 ease-smooth-out hover:bg-[#f7f6fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:hover:bg-white/4"
      >
        <IconChip icon={Lightbulb} size="md" />
        <div className="min-w-0 flex-1">
          <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>Feature requests</p>
          <p className="mt-0.5 text-[13px] font-extrabold leading-tight tracking-tight text-slate-800 dark:text-slate-100">
            Want a new feature? Tell us.
          </p>
          <p className={cn('mt-0.5 hidden text-[11px] font-medium sm:block', MUTED)}>
            Share your idea, or vote for ideas from other students.
          </p>
        </div>
        <span
          className={cn(
            MICRO,
            'hidden shrink-0 items-center gap-1 rounded-md bg-[#5a63df] px-2.5 py-1.5 text-white transition-all duration-150 ease-smooth-out group-hover:bg-[#4a52c9] group-active:scale-95 sm:inline-flex'
          )}
        >
          Share an idea
          <ArrowRight className="h-3 w-3" />
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#5a63df] sm:hidden" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide feature request card"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-slate-400 transition-all duration-150 ease-smooth-out hover:bg-[#f4f3fb] hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-slate-500 dark:hover:bg-white/8 dark:hover:text-slate-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
