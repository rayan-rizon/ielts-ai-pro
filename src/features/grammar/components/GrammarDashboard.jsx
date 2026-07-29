import { cn } from '@/lib/cn';
import { useGrammarDashboard } from '../hooks/useGrammarDashboard';
import GrammarHeroPanel from './GrammarHeroPanel';
import GrammarLearningPathCard from './GrammarLearningPathCard';
import GrammarSkillsPanel from './GrammarSkillsPanel';
import GrammarEvidencePanel from './GrammarEvidencePanel';
import GrammarGuidesPanel from './GrammarGuidesPanel';
import GrammarPracticeKitsPanel from './GrammarPracticeKitsPanel';

const surface =
  'rounded-[22px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] dark:border-white/10 dark:bg-[#10131f]';

export default function GrammarDashboard({
  dashboard,
  recommendedSkill,
  criterionDiagnosticNeeded,
  defaultMode,
  defaultSkill,
  isStarting,
  isResuming,
  onStart,
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
    startPrimary,
    startPathStage,
  } = useGrammarDashboard({
    dashboard,
    recommendedSkill,
    criterionDiagnosticNeeded,
    defaultMode,
    defaultSkill,
    onStart,
    onResume,
  });

  return (
    <div className="space-y-4">
      {/* Hero + Learning Path */}
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(350px,0.75fr)]">
        <div className={cn(surface, 'relative min-h-[248px] overflow-hidden bg-[#f4f1fb]')}>
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
            onStart={startPrimary}
          />
        </div>
        <GrammarLearningPathCard
          activePathStage={activePathStage}
          pathStatus={pathStatus}
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
        <GrammarPracticeKitsPanel access={access} isStarting={isStarting} onStart={onStart} />
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
        />
      </div>
    </div>
  );
}
