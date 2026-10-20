import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { buildRecommendationMap, getCourseSummary, getNextGuide } from '../data/courseProgress';
import { PANEL } from '@/features/dashboard/components/primitives';
import { useGrammarDashboard } from '../hooks/useGrammarDashboard';
import GrammarHeroPanel from './GrammarHeroPanel';
import GrammarLearningPathCard from './GrammarLearningPathCard';
import GrammarSkillsPanel from './GrammarSkillsPanel';
import GrammarEvidencePanel from './GrammarEvidencePanel';
import GrammarGuidesPanel from './GrammarGuidesPanel';

const surface = PANEL;

export default function GrammarDashboard({
  dashboard,
  user,
  recommendedSkill,
  resultRecommendations,
  criterionDiagnosticNeeded,
  defaultMode,
  defaultSkill,
  isStarting,
  isResuming,
  onStart,
  onRetest,
  onResume,
}) {
  const {
    access,
    skills,
    criterionEvidence,
    recommended,
    inProgressAttempt,
    shouldDiagnose,
    primaryMode,
    dailyLimitReached,
    primaryTitle,
    primaryDescription,
    activePathStage,
    pathStatus,
    retestTarget,
    startPrimary,
    startPathStage,
    startReview,
    dueSkillLabels,
  } = useGrammarDashboard({
    dashboard,
    recommendedSkill,
    criterionDiagnosticNeeded,
    defaultMode,
    defaultSkill,
    onStart,
    onRetest,
    onResume,
  });

  const completedGuideSlugs = useMemo(
    () => dashboard?.completedGuideSlugs ?? [],
    [dashboard?.completedGuideSlugs]
  );
  const nextGuide = useMemo(
    () =>
      getNextGuide(
        completedGuideSlugs,
        user,
        buildRecommendationMap({
          recommendations: resultRecommendations?.grammar ?? [],
          recommendedSkill: recommended,
          completedGuideSlugs,
        })
      ),
    [completedGuideSlugs, recommended, resultRecommendations?.grammar, user]
  );
  const hasStartedCourse = getCourseSummary(completedGuideSlugs).hasStarted;

  return (
    <div className="space-y-4">
      {/* Hero + Learning Path */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(350px,0.75fr)]">
        <div className={cn(surface, 'relative min-h-[248px] overflow-hidden')}>
          <GrammarHeroPanel
            primaryTitle={primaryTitle}
            primaryDescription={primaryDescription}
            primaryMode={primaryMode}
            inProgressAttempt={inProgressAttempt}
            isStarting={isStarting}
            isResuming={isResuming}
            dailyLimitReached={dailyLimitReached}
            access={access}
            dueReviews={dashboard?.dueReviews}
            dueSkillLabels={dueSkillLabels}
            retestTarget={retestTarget}
            nextGuide={nextGuide}
            hasStartedCourse={hasStartedCourse}
            onStart={startPrimary}
            onStartReview={startReview}
          />
        </div>
        <GrammarLearningPathCard
          activePathStage={activePathStage}
          pathStatus={pathStatus}
          retestTarget={retestTarget}
          isStarting={isStarting}
          isResuming={isResuming}
          inProgressAttempt={inProgressAttempt}
          access={access}
          dailyLimitReached={dailyLimitReached}
          onStartPathStage={startPathStage}
        />
      </section>

      {/* Course: lessons grouped by part, with progress and a clear next step */}
      <div className={cn(surface, 'scroll-mt-6')}>
        <GrammarGuidesPanel
          guideProgressUnavailable={dashboard?.guideProgressUnavailable}
          user={user}
          access={access}
          isStarting={isStarting}
          onStart={onStart}
          completedGuideSlugs={completedGuideSlugs}
          recommendedSkill={recommended}
          recommendations={resultRecommendations?.grammar}
          resultEvidenceCount={resultRecommendations?.evidence?.resultCount}
        />
      </div>

      {/* Skills + Evidence */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(330px,0.6fr)]">
        <div className={cn(surface, 'scroll-mt-6')}>
          <GrammarSkillsPanel
            skills={skills}
            recommended={recommended}
            shouldDiagnose={shouldDiagnose}
            access={access}
            isStarting={isStarting}
            dueReviews={dashboard?.dueReviews}
            onStart={onStart}
          />
        </div>
        <div className={cn(surface, 'scroll-mt-6 overflow-hidden')}>
          <GrammarEvidencePanel
            criterionEvidence={criterionEvidence}
            access={access}
            inProgressAttempt={inProgressAttempt}
            isStarting={isStarting || isResuming}
            onStartDiagnostic={() =>
              onStart({ mode: 'diagnostic', targetSkills: null, questionCount: 24 })
            }
            onResume={onResume}
          />
        </div>
      </section>
    </div>
  );
}
