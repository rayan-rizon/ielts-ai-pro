import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import useAnalyticsData from '@/features/analytics/hooks/useAnalyticsData';
import DocumentHead from '@/components/shared/DocumentHead';
import { cn } from '@/lib/cn';
import { CONTAINER_VARIANTS } from '../constants';
import { clamp01 } from '../utils';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';
import AnalyticsHeader from '../components/AnalyticsHeader';
import AnalyticsReport from '../components/AnalyticsReport';
import EmptyAnalyticsState from '../components/EmptyAnalyticsState';

const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5';

function PageBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />
    </>
  );
}

const AnalyticsSkeleton = React.memo(function AnalyticsSkeleton() {
  return (
    <div className={PAGE_SHELL}>
      <PageBackdrop />
      <div className="relative z-10 mx-auto max-w-[1600px] animate-pulse space-y-4">
        <div className="space-y-2 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07]">
          <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[132px] lg:col-span-5')} />
          <div className="col-span-12 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={cn(PANEL, 'h-[132px]')} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[380px] xl:col-span-5')} />
          <div className={cn(PANEL, 'col-span-12 h-[380px] md:col-span-6 xl:col-span-4')} />
          <div className={cn(PANEL, 'col-span-12 h-[380px] md:col-span-6 xl:col-span-3')} />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={cn(PANEL, 'h-[280px]')} />
          ))}
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

function EmptyAnalytics({ headerProps }) {
  return (
    <div className={PAGE_SHELL}>
      <PageBackdrop />
      <m.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1600px] space-y-4"
      >
        <AnalyticsHeader {...headerProps} />
        <div className="pt-2 pb-8">
          <EmptyAnalyticsState
            title="No Tests Completed Yet"
            action={
              <Link to="/dashboard">
                <button
                  type="button"
                  className="h-10 rounded-lg bg-[#5a63df] px-6 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-95"
                >
                  Start a Practice Test
                </button>
              </Link>
            }
          />
        </div>
      </m.div>
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
  const isPremium = useMemo(() => {
    const tier = (data.user?.subscription_tier || '').toLowerCase();
    return tier === 'pro' || tier === 'premium' || data.user?.role === 'admin';
  }, [data.user?.subscription_tier, data.user?.role]);

  if (data.isLoading) return <AnalyticsSkeleton />;
  if (data.hasError) return <AnalyticsError retry={() => data.retry?.()} />;

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
      {!data.stats?.totalTests ? (
        <EmptyAnalytics headerProps={headerProps} />
      ) : (
        <div className={PAGE_SHELL}>
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
        </div>
      )}
    </>
  );
}
