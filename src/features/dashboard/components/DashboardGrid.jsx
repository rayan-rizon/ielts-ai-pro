import React from 'react';
import { m } from 'framer-motion';

import HeroCard from './HeroCard';
import ModuleCards from './ModuleCards';
import WeeklyMomentumChart from './WeeklyMomentumChart';
import SkillMapCard from './SkillMapCard';
import PerformanceSummaryCard from './PerformanceSummaryCard';
import WeakestLinkCard from './WeakestLinkCard';
import CambridgeTestsCard from './CambridgeTestsCard';
import OnboardingCard from './OnboardingCard';
import EngagementWidget from './EngagementWidget';
import StudyResourcesHub from './StudyResourcesHub';
import AILearningPathCard from '@/components/dashboard/AILearningPathCard';

// Optimized animation variants - use CSS transitions where possible
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }, // Snappier duration
};

export default function DashboardGrid({
  user,
  recentTests,
  weeklyProgress,
  aiFocus,
  aiProgress,
  aiFocusLoading,
  radarData,
  stats,
  cambridgeTests,
  weakestSkill,
  studyResources,
  resourcesLoading,
  recommended,
  progressToTarget,
  showOnboarding,
  onboardingSteps,
  dismissOnboarding,
  onboardingHighlight,
  quickLaunchRef,
  moduleCards,
}) {
  return (
    <div className="grid grid-cols-12 gap-5 lg:gap-6 auto-rows-max" data-oid=":xn8rdp">
      {/* Row 1: Hero & Focus */}
      <div className="col-span-12 lg:col-span-8" data-oid="0rq3.ic">
        <m.div variants={itemVariants} data-oid="rcbo.47">
          <HeroCard
            recommended={recommended}
            progressToTarget={progressToTarget}
            stats={stats}
            data-oid="z.fqqs5"
          />
        </m.div>
      </div>

      <div className="col-span-12 lg:col-span-4" data-oid="u34ydy_">
        <div className="h-full" data-oid="rjpzhj8">
          <AILearningPathCard
            focus={aiFocus}
            progress={aiProgress}
            isLoading={aiFocusLoading}
            data-oid="j0q_txy"
          />
        </div>
      </div>

      {/* Row 2: Momentum & Skill Map */}
      <div className="col-span-12 md:col-span-7 lg:col-span-8" data-oid="mz2acx:">
        <m.div variants={itemVariants} className="h-full" data-oid="mjbybw-">
          <WeeklyMomentumChart weeklyProgress={weeklyProgress} data-oid="321tcy3" />
        </m.div>
      </div>

      <div className="col-span-12 md:col-span-5 lg:col-span-4" data-oid="-c825t3">
        <m.div variants={itemVariants} className="h-full" data-oid="vxyymb5">
          <SkillMapCard radarData={radarData} totalTests={stats.totalTests} data-oid="i50m33k" />
        </m.div>
      </div>

      {/* Row 3: Module Launchpad, Performance & Milestones */}
      <div className="col-span-12 lg:col-span-5 flex flex-col h-full" data-oid="ns_cfji">
        <ModuleCards
          moduleCards={moduleCards}
          stats={stats}
          quickLaunchRef={quickLaunchRef}
          onboardingHighlight={onboardingHighlight}
          data-oid="csb:2u-"
        />
      </div>

      <div
        className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col h-full"
        data-oid="w93bdf-"
      >
        <m.div variants={itemVariants} className="flex-1 flex flex-col h-full" data-oid="-kckdv0">
          <PerformanceSummaryCard recentTests={recentTests} stats={stats} data-oid="943hwgk" />
        </m.div>
      </div>

      <div
        className="col-span-12 md:col-span-6 lg:col-span-3 flex flex-col h-full"
        data-oid="jrz27xx"
      >
        <m.div variants={itemVariants} className="flex-1 flex flex-col h-full" data-oid=":eke800">
          <WeakestLinkCard weakestSkill={weakestSkill} data-oid="774s1u3" />
        </m.div>
      </div>

      {/* Row 4: Primary Training Section & Engagement */}
      <div className="col-span-12 lg:col-span-8 flex flex-col h-full" data-oid="l1q5hg4">
        <m.div variants={itemVariants} className="flex-1 flex flex-col h-full" data-oid="mpq:5vl">
          <CambridgeTestsCard cambridgeTests={cambridgeTests} user={user} data-oid="o_mq5hu" />
        </m.div>
      </div>

      <div className="col-span-12 lg:col-span-4 flex flex-col h-full" data-oid="e4osgw.">
        <div className="space-y-5 lg:space-y-6 flex-1 flex flex-col h-full" data-oid="6e8qz4o">
          {showOnboarding && (
            <OnboardingCard
              showOnboarding={showOnboarding}
              onboardingSteps={onboardingSteps}
              dismissOnboarding={dismissOnboarding}
              onboardingHighlight={onboardingHighlight}
              data-oid="3nv8lk7"
            />
          )}
          <m.div variants={itemVariants} className="flex-1 flex flex-col h-full" data-oid="2z:3akc">
            <EngagementWidget dailyActivity={stats.dailyActivity} data-oid="iicgew:" />
          </m.div>
        </div>
      </div>

      {/* Footer Activity - Full width secondary */}
      <div className="col-span-12" data-oid="nuweh2n">
        <m.div variants={itemVariants} className="w-full" data-oid="ax3smkt">
          <StudyResourcesHub
            initialResources={studyResources}
            isLoading={resourcesLoading}
            data-oid="mqx1sgg"
          />
        </m.div>
      </div>
    </div>
  );
}
