import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import useAnalyticsData from '@/features/analytics/hooks/useAnalyticsData';
import DocumentHead from '@/components/shared/DocumentHead';
import { cn } from '@/lib/cn';
import { clamp01 } from '../utils';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';
import AnalyticsReport from '../components/AnalyticsReport';
import EmptyAnalyticsView from '../components/EmptyAnalyticsView';

const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5';

function PageBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
    />
  );
}

const AnalyticsSkeleton = React.memo(function AnalyticsSkeleton() {
  return (
    <div className={PAGE_SHELL}>
      <PageBackdrop />
      <div className="relative z-10 mx-auto max-w-[1600px] animate-pulse space-y-3">
        <div className="flex items-end justify-between gap-3 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-7 w-40 rounded-lg bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="h-9 w-[260px] rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-12 items-start gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[148px] lg:col-span-5')} />
          <div className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={cn(PANEL, 'h-[76px]')} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[360px] xl:col-span-5')} />
          <div className={cn(PANEL, 'col-span-12 h-[360px] md:col-span-7 xl:col-span-4')} />
          <div className={cn(PANEL, 'col-span-12 h-[360px] md:col-span-5 xl:col-span-3')} />
          <div className={cn(PANEL, 'col-span-12 h-[340px] xl:col-span-5')} />
          <div className={cn(PANEL, 'col-span-12 h-[340px] md:col-span-7 xl:col-span-4')} />
          <div className={cn(PANEL, 'col-span-12 h-[340px] md:col-span-5 xl:col-span-3')} />
          <div className={cn(PANEL, 'col-span-12 h-[300px] lg:col-span-6')} />
          <div className={cn(PANEL, 'col-span-12 h-[300px] lg:col-span-6')} />
          <div className={cn(PANEL, 'col-span-12 h-[200px]')} />
        </div>
      </div>
    </div>
  );
});

function AnalyticsError({ retry }) {
  return (
    <div className={PAGE_SHELL}>
      <PageBackdrop />
      <div className="relative z-10 mx-auto grid min-h-[70vh] max-w-[1600px] place-items-center">
        <section className={cn(PANEL, 'w-full max-w-lg p-6 text-center')}>
          <AlertTriangle className="mx-auto h-6 w-6 text-rose-600 dark:text-rose-300" />
          <h1 className="mt-3 text-lg font-extrabold">Analytics data could not be loaded</h1>
          <p className={cn('mt-1 text-sm', MUTED)}>
            Your saved results are unchanged. Retry before relying on this report.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 h-9 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white hover:bg-[#4a52c9]"
          >
            Retry analytics
          </button>
        </section>
      </div>
    </div>
  );
}

const getProgressToTarget = (stats) => {
  const score =
    stats?.overallEstimate != null && stats?.modulesWithData === 4
      ? Number(stats.overallEstimate)
      : Number(stats?.avgScore);
  if (!(stats?.targetScore > 0) || !(stats?.measuredTests > 0)) return 0;
  return clamp01(score / Number(stats.targetScore)) * 100;
};

export default function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const data = useAnalyticsData(selectedTimeframe);
  const isPremium = data.hasAdvancedAccess;

  useEffect(() => {
    if (!isPremium && (selectedTimeframe === '90d' || selectedTimeframe === 'all')) {
      setSelectedTimeframe('30d');
    }
  }, [isPremium, selectedTimeframe]);

  const headerProps = {
    user: data.user,
    stats: data.stats,
    isPremium,
    tier: data.user?.subscription_tier,
    role: data.user?.role,
    selectedTimeframe,
    setSelectedTimeframe,
  };

  return (
    <>
      <DocumentHead
        title="Analytics Dashboard"
        description="Review your IELTS band progress, section performance, pacing, and completed practice results."
        noIndex
      />
      <AnimatePresence mode="wait">
        {data.isLoading ? (
          <m.div
            key="analytics-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnalyticsSkeleton />
          </m.div>
        ) : data.hasError ? (
          <m.div
            key="analytics-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnalyticsError retry={() => data.retry?.()} />
          </m.div>
        ) : !data.stats?.totalTests ? (
          <m.div
            key="analytics-empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={PAGE_SHELL}
          >
            <PageBackdrop />
            <EmptyAnalyticsView
              headerProps={headerProps}
              stats={data.stats}
              user={data.user}
              progressToTarget={getProgressToTarget(data.stats)}
            />
          </m.div>
        ) : (
          <m.div
            key="analytics-report"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={PAGE_SHELL}
          >
            <PageBackdrop />
            <AnalyticsReport
              headerProps={headerProps}
              stats={data.stats}
              chartData={data.chartData}
              user={data.user}
              isPremium={isPremium}
              aiLoading={data.learningPathLoading}
              progressToTarget={getProgressToTarget(data.stats)}
            />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
