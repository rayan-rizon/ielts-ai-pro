import React, { Suspense, useState } from 'react';
import { m } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { CONTAINER_VARIANTS } from '../constants';
import { PANEL } from '@/features/dashboard/components/primitives';
import AnalyticsHeader from './AnalyticsHeader';
import StatCards from './StatCards';
import CriteriaBreakdownCard from './CriteriaBreakdownCard';
import ModuleRankingCard from './ModuleRankingCard';
import QuestionSuccessCard from './QuestionSuccessCard';
import SectionBreakdownCard from './SectionBreakdownCard';
import RecentPracticeHistory from './RecentPracticeHistory';
import PaidFeatureGate from '@/features/subscription/components/PaidFeatureGate';

const AIInsightsCard = React.lazy(() => import('./AIInsightsCard'));
const BandScoreJourney = React.lazy(() => import('./BandScoreJourney'));
const ErrorAudit = React.lazy(() => import('./ErrorAudit'));
const ErrorDrilldownModal = React.lazy(() => import('./ErrorDrilldownModal'));
const ExamReadinessCard = React.lazy(() => import('./ExamReadinessCard'));

const ChartSkeleton = React.memo(function ChartSkeleton({ className = 'h-full min-h-[340px]' }) {
  return <div className={cn(PANEL, className, 'w-full animate-pulse')} />;
});

/**
 * Reading order is priority order, densest first — the same three-column
 * rhythm the learner dashboard uses (5 / 4 / 3), so the two pages feel like
 * one product rather than two.
 *
 *   1. Where you stand — the band, the gap, the effort behind it
 *   2. Movement · standing per module · am-I-ready verdict
 *   3. Diagnosis: which formats leak marks · why answers go wrong · what next
 *   4. Detail: examiner criteria · where inside a test it goes wrong
 *   5. What you already did
 *
 * The five numbered "step" headings with explanatory paragraphs that used to
 * separate these rows are gone. They cost roughly a screen of height to say
 * what position and panel titles already say, and every panel below them
 * carries its own title, tooltip and footnote.
 */
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
        className="relative z-10 mx-auto max-w-[1600px] space-y-3"
      >
        <AnalyticsHeader {...headerProps} />

        <StatCards stats={stats} progressToTarget={progressToTarget} />

        <div className="grid grid-cols-12 gap-3">
          {/* Movement · standing · verdict */}
          <div className="col-span-12 xl:col-span-5">
            <Suspense fallback={<ChartSkeleton />}>
              <BandScoreJourney
                targetScore={stats?.targetScore}
                moduleHistory={chartData?.moduleHistory || {}}
                overallProgress={chartData?.overallProgress || {}}
              />
            </Suspense>
          </div>

          <div className="col-span-12 md:col-span-7 xl:col-span-4">
            <ModuleRankingCard
              moduleStats={stats?.moduleStats || []}
              targetScore={stats?.targetScore}
            />
          </div>

          <div className="col-span-12 md:col-span-5 xl:col-span-3">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Exam readiness"
              title="Know when your evidence is exam-ready"
              description="Combine coverage, consistency, target gap, and recent form into one readiness check."
              benefits={['Four evidence signals', 'Clear gaps before test day']}
            >
              <Suspense fallback={<ChartSkeleton />}>
                <ExamReadinessCard
                  readiness={stats?.readiness}
                  targetScore={stats?.targetScore}
                  modulesWithData={stats?.modulesWithData}
                />
              </Suspense>
            </PaidFeatureGate>
          </div>

          {/* Diagnosis: what leaks marks, why, and what to do about it */}
          <div className="col-span-12 xl:col-span-5">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Question types"
              title="Find the formats costing you marks"
              description="Rank every practised IELTS question type by lost marks, accuracy, and evidence volume."
              benefits={['Weakest formats ranked first', 'Filtered to the selected period']}
            >
              <QuestionSuccessCard stats={stats} />
            </PaidFeatureGate>
          </div>

          <div className="col-span-12 md:col-span-7 xl:col-span-4">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Answer analysis"
              title="Trace why each mark was lost"
              description="Separate knowledge, timing, and behaviour patterns, then open the exact affected questions."
              benefits={['Error-pattern diagnosis', 'Exact-question drill-down']}
            >
              <Suspense fallback={<ChartSkeleton />}>
                <ErrorAudit
                  data={stats?.enhancedMetrics?.errorAuditData}
                  sessionReferences={stats?.enhancedMetrics?.sessionReferences}
                  behaviour={stats?.enhancedMetrics?.behaviour}
                  totalMistakes={stats?.enhancedMetrics?.distinctMistakes}
                  onDrilldown={(category, data) => setDrilldown({ isOpen: true, category, data })}
                />
              </Suspense>
            </PaidFeatureGate>
          </div>

          <div className="col-span-12 md:col-span-5 xl:col-span-3">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Practise next"
              title="Turn evidence into a focused plan"
              description="Get a ranked next step using your measured weaknesses and current learning-path evidence."
              benefits={['Personalised focus areas', 'Refreshed after scored tests']}
            >
              <Suspense fallback={<ChartSkeleton />}>
                <AIInsightsCard stats={stats} aiLoading={aiLoading} />
              </Suspense>
            </PaidFeatureGate>
          </div>

          {/* Detail: how it is marked, and where inside a test it goes wrong */}
          <div className="col-span-12 lg:col-span-6">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Examiner criteria"
              title="Track the criteria behind your band"
              description="Compare Writing and Speaking criteria over time instead of relying on one overall score."
              benefits={['Criterion-level averages', 'Writing and Speaking views']}
            >
              <CriteriaBreakdownCard
                writingCriteria={stats?.writingCriteria}
                speakingCriteria={stats?.speakingCriteria}
              />
            </PaidFeatureGate>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <PaidFeatureGate
              hasAccess={isPremium}
              label="Accuracy by position"
              title="See where performance drops inside a test"
              description="Compare passages and parts in sitting order to expose late-test accuracy and pacing problems."
              benefits={['Position-by-position accuracy', 'Timing-efficiency context']}
            >
              <SectionBreakdownCard
                sectionPerformance={stats?.sectionPerformance || []}
                efficiency={stats?.efficiency}
                coverage={stats?.evidenceCoverage}
              />
            </PaidFeatureGate>
          </div>

          {/* What already happened */}
          <div className="col-span-12">
            <RecentPracticeHistory sessions={chartData?.recentPractice || []} user={user} />
          </div>
        </div>

        {isPremium ? (
          <Suspense fallback={null}>
            <ErrorDrilldownModal
              isOpen={drilldown.isOpen}
              onClose={() => setDrilldown((previous) => ({ ...previous, isOpen: false }))}
              category={drilldown.category}
              data={drilldown.data}
            />
          </Suspense>
        ) : null}
      </m.div>
    </TooltipProvider>
  );
}
