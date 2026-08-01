import React from 'react';
import { m } from 'framer-motion';

import StatBand from './StatBand';
import ModuleMeters from './ModuleMeters';
import BandTrajectoryChart from './BandTrajectoryChart';
import NextUpPanel from './NextUpPanel';
import SkillMasteryPanel from './SkillMasteryPanel';
import WeeklyMomentumChart from './WeeklyMomentumChart';
import OverallBandPanel from './OverallBandPanel';
import SessionLog from './SessionLog';
import EngagementWidget from './EngagementWidget';
import CambridgeTestsCard from './CambridgeTestsCard';
import StudyResourcesHub from './StudyResourcesHub';
import OnboardingCard from './OnboardingCard';
import { FADE_UP } from './primitives';

/**
 * Reading order is priority order, densest first:
 *   1. Five headline numbers
 *   2. Where you stand (module bands) · whether it's moving (trajectory) · what
 *      to do next (queue)
 *   3. Why it isn't moving (question types) · how much work went in (volume) ·
 *      the number on the certificate (overall band)
 *   4. What you already did (attempt log, practice history)
 *   5. Material to work through, then the reference library
 *
 * Row 2 answers "am I improving?" before row 3 answers "at what?" — a student
 * who can't see movement won't care which question type is weak.
 */
export default function DashboardGrid({
  user,
  recentTests,
  weeklyProgress,
  aiFocus,
  stats,
  cambridgeTests,
  weakestSkill,
  skillProficiency,
  studyResources,
  resourcesLoading,
  recommended,
  showOnboarding,
  onboardingSteps,
  dismissOnboarding,
  onboardingHighlight,
  quickLaunchRef,
}) {
  return (
    <div className="space-y-3">
      {showOnboarding && (
        <m.div variants={FADE_UP}>
          <OnboardingCard
            showOnboarding={showOnboarding}
            onboardingSteps={onboardingSteps}
            dismissOnboarding={dismissOnboarding}
            onboardingHighlight={onboardingHighlight}
          />
        </m.div>
      )}

      <m.div variants={FADE_UP}>
        <StatBand stats={stats} weeklyProgress={weeklyProgress} user={user} />
      </m.div>

      <div className="grid grid-cols-12 gap-3">
        {/* Standing · movement · next action */}
        <m.div variants={FADE_UP} className="col-span-12 lg:col-span-5">
          <ModuleMeters
            stats={stats}
            recentTests={recentTests}
            quickLaunchRef={quickLaunchRef}
            onboardingHighlight={onboardingHighlight}
          />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12 md:col-span-7 lg:col-span-4">
          <BandTrajectoryChart recentTests={recentTests} stats={stats} />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12 md:col-span-5 lg:col-span-3">
          <NextUpPanel
            recommended={recommended}
            stats={stats}
            weakestSkill={weakestSkill}
            aiFocus={aiFocus}
            user={user}
          />
        </m.div>

        {/* Diagnosis · effort · the ten-minute lever */}
        <m.div variants={FADE_UP} className="col-span-12 lg:col-span-5">
          <SkillMasteryPanel skillProficiency={skillProficiency} />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12 md:col-span-7 lg:col-span-4">
          <WeeklyMomentumChart weeklyProgress={weeklyProgress} />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12 md:col-span-5 lg:col-span-3">
          <OverallBandPanel stats={stats} />
        </m.div>

        {/* What already happened. The heat grid is only twelve columns wide by
            nature, so it keeps the narrow slot and the log takes the wide one. */}
        <m.div variants={FADE_UP} className="col-span-12 lg:col-span-8">
          <SessionLog recentTests={recentTests} />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12 lg:col-span-4">
          <EngagementWidget dailyActivity={stats.dailyActivity} />
        </m.div>

        {/* Material */}
        <m.div variants={FADE_UP} className="col-span-12">
          <CambridgeTestsCard cambridgeTests={cambridgeTests} user={user} />
        </m.div>

        <m.div variants={FADE_UP} className="col-span-12">
          <StudyResourcesHub initialResources={studyResources} isLoading={resourcesLoading} />
        </m.div>
      </div>
    </div>
  );
}
