import React, { useCallback, useMemo, useRef, useState, Suspense } from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAnalyticsData from '@/features/analytics/hooks/useAnalyticsData';
import DocumentHead from '@/components/shared/DocumentHead';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

// Critical path components - load immediately
import AnalyticsHeader from '../components/AnalyticsHeader';
import StatCards from '../components/StatCards';
import EmptyAnalyticsState from '../components/EmptyAnalyticsState';
import CriteriaBreakdownCard from '../components/CriteriaBreakdownCard';

// Lazy load heavy chart components for better initial load
const PerformanceTrends = React.lazy(() => import('../components/PerformanceTrends'));
const AIInsightsCard = React.lazy(() => import('../components/AIInsightsCard'));
const BandScoreJourney = React.lazy(() => import('../components/BandScoreJourney'));
const AnalyticsOverview = React.lazy(() => import('../components/AnalyticsOverview'));
const ErrorDrilldownModal = React.lazy(() => import('../components/ErrorDrilldownModal'));
const ExamReadinessCard = React.lazy(() => import('../components/ExamReadinessCard'));
const SkillMasteryPanel = React.lazy(
  () => import('@/features/dashboard/components/SkillMasteryPanel')
);

// Constants & Utils
import { CONTAINER_VARIANTS } from '../constants';
import { clamp01 } from '../utils';
import { MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';

const PAGE_SHELL =
  'relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#0b0a10] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5';

function PageBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-[0.12] dark:opacity-[0.16]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />
    </>
  );
}

/**
 * Numbered section heading.
 *
 * The page is ordered as the four questions a learner actually arrives with —
 * where do I stand, am I improving, what should I fix, where am I losing marks.
 * Numbering them makes that reading order explicit rather than implied by
 * card position, which is what the previous flat wall of panels relied on.
 */
function SectionHeading({ step, title, description }) {
  return (
    <div className="flex items-start gap-2.5 px-0.5 pt-1">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#5a63df] font-mono text-[10px] font-bold tabular-nums text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className={cn(TITLE, 'text-sm')}>{title}</h2>
        {description ? (
          <p className={cn('mt-0.5 text-[11px] font-medium', MUTED)}>{description}</p>
        ) : null}
      </div>
    </div>
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn(PANEL, 'h-[132px]')} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[380px] xl:col-span-5')} />
          <div className={cn(PANEL, 'col-span-12 h-[380px] md:col-span-6 xl:col-span-4')} />
          <div className={cn(PANEL, 'col-span-12 h-[380px] md:col-span-6 xl:col-span-3')} />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className={cn(PANEL, 'col-span-12 h-[300px] lg:col-span-7')} />
          <div className={cn(PANEL, 'col-span-12 h-[300px] lg:col-span-5')} />
          <div className={cn(PANEL, 'col-span-12 h-[260px] lg:col-span-6')} />
          <div className={cn(PANEL, 'col-span-12 h-[260px] lg:col-span-6')} />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(PANEL, 'h-[280px]')} />
          ))}
        </div>
      </div>
    </div>
  );
});

// Skeleton fallback for lazy-loaded chart components
const ChartSkeleton = React.memo(function ChartSkeleton({ height = 'h-64' }) {
  return <div className={cn(PANEL, height, 'w-full animate-pulse')} />;
});

export default function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [drilldown, setDrilldown] = useState({ isOpen: false, category: null, data: [] });
  const tabsRef = useRef(null);

  const {
    user,
    isLoading,
    stats,
    chartData,
    learningPathLoading: aiLoading,
  } = useAnalyticsData(selectedTimeframe);

  const isPremium = useMemo(() => {
    const tier = (user?.subscription_tier || '').toLowerCase();
    return tier === 'pro' || tier === 'premium' || user?.role === 'admin';
  }, [user?.subscription_tier, user?.role]);

  const tabs = useMemo(() => ['overview', 'reading', 'writing', 'listening', 'speaking'], []);

  const onTabKeyDown = useCallback(
    (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')
        return;
      e.preventDefault();
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? tabs.length - 1
            : e.key === 'ArrowLeft'
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;
      const nextTab = tabs[nextIndex];
      setActiveTab(nextTab);
      const btn = tabsRef.current?.querySelector?.(`[data-tab="${nextTab}"]`);
      btn?.focus?.();
    },
    [activeTab, tabs]
  );

  if (isLoading) return <AnalyticsSkeleton />;

  const headerProps = {
    user,
    stats,
    isPremium,
    tier: user?.subscription_tier,
    role: user?.role,
    selectedTimeframe,
    setSelectedTimeframe,
  };

  // New users with no completed tests get an honest empty state, not zeroed charts.
  if (!stats?.totalTests) {
    return (
      <div className={PAGE_SHELL}>
        <PageBackdrop />
        <m.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-[1600px] space-y-4"
        >
          <DocumentHead
            title="Analytics Dashboard"
            description="Review your IELTS band progress, section performance, pacing, and completed practice results."
            noIndex
          />
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

  const progressToTarget =
    stats?.targetScore > 0 && (stats?.scoredTests || 0) > 0
      ? clamp01(Number(stats.avgScore) / Number(stats.targetScore)) * 100
      : 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={PAGE_SHELL}>
        <PageBackdrop />
        <m.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-[1600px] space-y-5"
        >
          <DocumentHead
            title="Analytics Dashboard"
            description="Review your IELTS band progress, section performance, pacing, and completed practice results."
            noIndex
          />

          <AnalyticsHeader {...headerProps} />

          {/* 1 — Standing: the band score and how far it is from the goal. */}
          <section className="space-y-2.5">
            <SectionHeading
              step="1"
              title="Where you stand"
              description="Your current band, and the distance left to your target."
            />
            <StatCards stats={stats} progressToTarget={progressToTarget} />
          </section>

          {/* 2 — Movement: is the number going up, what should happen next, and
              could this learner pass the exam today. */}
          <section className="space-y-2.5">
            <SectionHeading
              step="2"
              title="Are you improving?"
              description="Scored results over time, a suggested next step, and an exam-readiness check."
            />
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 xl:col-span-5">
                <Suspense fallback={<ChartSkeleton height="h-[380px]" />}>
                  <BandScoreJourney
                    targetScore={stats?.targetScore}
                    moduleHistory={chartData?.moduleHistory || {}}
                    overallProgress={chartData?.overallProgress || {}}
                  />
                </Suspense>
              </div>
              <div className="col-span-12 md:col-span-6 xl:col-span-4">
                <Suspense fallback={<ChartSkeleton height="h-[380px]" />}>
                  <AIInsightsCard
                    stats={stats}
                    aiLoading={aiLoading}
                    isPremium={isPremium}
                    compact
                  />
                </Suspense>
              </div>
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                <Suspense fallback={<ChartSkeleton height="h-[380px]" />}>
                  <ExamReadinessCard readiness={stats?.readiness} />
                </Suspense>
              </div>
            </div>
          </section>

          {/* 3 — Priority: which module to practise, and whether pacing is a problem. */}
          <section className="space-y-2.5">
            <SectionHeading
              step="3"
              title="What to work on next"
              description="Modules ranked weakest first, plus how your timing compares to the exam limit."
            />
            <Suspense fallback={<ChartSkeleton height="h-[320px]" />}>
              <AnalyticsOverview stats={stats} chartData={chartData} user={user} />
            </Suspense>
          </section>

          {/* 4 — Marking detail: the criteria examiners score you on, plus the
              question-type mastery ledger the adaptive engine keeps but no
              other page on the site surfaced in full. */}
          <section className="space-y-2.5">
            <SectionHeading
              step="4"
              title="Where you lose marks"
              description="The four areas an examiner scores in Writing and Speaking, plus every tracked question type."
            />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <CriteriaBreakdownCard
                module="writing"
                criteria={stats?.writingCriteria}
                labels={{
                  taskAchievement: 'Task Achievement',
                  coherence: 'Coherence & Cohesion',
                  lexicalResource: 'Lexical Resource',
                  grammar: 'Grammatical Range',
                }}
              />
              <CriteriaBreakdownCard
                module="speaking"
                criteria={stats?.speakingCriteria}
                labels={{
                  fluency: 'Fluency & Coherence',
                  lexicalResource: 'Lexical Resource',
                  grammar: 'Grammatical Range',
                  pronunciation: 'Pronunciation',
                }}
              />
              <Suspense fallback={<ChartSkeleton height="h-72" />}>
                <SkillMasteryPanel skillProficiency={stats?.skillProficiency} />
              </Suspense>
            </div>
          </section>

          {/* 5 — Reference: everything else, deliberately last. */}
          <section className="space-y-2.5">
            <SectionHeading
              step="5"
              title="Full detail"
              description="Module trends, question types, and your completed practice history."
            />
            <Suspense fallback={<ChartSkeleton height="h-96" />}>
              <PerformanceTrends
                stats={stats}
                chartData={chartData}
                isPremium={isPremium}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                onTabKeyDown={onTabKeyDown}
                tabsRef={tabsRef}
                user={user}
                onDrilldown={(cat, data) => setDrilldown({ isOpen: true, category: cat, data })}
              />
            </Suspense>
          </section>

          {/* Global Drilldown Modal */}
          <Suspense fallback={null}>
            <ErrorDrilldownModal
              isOpen={drilldown.isOpen}
              onClose={() => setDrilldown((prev) => ({ ...prev, isOpen: false }))}
              category={drilldown.category}
              data={drilldown.data}
            />
          </Suspense>
        </m.div>
      </div>
    </TooltipProvider>
  );
}
