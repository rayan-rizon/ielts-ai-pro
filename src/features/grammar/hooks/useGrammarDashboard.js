import { skillLabel } from '../constants';

// ---------------------------------------------------------------------------
// Pure title/description derivation — no branching in the component body
// ---------------------------------------------------------------------------
function derivePrimaryTitle({ inProgressAttempt, primaryMode, shouldDiagnose, recommended }) {
  if (inProgressAttempt) return `Continue your ${String(inProgressAttempt.mode).toLowerCase()}`;
  if (primaryMode === 'review') return 'Review the questions you missed';
  if (primaryMode === 'retest') return 'Test your progress in a real IELTS response';
  if (shouldDiagnose) return 'Find out where to start';
  return `Strengthen ${String(recommended?.label || skillLabel(recommended?.skillCode)).toLowerCase()}`;
}

function derivePrimaryDescription({ inProgressAttempt, primaryMode, shouldDiagnose }) {
  if (inProgressAttempt) {
    return `${inProgressAttempt.totalQuestions} questions are waiting in this set. Pick up where you stopped; it does not use another free question.`;
  }
  if (primaryMode === 'retest')
    return 'You have practised enough to check it for real. Take one scored Writing or Speaking test; your Grammar results and Learning Path update automatically.';
  if (shouldDiagnose)
    return 'Answer 24 short questions (about 10 minutes). Nothing is held against you; your answers show which grammar skill to practise first.';
  return 'Answer five short questions on this skill, then use it in your next Writing or Speaking answer.';
}

function deriveActivePathStage(mode) {
  if (mode === 'retest') return 'retest';
  if (mode === 'diagnostic') return 'diagnose';
  return 'practice';
}

function derivePathStatus(activePathStage, inProgressAttempt) {
  if (activePathStage === 'diagnose') return 'Now: find your starting point';
  if (activePathStage === 'retest') return 'Now: take one scored test to see your progress';
  if (inProgressAttempt) return 'Now: finish your practice set';
  return 'Now: practise one grammar skill';
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
