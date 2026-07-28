function humanizeSkillCode(skillCode) {
  const parts = String(skillCode || '')
    .split('_')
    .filter(Boolean);
  const withoutModule =
    parts.length > 1 &&
    ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'].includes(parts[0])
      ? parts.slice(1)
      : parts;

  return withoutModule
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function normalizeEvidenceItem(item, fallbackClass) {
  const observations = Math.max(0, Number(item?.observations) || 0);
  const correctCount = Math.max(0, Number(item?.correct_count) || 0);
  const evidenceClass = item?.evidence_class || fallbackClass;
  const label = humanizeSkillCode(item?.skill_code) || 'IELTS fundamentals';
  const isMeasured = evidenceClass === 'measured_priority';

  return {
    module: label,
    strategy: isMeasured
      ? `${correctCount} correct across ${observations} graded answers.`
      : `${observations} graded answer${observations === 1 ? '' : 's'}; keep measuring before treating this as a recurring weakness.`,
    evidenceClass,
    observations,
    skillCode: item?.skill_code || null,
    skillModule: item?.module || null,
    mastery: Number.isFinite(Number(item?.mastery)) ? Number(item.mastery) : null,
  };
}

function coachOverview(coachSummary) {
  if (typeof coachSummary === 'string') return coachSummary;
  if (!coachSummary || typeof coachSummary !== 'object') return null;
  return [coachSummary.headline, coachSummary.explanation].filter(Boolean).join(' ');
}

export function buildLearningPathAnalytics(path) {
  const evidence = path?.evidence_summary;
  if (!evidence || typeof evidence !== 'object') return null;

  const measuredPriorities = (evidence.measured_priorities || []).map((item) =>
    normalizeEvidenceItem(item, 'measured_priority')
  );
  const earlySignals = (evidence.early_signals || evidence.unmeasured_priorities || []).map(
    (item) => normalizeEvidenceItem(item, 'early_signal')
  );
  const recommendedFocusAreas = [...measuredPriorities, ...earlySignals].slice(0, 3);
  const latestTransfer = (path?.grammar_evidence?.recent_attempts || []).find(
    (attempt) => attempt?.mode === 'transfer' && attempt?.transfer_outcome
  );
  const grammarDueReviews = path?.grammar_evidence?.due_reviews || [];

  return {
    fingerprint: path.input_fingerprint || null,
    confidenceLabel: evidence.confidence_label || 'diagnostic',
    counts: {
      measured: Number(evidence.counts?.measured) || 0,
      early: Number(evidence.counts?.early) || earlySignals.length,
      diagnostic: Number(evidence.counts?.diagnostic) || 0,
    },
    measuredPriorities,
    earlySignals,
    grammar: {
      measuredPriorities: measuredPriorities.filter((item) => item.skillModule === 'grammar'),
      earlySignals: earlySignals.filter((item) => item.skillModule === 'grammar'),
      criterionSignals: (path?.grammar_evidence?.criterion_signals || []).map((item) => ({
        source: item?.skill_code === 'speaking_grammar' ? 'Speaking' : 'Writing',
        observations: Math.max(0, Number(item?.observations) || 0),
        evidenceClass: item?.evidence_class || 'diagnostic',
        provenance: item?.provenance || null,
      })),
      dueReviews: grammarDueReviews.length,
      latestTransferOutcome: latestTransfer?.transfer_outcome || null,
    },
    aiSuggestions: {
      learning_path_overview:
        coachOverview(path.coach_summary) ||
        'Complete scored practice so your plan can distinguish measured priorities from early signals.',
      recommended_focus_areas: recommendedFocusAreas,
    },
  };
}
