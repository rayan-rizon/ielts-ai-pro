import { skillLabel } from '../constants';

// ---------------------------------------------------------------------------
// Pure title/description derivation — no branching in the component body
// ---------------------------------------------------------------------------
function derivePrimaryTitle({ inProgressAttempt, primaryMode, shouldDiagnose, recommended }) {
  if (inProgressAttempt) return `Continue your ${String(inProgressAttempt.mode).toLowerCase()}`;
  if (primaryMode === 'review') return 'Review what needs another look';
  if (primaryMode === 'retest') return 'Check your progress in a real IELTS response';
  if (shouldDiagnose) return 'Build your six-skill baseline';
  return `Strengthen ${String(recommended?.label || skillLabel(recommended?.skillCode)).toLowerCase()}`;
}

function derivePrimaryDescription({ inProgressAttempt, primaryMode, shouldDiagnose, recommended }) {
  if (inProgressAttempt) {
    return `${inProgressAttempt.totalQuestions} IELTS-focused questions are already saved in this attempt. Pick up where you stopped without using another allowance.`;
  }
  if (primaryMode === 'retest')
    return 'Your next scored Writing or Speaking response will update Grammar evidence and refresh your AI Learning Path automatically.';
  if (shouldDiagnose)
    return 'Answer 24 short questions across six grammar skills. Each one uses a realistic Writing or Speaking sentence.';
  return `Practise one useful pattern from ${recommended?.observations || 0} saved observations, then apply it in Writing or Speaking.`;
}

function deriveActivePathStage(mode) {
  if (mode === 'retest') return 'retest';
  if (mode === 'diagnostic') return 'diagnose';
  return 'practice';
}

function derivePathStatus(activePathStage, inProgressAttempt) {
  if (activePathStage === 'diagnose') return 'Now: build your six-skill baseline';
  if (activePathStage === 'retest') return 'Now: take one scored test to measure progress';
  if (inProgressAttempt) return 'Now: finish your active practice set';
  return 'Now: repair one useful grammar pattern';
}

// ---------------------------------------------------------------------------
// useGrammarDashboard — centralises all derived state and action handlers,
// reducing GrammarDashboard's cyclomatic complexity (was cc=51).
// ---------------------------------------------------------------------------
export function useGrammarDashboard({
  dashboard,
  recommendedSkill,
  criterionDiagnosticNeeded,
  defaultMode,
  defaultSkill,
  onStart,
  onRetest,
  onResume,
}) {
  const access = dashboard?.access || {};
  const skills = dashboard?.skills || [];
  const criterionEvidence = dashboard?.criterionEvidence || [];
  const recommended = skills.find((s) => s.skillCode === defaultSkill) || recommendedSkill;

  const inProgressAttempt = (dashboard?.recentAttempts || []).find(
    (a) => a.completionState === 'in_progress' && a.mode !== 'transfer'
  );

  const latestCriterionAt = Math.max(
    0,
    ...criterionEvidence.map((signal) => new Date(signal.lastPracticedAt || 0).getTime() || 0)
  );
  const repairsSinceLastTest = (dashboard?.recentAttempts || []).filter((attempt) => {
    const completedAt = new Date(attempt.completedAt || 0).getTime() || 0;
    return (
      attempt.completionState === 'completed' &&
      ['practice', 'review'].includes(attempt.mode) &&
      completedAt > latestCriterionAt
    );
  }).length;
  const retestTarget =
    [...criterionEvidence]
      .filter((signal) => Number(signal.observations || 0) > 0)
      .sort((a, b) => Number(a.mastery || 0) - Number(b.mastery || 0))[0]?.source || 'writing';

  const shouldDiagnose =
    defaultMode === 'diagnostic' ||
    criterionDiagnosticNeeded ||
    !skills.some((s) => s.observations > 0);

  const primaryMode =
    defaultMode ||
    (shouldDiagnose ? 'diagnostic' : repairsSinceLastTest >= 2 ? 'retest' : 'practice');

  const dailyLimitReached =
    !access.isPaid &&
    Number(access.dailyRemaining || 0) <= 0 &&
    ['practice', 'review'].includes(primaryMode);

  const primaryTitle = derivePrimaryTitle({
    inProgressAttempt,
    primaryMode,
    shouldDiagnose,
    recommended,
  });
  const primaryDescription = derivePrimaryDescription({
    inProgressAttempt,
    primaryMode,
    shouldDiagnose,
    recommended,
  });

  const effectiveMode = inProgressAttempt?.mode || primaryMode;
  const activePathStage = deriveActivePathStage(effectiveMode);
  const pathStatus = derivePathStatus(activePathStage, inProgressAttempt);

  const startPrimary = () => {
    if (inProgressAttempt) {
      onResume(inProgressAttempt.id);
      return;
    }
    if (primaryMode === 'retest') {
      onRetest(retestTarget);
      return;
    }
    onStart({
      mode: primaryMode,
      targetSkills:
        primaryMode === 'diagnostic' || !recommended?.skillCode ? null : [recommended.skillCode],
      questionCount: primaryMode === 'diagnostic' ? 24 : 5,
    });
  };

  // The hero's "N reviews due" chip and the skills panel both start the same
  // mixed review set, so the action lives here rather than being re-derived.
  const startReview = () => onStart({ mode: 'review', targetSkills: null, questionCount: 5 });

  const dueSkillLabels = skills
    .filter((skill) => skill.isDue)
    .map((skill) => skill.label || skillLabel(skill.skillCode));

  const startPathStage = (stage) => {
    if (stage === 'retest') {
      onRetest(retestTarget);
      return;
    }
    const resumeMatches =
      (stage === 'diagnose' && inProgressAttempt?.mode === 'diagnostic') ||
      (stage === 'practice' && ['practice', 'review'].includes(inProgressAttempt?.mode));
    if (resumeMatches) {
      onResume(inProgressAttempt.id);
      return;
    }
    if (inProgressAttempt) return;
    onStart({
      mode: stage === 'diagnose' ? 'diagnostic' : 'practice',
      targetSkills:
        stage === 'diagnose' || !recommended?.skillCode ? null : [recommended.skillCode],
      questionCount: stage === 'diagnose' ? 24 : 5,
    });
  };

  return {
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
    repairsSinceLastTest,
    startPrimary,
    startPathStage,
    startReview,
    dueSkillLabels,
  };
}
