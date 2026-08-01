import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives';
import { useGrammarDashboard } from '../hooks/useGrammarDashboard';
import GrammarHeroPanel from './GrammarHeroPanel';
import GrammarLearningPathCard from './GrammarLearningPathCard';
import GrammarSkillsPanel from './GrammarSkillsPanel';
import GrammarEvidencePanel from './GrammarEvidencePanel';
import GrammarGuidesPanel from './GrammarGuidesPanel';
import GrammarPracticeKitsPanel from './GrammarPracticeKitsPanel';

const surface = PANEL;

export default function GrammarDashboard({
  dashboard,
  user,
  recommendedSkill,
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
            retestTarget={retestTarget}
            onStart={startPrimary}
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

      {/* Guided kits */}
      <div className={cn(surface, 'scroll-mt-6')}>
        <GrammarPracticeKitsPanel
          access={access}
          user={user}
          completedPracticeSkillSets={dashboard?.completedPracticeSkillSets}
          isStarting={isStarting}
          onStart={onStart}
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

      {/* Guides */}
      <div className={cn(surface, 'scroll-mt-6')}>
        <GrammarGuidesPanel
          resources={dashboard?.resources}
          resourcesUnavailable={dashboard?.resourcesUnavailable}
          user={user}
          completedGuideSlugs={dashboard?.completedGuideSlugs}
          recommendedSkill={recommended}
        />
      </div>
    </div>
  );
}
