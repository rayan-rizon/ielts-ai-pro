import React, { Suspense, useCallback, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { CONTAINER_VARIANTS } from '../constants';
import { MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';
import AnalyticsHeader from './AnalyticsHeader';
import StatCards from './StatCards';
import CriteriaBreakdownCard from './CriteriaBreakdownCard';

const PerformanceTrends = React.lazy(() => import('./PerformanceTrends'));
const AIInsightsCard = React.lazy(() => import('./AIInsightsCard'));
const BandScoreJourney = React.lazy(() => import('./BandScoreJourney'));
const AnalyticsOverview = React.lazy(() => import('./AnalyticsOverview'));
const ErrorDrilldownModal = React.lazy(() => import('./ErrorDrilldownModal'));
const ExamReadinessCard = React.lazy(() => import('./ExamReadinessCard'));
const SkillMasteryPanel = React.lazy(
  () => import('@/features/dashboard/components/SkillMasteryPanel')
);

const TABS = ['overview', 'reading', 'writing', 'listening', 'speaking'];

const ChartSkeleton = React.memo(function ChartSkeleton({ height = 'h-64' }) {
  return <div className={cn(PANEL, height, 'w-full animate-pulse')} />;
});

function SectionHeading({ step, title, description }) {
  return (
    <div className="flex items-start gap-2.5 px-0.5 pt-1">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#5a63df] font-mono text-[10px] font-bold tabular-nums text-white">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className={cn(TITLE, 'text-sm')}>{title}</h2>
        <p className={cn('mt-0.5 text-[11px] font-medium', MUTED)}>{description}</p>
      </div>
    </div>
  );
}

function StandingSection({ stats, progressToTarget }) {
  return (
    <section className="space-y-2.5">
      <SectionHeading
        step="1"
        title="Where you stand"
        description="Your current band, and the distance left to your target."
      />
      <StatCards stats={stats} progressToTarget={progressToTarget} />
    </section>
  );
}

function ImprovementSection({ stats, chartData, aiLoading, isPremium }) {
  return (
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
            <AIInsightsCard stats={stats} aiLoading={aiLoading} isPremium={isPremium} compact />
          </Suspense>
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-3">
          <Suspense fallback={<ChartSkeleton height="h-[380px]" />}>
            <ExamReadinessCard
              readiness={stats?.readiness}
              targetScore={stats?.targetScore}
              modulesWithData={stats?.modulesWithData}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function PrioritySection({ stats, chartData, user }) {
  return (
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
  );
}

function MarkingDetailSection({ stats }) {
  return (
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
            taskAchievement: 'Task Response / Achievement',
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
  );
}

function useAnalyticsTabs() {
  const [activeTab, setActiveTab] = useState('overview');
  const tabsRef = useRef(null);
  const onTabKeyDown = useCallback(
    (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = TABS.indexOf(activeTab);
      const nextIndex = getNextTabIndex(event.key, currentIndex);
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab);
      tabsRef.current?.querySelector?.(`[data-tab="${nextTab}"]`)?.focus?.();
    },
    [activeTab]
  );
  return { activeTab, setActiveTab, tabsRef, onTabKeyDown };
}

const getNextTabIndex = (key, currentIndex) => {
  if (key === 'Home') return 0;
  if (key === 'End') return TABS.length - 1;
  if (key === 'ArrowLeft') return (currentIndex - 1 + TABS.length) % TABS.length;
  return (currentIndex + 1) % TABS.length;
};

function FullDetailSection({ stats, chartData, isPremium, user, onDrilldown }) {
  const tabs = useAnalyticsTabs();
  return (
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
          activeTab={tabs.activeTab}
          setActiveTab={tabs.setActiveTab}
          tabs={TABS}
          onTabKeyDown={tabs.onTabKeyDown}
          tabsRef={tabs.tabsRef}
          user={user}
          onDrilldown={onDrilldown}
        />
      </Suspense>
    </section>
  );
}

export default function AnalyticsReport({
  headerProps,
  stats,
  chartData,
  user,
  isPremium,
  aiLoading,
  progressToTarget,
}) {
  const [drilldown, setDrilldown] = useState({ isOpen: false, category: null, data: [] });
  return (
    <TooltipProvider delayDuration={150}>
      <m.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1600px] space-y-5"
      >
        <AnalyticsHeader {...headerProps} />
        <StandingSection stats={stats} progressToTarget={progressToTarget} />
        <ImprovementSection
          stats={stats}
          chartData={chartData}
          aiLoading={aiLoading}
          isPremium={isPremium}
        />
        <PrioritySection stats={stats} chartData={chartData} user={user} />
        <MarkingDetailSection stats={stats} />
        <FullDetailSection
          stats={stats}
          chartData={chartData}
          isPremium={isPremium}
          user={user}
          onDrilldown={(category, data) => setDrilldown({ isOpen: true, category, data })}
        />
        <Suspense fallback={null}>
          <ErrorDrilldownModal
            isOpen={drilldown.isOpen}
            onClose={() => setDrilldown((previous) => ({ ...previous, isOpen: false }))}
            category={drilldown.category}
            data={drilldown.data}
          />
        </Suspense>
      </m.div>
    </TooltipProvider>
  );
}
