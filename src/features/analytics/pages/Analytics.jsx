import React, { useCallback, useMemo, useRef, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAnalyticsData from '@/features/analytics/hooks/useAnalyticsData';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';

// Critical path components - load immediately
import AnalyticsHeader from '../components/AnalyticsHeader';
import StatCards from '../components/StatCards';
import EmptyAnalyticsState from '../components/EmptyAnalyticsState';
import CriteriaBreakdownCard from '../components/CriteriaBreakdownCard';

// Lazy load heavy chart components for better initial load
const PerformanceTrends = React.lazy(() => import('../components/PerformanceTrends'));
const AIInsightsCard = React.lazy(() => import('../components/AIInsightsCard'));
const DeepDiveAccordion = React.lazy(() => import('../components/DeepDiveAccordion'));
const BandScoreJourney = React.lazy(() => import('../components/BandScoreJourney'));
const AnalyticsOverview = React.lazy(() => import('../components/AnalyticsOverview'));
const ErrorAudit = React.lazy(() => import('../components/ErrorAudit'));
const ErrorDrilldownModal = React.lazy(() => import('../components/ErrorDrilldownModal'));

// Constants & Utils
import { CONTAINER_VARIANTS } from '../constants';
import { getLearningPhase, getNextMilestone, clamp01 } from '../utils';

const AnalyticsSkeleton = React.memo(function AnalyticsSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6" data-oid="-qf76o:">
      <div className="h-10 w-60 bg-muted/60 rounded-2xl animate-pulse" data-oid="croyqg4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-oid="i-90m3v">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-2xl bg-muted/50 animate-pulse"
            data-oid="8fbnfx5"
          />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6" data-oid="dwju3z-">
        <div className="col-span-12 xl:col-span-8 space-y-6" data-oid="tq-fgae">
          <div className="h-[360px] rounded-2xl bg-muted/50 animate-pulse" data-oid="zkrd4:p" />
          <div className="h-[320px] rounded-2xl bg-muted/50 animate-pulse" data-oid="roag7hx" />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-6" data-oid="4t_.mi0">
          <div className="h-[240px] rounded-2xl bg-muted/50 animate-pulse" data-oid="w_ufs1y" />
          <div className="h-[260px] rounded-2xl bg-muted/50 animate-pulse" data-oid="82lg_3f" />
        </div>
      </div>
    </div>
  );
});

// Skeleton fallback for lazy-loaded chart components
const ChartSkeleton = React.memo(function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div
      className={`${height} rounded-2xl bg-muted/30 animate-pulse flex flex-col items-center justify-center relative overflow-hidden`}
      data-oid="w3:-90v"
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-shimmer"
        style={{ animationDuration: '2s' }}
      />
      <div className="w-12 h-12 rounded-full bg-muted/40 mb-4" />
      <div className="w-1/2 h-3 rounded-full bg-muted/40" />
    </div>
  );
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

  // The journey reflects completed-practice averages. Keep it distinct from the
  // headline's latest-module overall estimate so learners never see two values
  // presented as the same IELTS band.
  const practiceAverage = useMemo(() => parseFloat(stats?.avgScore), [stats?.avgScore]);
  const learningPhase = useMemo(() => getLearningPhase(practiceAverage), [practiceAverage]);
  const nextMilestone = useMemo(() => getNextMilestone(practiceAverage), [practiceAverage]);

  const radarData = useMemo(() => {
    if (!stats?.moduleStats) return [];
    const types = ['reading', 'writing', 'listening', 'speaking'];
    return types.map((t) => ({
      subject: t.charAt(0).toUpperCase() + t.slice(1),
      A: stats.moduleStats.find((m) => m.type === t)?.avg || 0,
      fullMark: 9,
    }));
  }, [stats?.moduleStats]);

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

  if (isLoading) return <AnalyticsSkeleton data-oid="cs8j4yv" />;

  // Bug fix: show a proper empty state for new users with no completed tests
  if (!stats?.totalTests) {
    return (
      <motion.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-4"
        data-oid="flrz3b6-empty"
      >
        <DocumentHead
          title="Analytics Dashboard"
          description="Review your IELTS band progress, section performance, pacing, score prediction, and completed practice results."
          noIndex
        />
        <AnalyticsHeader
          user={user}
          stats={stats}
          isPremium={isPremium}
          tier={user?.subscription_tier}
          role={user?.role}
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          data-oid="relgpvl"
        />
        <div className="pt-2 pb-8">
          <EmptyAnalyticsState
            title="No Tests Completed Yet"
            action={
              <Link to="/dashboard">
                <Button className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.03] active:scale-95 transition-all text-sm border-none">
                  Start a Practice Test
                </Button>
              </Link>
            }
          />
        </div>
      </motion.div>
    );
  }

  const progressToTarget =
    stats?.targetScore > 0 && (stats?.scoredTests || 0) > 0
      ? clamp01(Number(stats.avgScore) / Number(stats.targetScore)) * 100
      : 0;

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-4"
      data-oid="flrz3b6"
    >
      <DocumentHead
        title="Analytics Dashboard"
        description="Review your IELTS band progress, section performance, pacing, score prediction, and completed practice results."
        noIndex
      />
      <AnalyticsHeader
        user={user}
        stats={stats}
        isPremium={isPremium}
        tier={user?.subscription_tier}
        role={user?.role}
        selectedTimeframe={selectedTimeframe}
        setSelectedTimeframe={setSelectedTimeframe}
        data-oid="relgpvl"
      />

      <section data-oid="tier1-hero">
        <StatCards stats={stats} progressToTarget={progressToTarget} data-oid="b85992g" />
      </section>

      {/* ─────────────────────────────────────────────────────────────────
               TIER 2: JOURNEY & ACTION - Progress trajectory + next steps
              ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-4" data-oid="dawzv-.">
        <div className="grid grid-cols-12 gap-3 lg:gap-4" data-oid="hx1c1:y">
          <div className="col-span-12 xl:col-span-8" data-oid="bri_zk1">
            <Suspense
              fallback={<ChartSkeleton height="h-48" data-oid="v8_ca1h" />}
              data-oid=":n4io18"
            >
              <BandScoreJourney
                currentScore={practiceAverage}
                targetScore={stats?.targetScore}
                testHistory={chartData?.history || []}
                testDate={user?.test_date}
                moduleStats={stats?.moduleStats || []}
                data-oid="2pu74s7"
              />
            </Suspense>
          </div>
          <div className="col-span-12 xl:col-span-4" data-oid="j2axk1i">
            <Suspense
              fallback={<ChartSkeleton height="h-64" data-oid="qn0gog1" />}
              data-oid="5u8.rrb"
            >
              <AIInsightsCard
                stats={stats}
                aiLoading={aiLoading}
                isPremium={isPremium}
                learningPhase={learningPhase}
                nextMilestone={nextMilestone}
                compact
                data-oid="vi_s3k9"
              />
            </Suspense>
          </div>
        </div>
      </section>

      <Suspense fallback={<ChartSkeleton height="h-[620px]" />}>
        <AnalyticsOverview stats={stats} chartData={chartData} user={user} />
      </Suspense>

      {/* ─────────────────────────────────────────────────────────────────
               TIER 3: DEEP DIVE - Advanced analytics for power users
              ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-4" data-oid="_ue32ts">
        <div className="flex items-end justify-between gap-4 px-1 pt-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Advanced Analysis
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Explore module trends, question-format evidence, sections, and scoring criteria.
            </p>
          </div>
        </div>
        <Suspense fallback={<ChartSkeleton height="h-96" data-oid="9otx:wk" />} data-oid="_ud6929">
          <PerformanceTrends
            stats={stats}
            radarData={radarData}
            chartData={chartData}
            isPremium={isPremium}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
            onTabKeyDown={onTabKeyDown}
            tabsRef={tabsRef}
            user={user}
            data-oid="3tacdky"
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton height="h-64" data-oid="_tvih-2" />} data-oid="m5cdktw">
          <DeepDiveAccordion isPremium={isPremium} data-oid="1..yqpp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" data-oid="vp.v4bv">
              <div className="flex flex-col gap-4 lg:gap-6" data-oid="deep-dive-col-1">
                {/* Writing Criteria Breakdown */}
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
              </div>

              <div className="flex flex-col gap-4 lg:gap-6" data-oid="deep-dive-col-2">
                <Suspense
                  fallback={<ChartSkeleton height="h-48" data-oid="b-k18m7" />}
                  data-oid="b0qcfii"
                >
                  <ErrorAudit
                    data={stats.enhancedMetrics?.errorAuditData}
                    sessionReferences={stats.enhancedMetrics?.sessionReferences}
                    onDrilldown={(cat, data) => setDrilldown({ isOpen: true, category: cat, data })}
                    data-oid="uf2j79."
                  />
                </Suspense>
                {/* Speaking Criteria Breakdown */}
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
              </div>
            </div>
          </DeepDiveAccordion>
        </Suspense>
      </section>

      {/* Global Drilldown Modal */}
      <Suspense fallback={null} data-oid="rr7pq4b">
        <ErrorDrilldownModal
          isOpen={drilldown.isOpen}
          onClose={() => setDrilldown((prev) => ({ ...prev, isOpen: false }))}
          category={drilldown.category}
          data={drilldown.data}
          data-oid="hnf1olu"
        />
      </Suspense>
    </motion.div>
  );
}
