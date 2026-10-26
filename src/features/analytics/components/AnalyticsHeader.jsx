import React from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart2, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, Pill, TierBadge } from '@/features/dashboard/components/primitives';

const TIMEFRAME_LABELS = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

/**
 * One line of chrome, not a landing page.
 *
 * The old header spent four rows on a greeting, a paragraph explaining what
 * analytics is, and a strip repeating the session count and target band that
 * the tiles directly below already print. Title and timeframe share a row now;
 * every number it used to restate lives exactly once, in the stat band.
 */
export default function AnalyticsHeader({
  isPremium,
  tier,
  selectedTimeframe,
  setSelectedTimeframe,
}) {
  const paidTier = tier === 'premium' ? 'premium' : tier === 'pro' || isPremium ? 'pro' : null;

  return (
    <header className="flex flex-col gap-3 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="accent">
            <BarChart2 className="h-3 w-3" />
            Progress report
          </Pill>
          {paidTier ? <TierBadge tier={paidTier} /> : null}
        </div>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Analytics
        </h1>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('hidden text-[11px] font-semibold sm:inline', MUTED)}>Showing</span>
        <div
          className="no-scrollbar flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-lg sm:w-auto border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/4"
          role="group"
          aria-label="Analytics timeframe"
        >
          {(isPremium ? ['7d', '30d', '90d', 'all'] : ['7d', '30d']).map((tf) => {
            const isActive = selectedTimeframe === tf;
            return (
              <m.button
                key={tf}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedTimeframe(tf)}
                aria-pressed={isActive}
                className={cn(
                  'relative z-10 flex-1 shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-[11px] sm:flex-none sm:py-1.5 font-extrabold uppercase tracking-wider transition-colors duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <m.div
                    layoutId="analyticsTimeframeIndicator"
                    className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{TIMEFRAME_LABELS[tf]}</span>
              </m.button>
            );
          })}
          {!isPremium ? (
            <Link
              to="/upgrade"
              className="inline-flex flex-1 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-[10px] sm:flex-none sm:py-1.5 font-extrabold uppercase tracking-wider text-[#5a63df] transition-colors hover:bg-[#f2f1fb] dark:text-[#a9afff] dark:hover:bg-white/[0.07]"
              aria-label="Unlock 90-day and all-time analytics with Pro"
            >
              <LockKeyhole className="h-3 w-3" />
              90d + all
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
