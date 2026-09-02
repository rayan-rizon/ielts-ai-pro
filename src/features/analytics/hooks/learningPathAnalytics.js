const MODULE_PREFIXES = new Set([
  'reading',
  'writing',
  'listening',
  'speaking',
  'grammar',
  'vocabulary',
]);

const CONFIDENCE_LABELS = {
  high: 'Reliable scores',
  moderate: 'Some scores',
  developing: 'Some scores',
  diagnostic: 'Needs more results',
  low: 'Needs more results',
};

const arrayOrEmpty = (value) => (Array.isArray(value) ? value : []);
const countOrZero = (value) => {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
};

function humanizeSkillCode(skillCode) {
  const parts = String(skillCode ?? '')
    .split('_')
    .filter(Boolean);
  const labelParts = parts.length > 1 && MODULE_PREFIXES.has(parts[0]) ? parts.slice(1) : parts;
  return labelParts
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function normalizeEvidenceItem(item, fallbackClass) {
  const source = item ?? {};
  const evidenceClass = source.evidence_class ?? fallbackClass;
  const observations = countOrZero(source.observations);
  const correctCount = countOrZero(source.correct_count);
  const measured = evidenceClass === 'measured_priority';
  const observationLabel = observations === 1 ? 'answer' : 'answers';

  return {
    module: humanizeSkillCode(source.skill_code) || 'IELTS fundamentals',
    strategy: evidenceStrategy({ measured, correctCount, observations, observationLabel }),
    evidenceClass,
    observations,
    skillCode: source.skill_code ?? null,
    skillModule: source.module ?? null,
    mastery: validMastery(source.mastery),
  };
}

const evidenceStrategy = ({ measured, correctCount, observations, observationLabel }) =>
  measured
    ? `${correctCount} correct across ${observations} graded answers.`
    : `${observations} graded ${observationLabel}; keep measuring before treating this as a recurring weakness.`;

const validMastery = (value) => {
  const mastery = Number(value);
  return Number.isFinite(mastery) ? mastery : null;
};

const normalizeEvidenceList = (items, fallbackClass) =>
  arrayOrEmpty(items).map((item) => normalizeEvidenceItem(item, fallbackClass));

function coachOverview(coachSummary) {
  if (typeof coachSummary === 'string') return coachSummary;
  if (!coachSummary || typeof coachSummary !== 'object') return null;
  return [coachSummary.headline, coachSummary.explanation].filter(Boolean).join(' ');
}

const findLatestTransfer = (attempts) =>
  arrayOrEmpty(attempts).find(
    (attempt) => attempt?.mode === 'transfer' && attempt?.transfer_outcome
  );

const buildCriterionSignals = (signals) =>
  arrayOrEmpty(signals).map((item) => ({
    source: item?.skill_code === 'speaking_grammar' ? 'Speaking' : 'Writing',
    observations: countOrZero(item?.observations),
    evidenceClass: item?.evidence_class ?? 'diagnostic',
    provenance: item?.provenance ?? null,
  }));

function buildGrammarSummary(path, measuredPriorities, earlySignals) {
  const grammarEvidence = path?.grammar_evidence ?? {};
  const latestTransfer = findLatestTransfer(grammarEvidence.recent_attempts);
  return {
    measuredPriorities: measuredPriorities.filter((item) => item.skillModule === 'grammar'),
    earlySignals: earlySignals.filter((item) => item.skillModule === 'grammar'),
    criterionSignals: buildCriterionSignals(grammarEvidence.criterion_signals),
    dueReviews: arrayOrEmpty(grammarEvidence.due_reviews).length,
    latestTransferOutcome: latestTransfer?.transfer_outcome ?? null,
  };
}

const buildCounts = (evidence, earlySignals) => ({
  measured: countOrZero(evidence?.counts?.measured),
  early: countOrZero(evidence?.counts?.early) || earlySignals.length,
  diagnostic: countOrZero(evidence?.counts?.diagnostic),
});

const buildAiSuggestions = (path, recommendedFocusAreas) => ({
  learning_path_overview:
    coachOverview(path.coach_summary) ??
    'Complete scored practice so your plan can confirm which skills need attention.',
  recommended_focus_areas: recommendedFocusAreas,
});

export function buildLearningPathAnalytics(path) {
  const evidence = path?.evidence_summary;
  if (!evidence || typeof evidence !== 'object') return null;

  const measuredPriorities = normalizeEvidenceList(
    evidence.measured_priorities,
    'measured_priority'
  );
  const earlySource = evidence.early_signals ?? evidence.unmeasured_priorities;
  const earlySignals = normalizeEvidenceList(earlySource, 'early_signal');
  const recommendedFocusAreas = [...measuredPriorities, ...earlySignals].slice(0, 3);

  return {
    fingerprint: path.input_fingerprint ?? null,
    confidenceLabel: CONFIDENCE_LABELS[evidence.confidence_label] ?? 'Needs more results',
    counts: buildCounts(evidence, earlySignals),
    measuredPriorities,
    earlySignals,
    grammar: buildGrammarSummary(path, measuredPriorities, earlySignals),
    aiSuggestions: buildAiSuggestions(path, recommendedFocusAreas),
  };
}
