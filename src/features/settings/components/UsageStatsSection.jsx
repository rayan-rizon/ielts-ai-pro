import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { PenLine, Mic, Target, FileText, Headphones, Crown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUserUsageStats } from '../hooks/useUserUsageStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  Bar,
  MICRO,
  MUTED,
  PANEL,
  PanelTitle,
  Pill,
  Ring,
  Stat,
  TILE,
} from '@/features/dashboard/components/primitives';

function AiUsageTile({ icon: Icon, label, used, limit, bonus, tone, pct, locked }) {
  return (
    <div className={cn(TILE, 'flex flex-col items-center p-3.5')}>
      <Ring value={pct} size={84} stroke={7} label={`${Math.round(pct)}%`} tone={tone} />
      <div className="mt-2.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{label}</h4>
      </div>
      <p className={cn(MICRO, MUTED, 'mt-0.5')}>
        {used} / {limit === 0 ? '0' : limit}
        {bonus > 0 && <span className="ml-1 font-bold text-[#5a63df]">+{bonus} bonus</span>}
      </p>
      {locked && (
        <Link to="/pricing" className="mt-1.5">
          <Pill tone="accent">Unlock</Pill>
        </Link>
      )}
    </div>
  );
}

export default function UsageStatsSection() {
  const { data: stats, isLoading, error } = useUserUsageStats();

  const writingPercent =
    stats?.ai?.writing?.limit === 0
      ? 0
      : (stats?.ai?.writing?.used / stats?.ai?.writing?.limit) * 100 || 0;
  const speakingPercent =
    stats?.ai?.speaking?.limit === 0
      ? 0
      : (stats?.ai?.speaking?.used / stats?.ai?.speaking?.limit) * 100 || 0;

  const totalTests = stats
    ? (stats.tests?.reading || 0) +
      (stats.tests?.listening || 0) +
      (stats.tests?.writing || 0) +
      (stats.tests?.speaking || 0)
    : 0;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2"
          >
            <div className={cn(PANEL, 'h-68 p-4 sm:p-5')}>
              <Skeleton className="mb-4 h-5 w-28 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </div>
            <div className={cn(PANEL, 'flex h-68 flex-col justify-between p-4 sm:p-5')}>
              <Skeleton className="mb-4 h-5 w-28 rounded" />
              <div className="w-full space-y-3">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            </div>
            <div className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-2')}>
              <Skeleton className="mb-4 h-5 w-40 rounded" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          </m.div>
        ) : error ? (
          <m.div
            key="error"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className={cn(
              PANEL,
              'border-[rgba(var(--signal-fault),0.25)] bg-[rgba(var(--signal-fault),0.04)] p-6 text-center'
            )}
          >
            <p className="text-sm font-bold text-[rgb(var(--signal-fault))]">
              Failed to load usage statistics
            </p>
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2"
          >
            <div className={cn(PANEL, 'p-4 sm:p-5')}>
              <div className="flex items-center justify-between">
                <PanelTitle label="AI usage" accent />
                <Pill tone={stats.tier === 'free' ? 'neutral' : 'accent'}>
                  <Crown className="h-2.5 w-2.5" />
                  {stats.tier}
                </Pill>
              </div>
              <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>Monthly limits</p>

              <div className="grid grid-cols-2 gap-2.5">
                <AiUsageTile
                  icon={PenLine}
                  label="Writing"
                  used={stats.ai.writing.used}
                  limit={stats.ai.writing.limit}
                  bonus={stats.ai.writing.bonus}
                  tone="#5a63df"
                  pct={writingPercent}
                />
                <AiUsageTile
                  icon={Mic}
                  label="Speaking"
                  used={stats.ai.speaking.used}
                  limit={stats.ai.speaking.limit}
                  bonus={stats.ai.speaking.bonus}
                  tone="rgb(var(--signal-ok))"
                  pct={speakingPercent}
                  locked={stats.ai.speaking.limit === 0}
                />
              </div>
              <p className={cn(MICRO, MUTED, 'mt-2 text-center normal-case tracking-normal')}>
                Writing: any two Task 1 or Task 2 reviews equal one evaluation.
              </p>
            </div>

            <div className={cn(PANEL, 'flex flex-col p-4 sm:p-5')}>
              <PanelTitle label="Vocabulary" accent />
              <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>Bank &amp; mastery</p>

              <div className="flex flex-1 flex-col justify-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(MICRO, MUTED)}>Saved</span>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {stats.vocabulary.total} /{' '}
                      {stats.vocabulary.limit === Infinity ? '∞' : stats.vocabulary.limit}
                    </span>
                  </div>
                  <Bar
                    value={
                      stats.vocabulary.limit === Infinity
                        ? 0
                        : (stats.vocabulary.total / stats.vocabulary.limit) * 100
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(MICRO, MUTED)}>Mastered</span>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {stats.vocabulary.mastered} / {stats.vocabulary.total || 1}
                    </span>
                  </div>
                  <Bar value={(stats.vocabulary.mastered / (stats.vocabulary.total || 1)) * 100} />
                </div>

                <div
                  className={cn(TILE, 'flex items-center justify-center gap-2 p-3.5 text-center')}
                >
                  <Target className="h-4 w-4 text-[#5a63df]" />
                  <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                    {stats.vocabulary.total}
                  </span>
                  <span className={cn(MICRO, MUTED)}>total words</span>
                </div>
              </div>
            </div>

            <div className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-2')}>
              <PanelTitle label="Reading & Listening tests" accent />
              <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
                Practice and Exam starts count when you begin. Resuming a test does not use another
                one.
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  { key: 'reading', label: 'Reading', icon: FileText },
                  { key: 'listening', label: 'Listening', icon: Headphones },
                ].map(({ key, label, icon: Icon }) => {
                  const quota = stats.testStarts?.[key];
                  return (
                    <div key={key} className={cn(TILE, 'flex items-center gap-3 p-3.5')}>
                      <Icon className="h-4 w-4 shrink-0 text-[#5a63df]" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {label}
                        </h4>
                        <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>
                          {!quota || quota.limit === -1
                            ? 'Unlimited'
                            : `${Math.min(quota.used ?? 0, quota.limit)} of ${quota.limit} free tests used`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-2')}>
              <div className="flex items-center justify-between">
                <PanelTitle label="Practice tests" accent />
                <Pill tone="neutral">{totalTests} total</Pill>
              </div>
              <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>Completed history</p>

              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <Stat
                  size="sm"
                  icon={FileText}
                  tone="accent"
                  label="Reading"
                  value={stats.tests.reading}
                />
                <Stat
                  size="sm"
                  icon={Headphones}
                  tone="rose"
                  label="Listening"
                  value={stats.tests.listening}
                />
                <Stat
                  size="sm"
                  icon={PenLine}
                  tone="accent"
                  label="Writing"
                  value={stats.tests.writing}
                />
                <Stat
                  size="sm"
                  icon={Mic}
                  tone="emerald"
                  label="Speaking"
                  value={stats.tests.speaking}
                />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
