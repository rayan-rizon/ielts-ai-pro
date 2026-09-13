import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, CircleHelp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FADE_UP, MICRO, MUTED, NUM, TierBadge } from './primitives';
import { requestProductTour } from '../lib/productTourStorage';

const DashboardHeader = React.memo(({ dateLabel, greeting, user, stats, recommended }) => {
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'there';
  const avg = Number(stats?.avgScore) || 0;
  const hasMeasuredScore = Number(stats?.measuredTests) > 0;
  const parsedTarget = Number(stats?.targetScore);
  const target = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;
  const tier = user?.subscription_tier;

  return (
    <m.header
      variants={FADE_UP}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(MICRO, MUTED)}>{dateLabel}</p>
          {tier === 'premium' || tier === 'pro' ? <TierBadge tier={tier} /> : null}
        </div>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {greeting}, {firstName}
        </h1>

        <p className={cn('mt-1 text-xs font-medium', MUTED)}>
          {hasMeasuredScore ? (
            <>
              Band{' '}
              <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                {avg.toFixed(1)}
              </span>{' '}
              average
              {target != null ? (
                <>
                  , targeting{' '}
                  <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                    {target.toFixed(1)}
                  </span>
                </>
              ) : (
                <> · set a target band to track your gap</>
              )}
            </>
          ) : (
            <>No scored tests yet — one test sets your baseline</>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={requestProductTour}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#e4e2f0] bg-white px-2.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#5a63df]/35 hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-[#b8bdff]"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          Quick tour
        </button>
        <Link
          to={recommended.href}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#5a63df] px-3 text-xs font-bold text-white transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
        >
          Practise {recommended.title}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </m.header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
