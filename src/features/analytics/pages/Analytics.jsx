import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateStudyRecommendations } from '@/utils/api';
import useAnalyticsData from '@/features/analytics/hooks/useAnalyticsData';
import { Button } from '@/components/ui/button';
import { getFromCache, setInCache, CACHE_TTL } from '@/lib/apiCache';

// Critical path components - load immediately
import AnalyticsHeader from '../components/AnalyticsHeader';
import StatCards from '../components/StatCards';
import PerformanceNarrative from '../components/PerformanceNarrative';
import EmptyAnalyticsState from '../components/EmptyAnalyticsState';

// Lazy load heavy chart components for better initial load
const PerformanceTrends = React.lazy(() => import('../components/PerformanceTrends'));
const AIInsightsCard = React.lazy(() => import('../components/AIInsightsCard'));
const DeepDiveAccordion = React.lazy(() => import('../components/DeepDiveAccordion'));
const BandScoreJourney = React.lazy(() => import('../components/BandScoreJourney'));
const TimeManagementQuadrant = React.lazy(() => import('../components/TimeManagementQuadrant'));
const EfficiencyMatrix = React.lazy(() => import('../components/EfficiencyMatrix'));
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

  const { user, isLoading, stats: hookStats, chartData } = useAnalyticsData(selectedTimeframe);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Merge hook stats with AI suggestions
  const stats = useMemo(() => {
    if (!hookStats) return hookStats;
    return {
      ...hookStats,
      insights: {
        ...hookStats.insights,
        aiSuggestions: aiSuggestions || hookStats.insights?.aiSuggestions,
      },
    };
  }, [hookStats, aiSuggestions]);

  const isPremium = useMemo(() => {
    const tier = (user?.subscription_tier || '').toLowerCase();
    return tier === 'pro' || tier === 'premium' || user?.role === 'admin';
  }, [user?.subscription_tier, user?.role]);

  const learningPhase = useMemo(() => getLearningPhase(stats?.avgScore), [stats?.avgScore]);
  const nextMilestone = useMemo(() => getNextMilestone(stats?.avgScore), [stats?.avgScore]);

  const radarData = useMemo(() => {
    if (!stats?.moduleStats) return [];
    const types = ['reading', 'writing', 'listening', 'speaking'];
    return types.map((t) => ({
      subject: t.charAt(0).toUpperCase() + t.slice(1),
      A: stats.moduleStats.find((m) => m.type === t)?.avg || 0,
      fullMark: 9,
    }));
  }, [stats?.moduleStats]);

  useEffect(() => {
    if (isLoading || !user?.id || !isPremium || aiSuggestions) return;

    let cancelled = false;

    // Check cache first (24-hour TTL)
    const cacheKey = `ai_suggestions_${user.id}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      setAiSuggestions(cached);
      return;
    }

    setAiLoading(true);

    // Edge Function derives user identity from JWT token automatically
    generateStudyRecommendations()
      .then((suggestions) => {
        if (!cancelled) {
          setAiSuggestions(suggestions);
          // Cache for 24 hours to reduce API costs
          setInCache(cacheKey, suggestions, CACHE_TTL.VERY_LONG);
        }
      })
      .catch((e) => {
        // Only log in production or for non-network errors
        const isNetworkError = e?.isNetworkError || e?.message?.includes('Failed to fetch');
        if (!isNetworkError || import.meta.env.PROD) {
          console.warn('AI Recommendations failed:', e);
        }
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, user?.id, isPremium, aiSuggestions]);

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
        <AnalyticsHeader
          isPremium={isPremium}
          tier={user?.subscription_tier}
          role={user?.role}
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          data-oid="relgpvl"
        />
        <div className="h-[60vh] flex items-center justify-center">
          <EmptyAnalyticsState
            icon={BookOpen}
            title="No Tests Completed Yet"
            description="Complete your first practice test to unlock your personalized analytics dashboard with score trends, performance insights, and AI recommendations."
            action={
              <Link to="/dashboard">
                <Button className="rounded-full font-black bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform">
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
    stats?.targetScore > 0 ? clamp01(Number(stats.avgScore) / Number(stats.targetScore)) * 100 : 0;

  // Bug fix: derive studyPace from absolute hours studied, not the trend percentage
  const studyPace =
    (stats?.studyHours || 0) > 20
      ? 'intensive'
      : (stats?.studyHours || 0) > 10
        ? 'moderate'
        : 'casual';

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="p-3 md:p-4 max-w-[1600px] mx-auto space-y-4"
      data-oid="flrz3b6"
    >
      <AnalyticsHeader
        isPremium={isPremium}
        tier={user?.subscription_tier}
        role={user?.role}
        selectedTimeframe={selectedTimeframe}
        setSelectedTimeframe={setSelectedTimeframe}
        data-oid="relgpvl"
      />

      {/* ─────────────────────────────────────────────────────────────────
               TIER 1: HERO SUMMARY - Answer "How am I doing?" in < 3 seconds
              ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-4" data-oid="7p-7cv0">
        <PerformanceNarrative insights={stats?.insights} stats={stats} data-oid="m5ew116" />
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
                currentScore={stats?.avgScore}
                targetScore={stats?.targetScore}
                testHistory={chartData?.history || []}
                testDate={user?.test_date}
                studyPace={studyPace}
                forecastData={chartData?.forecast}
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

      {/* ─────────────────────────────────────────────────────────────────
               TIER 3: DEEP DIVE - Advanced analytics for power users
              ───────────────────────────────────────────────────────────────── */}
      <section className="space-y-4" data-oid="_ue32ts">
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
            data-oid="3tacdky"
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton height="h-64" data-oid="_tvih-2" />} data-oid="m5cdktw">
          <DeepDiveAccordion isPremium={isPremium} data-oid="1..yqpp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6" data-oid="vp.v4bv">
              {/* Left Column */}
              <div className="flex flex-col gap-4 lg:gap-6" data-oid="deep-dive-col-1">
                <Suspense
                  fallback={<ChartSkeleton height="h-48" data-oid="7ajl8ag" />}
                  data-oid="26.wiby"
                >
                  <TimeManagementQuadrant
                    questionTypeData={stats?.typeAccuracy || []}
                    data-oid="kdm:-vo"
                  />
                </Suspense>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4 lg:gap-6" data-oid="deep-dive-col-2">
                <Suspense
                  fallback={<ChartSkeleton height="h-48" data-oid="j8tq7qf" />}
                  data-oid="wyu9ns0"
                >
                  <EfficiencyMatrix
                    paceData={stats.enhancedMetrics?.paceData}
                    onDrilldown={(cat, data) => setDrilldown({ isOpen: true, category: cat, data })}
                    data-oid="aaptn37"
                  />
                </Suspense>
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
