import { skillLabel } from '../constants';

// ---------------------------------------------------------------------------
// Pure title/description derivation — no branching in the component body
// ---------------------------------------------------------------------------
function derivePrimaryTitle({ inProgressAttempt, primaryMode, shouldDiagnose, recommended }) {
  if (inProgressAttempt) return `Continue your ${String(inProgressAttempt.mode).toLowerCase()}`;
  if (primaryMode === 'review') return 'Review what needs another look';
  if (primaryMode === 'transfer') return 'Apply grammar in IELTS production';
  if (shouldDiagnose) return 'Build your six-skill baseline';
  return `Strengthen ${String(recommended?.label || skillLabel(recommended?.skillCode)).toLowerCase()}`;
}

function derivePrimaryDescription({ inProgressAttempt, primaryMode, shouldDiagnose, recommended }) {
  if (inProgressAttempt) {
    return `${inProgressAttempt.totalQuestions} IELTS-focused questions are already saved in this attempt. Pick up where you stopped without using another allowance.`;
  }
  if (primaryMode === 'transfer')
    return 'Use a short Academic Writing paragraph or an existing Speaking transcript.';
  if (shouldDiagnose)
    return 'Answer 24 short questions across six grammar skills. Each one uses a realistic Writing or Speaking sentence.';
  return `Practise one useful pattern from ${recommended?.observations || 0} saved observations, then apply it in Writing or Speaking.`;
}

function deriveActivePathStage(mode) {
  if (mode === 'transfer') return 'apply';
  if (mode === 'diagnostic') return 'diagnose';
  return 'practice';
}

function derivePathStatus(activePathStage, inProgressAttempt) {
  if (activePathStage === 'diagnose') return 'Now: build your six-skill baseline';
  if (activePathStage === 'apply') return 'Now: apply the target in IELTS';
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
  onResume,
}) {
  const access = dashboard?.access || {};
  const skills = dashboard?.skills || [];
  const criterionEvidence = dashboard?.criterionEvidence || [];
  const recommended = skills.find((s) => s.skillCode === defaultSkill) || recommendedSkill;

  const inProgressAttempt = (dashboard?.recentAttempts || []).find(
    (a) => a.completionState === 'in_progress' && a.mode !== 'transfer'
  );

  const shouldDiagnose =
    defaultMode === 'diagnostic' ||
    criterionDiagnosticNeeded ||
    !skills.some((s) => s.observations > 0);

  const primaryMode = defaultMode || (shouldDiagnose ? 'diagnostic' : 'practice');

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
    onStart({
      mode: primaryMode,
      targetSkills:
        primaryMode === 'diagnostic' || !recommended?.skillCode ? null : [recommended.skillCode],
      questionCount: primaryMode === 'diagnostic' ? 24 : 5,
    });
  };

  const startPathStage = (stage) => {
    if (stage === 'apply') {
      onStart({
        mode: 'transfer',
        targetSkills: recommended?.skillCode ? [recommended.skillCode] : null,
      });
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
    startPrimary,
    startPathStage,
  };
}
