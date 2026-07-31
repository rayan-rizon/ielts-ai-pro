import React from 'react';
import { m } from 'framer-motion';
import { BarChart2, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';

const TIMEFRAME_LABELS = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: 'All time',
};

export default function AnalyticsHeader({
  user,
  stats,
  isPremium,
  tier,
  selectedTimeframe,
  setSelectedTimeframe,
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.full_name || user?.username || user?.email?.split('@')[0] || '';
  const firstName = displayName.trim().split(/\s+/)[0];

  return (
    <header className="flex flex-col gap-3 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="accent">
              <BarChart2 className="h-3 w-3" />
              Your progress report
            </Pill>
            {tier === 'premium' ? (
              <Pill tone="accent">
                <Crown className="h-3 w-3" /> Premium
              </Pill>
            ) : tier === 'pro' || isPremium ? (
              <Pill tone="sky">
                <Zap className="h-3 w-3" /> Pro
              </Pill>
            ) : null}
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Analytics
          </h1>
          <p className={cn('mt-1 text-sm font-medium', MUTED)}>
            {greeting}
            {firstName ? `, ${firstName}` : ''}. Here is what your practice results say about your
            band score, and what to work on next.
          </p>
        </div>
      </div>

      {/* Timeframe — labelled in plain words, not just "7d/30d". */}
      <div className={cn(TILE, 'flex flex-wrap items-center justify-between gap-2 p-2')}>
        <div className="flex items-center gap-2 pl-1">
          <span className={cn(MICRO, MUTED)}>Showing</span>
          {stats?.totalTests ? (
            <span className={cn(MICRO, 'text-slate-700 dark:text-slate-200')}>
              <span className={cn(NUM, 'font-bold')}>{stats.totalTests}</span> completed
              {stats.totalTests === 1 ? ' session' : ' sessions'}
              {stats?.targetScore ? (
                <>
                  {' · target band '}
                  <span className={cn(NUM, 'font-bold')}>{stats.targetScore}</span>
                </>
              ) : null}
            </span>
          ) : (
            <span className={cn(MICRO, MUTED)}>No completed sessions yet</span>
          )}
        </div>

        <div
          className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04]"
          role="group"
          aria-label="Analytics timeframe"
        >
          {['7d', '30d', '90d', 'all'].map((tf) => {
            const isActive = selectedTimeframe === tf;
            return (
              <m.button
                key={tf}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedTimeframe(tf)}
                aria-pressed={isActive}
                className={cn(
                  'relative z-10 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
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
        </div>
      </div>
    </header>
  );
}
