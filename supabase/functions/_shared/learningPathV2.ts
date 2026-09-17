export const LEARNING_PATH_GENERATOR_VERSION = '2.3.0';

export const STUDY_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const IELTS_MODULES = ['reading', 'writing', 'listening', 'speaking'] as const;
export const PRACTICE_DOMAINS = ['grammar', 'vocabulary'] as const;

const CRITERION_GRAMMAR_SIGNALS = ['writing_grammar', 'speaking_grammar'] as const;
const LEGACY_DUPLICATE_GRAMMAR_SIGNALS = ['grammar_writing', 'grammar_speaking'] as const;

type StudyDay = (typeof STUDY_DAYS)[number];

export type StudyAvailability = {
  version: 1;
  timezone: string;
  days: Partial<Record<StudyDay, number>>;
};

type SkillSignal = {
  skill_code?: string;
  module?: string;
  mastery_probability?: number | null;
  confidence_level?: number | null;
  practice_count?: number | null;
  correct_count?: number | null;
  next_review_at?: string | null;
};

type VocabularyItemSignal = {
  id?: string;
  next_review_date?: string | null;
};

type VocabularyReviewSignal = {
  quality?: number | null;
  reviewed_at?: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const numberOr = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfUtcDay = (input: Date | string) => {
  const date = input instanceof Date ? input : new Date(input);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const roundBand = (value: number) => Math.round(value * 2) / 2;

const median = (values: number[]) => {
  const ordered = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[midpoint] : (ordered[midpoint - 1] + ordered[midpoint]) / 2;
};

export function studyDateKey(now: Date | string = new Date(), timezone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: validStudyTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validStudyTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
}

/** A plan covers seven calendar days, including rest days, in the learner's timezone. */
export function isLearningPlanExpired(path: any, now: Date | string = new Date()) {
  const generatedAt = new Date(path?.generated_at || '').getTime();
  if (!Number.isFinite(generatedAt)) return true;
  const timezone = path?.goal_snapshot?.study_availability?.timezone || 'UTC';
  const start = path?.schedule_start_date || studyDateKey(new Date(generatedAt), timezone);
  const end = toIsoDate(addDays(startOfUtcDay(start), 7));
  return studyDateKey(now, timezone) >= end;
}

export function normalizeStudyAvailability(
  value: unknown,
  legacyWeeklyHours = 10,
  timezone = 'UTC'
): StudyAvailability {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const rawDays =
    source.days && typeof source.days === 'object' ? (source.days as Record<string, unknown>) : {};
  const days: Partial<Record<StudyDay, number>> = {};

  STUDY_DAYS.forEach((day) => {
    const minutes = Math.round(numberOr(rawDays[day], 0));
    if (minutes >= 20) days[day] = clamp(minutes, 20, 240);
  });

  if (Object.keys(days).length === 0) {
    const total = clamp(Math.round(numberOr(legacyWeeklyHours, 10) * 60), 100, 1200);
    const perDay = clamp(Math.round(total / 5 / 5) * 5, 20, 240);
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
      days[day as StudyDay] = perDay;
    });
  }

  return {
    version: 1,
    timezone: validStudyTimezone(
      typeof source.timezone === 'string' && source.timezone.trim()
        ? source.timezone.trim()
        : timezone
    ),
    days,
  };
}

export function getWeeklyCapacity(availability: StudyAvailability) {
  return STUDY_DAYS.reduce((total, day) => total + numberOr(availability.days[day], 0), 0);
}

export function classifyEvidence(skill: SkillSignal) {
  const observations = Math.max(0, Math.round(numberOr(skill.practice_count, 0)));
  const confidence = clamp(numberOr(skill.confidence_level, 0), 0, 1);
  if (observations === 0 || confidence < 0.15) return 'diagnostic' as const;
  if (observations < 5 || confidence < 0.4) return 'early_signal' as const;
  return 'measured_priority' as const;
}

export function summarizeEvidence(skills: SkillSignal[], now: Date | string = new Date()) {
  const nowMs = new Date(now).getTime();
  const normalized = (Array.isArray(skills) ? skills : [])
    .filter(
      (skill) =>
        !LEGACY_DUPLICATE_GRAMMAR_SIGNALS.includes(
          String(skill?.skill_code || '').toLowerCase() as any
        )
    )
    .map((skill) => {
      const observations = Math.max(0, Math.round(numberOr(skill.practice_count, 0)));
      const confidence = clamp(numberOr(skill.confidence_level, 0), 0, 1);
      const mastery = clamp(numberOr(skill.mastery_probability, 0.5), 0, 1);
      const reviewMs = skill.next_review_at ? new Date(skill.next_review_at).getTime() : NaN;
      const rawModule = String(skill.module || '').toLowerCase();
      const module =
        IELTS_MODULES.includes(rawModule as any) || PRACTICE_DOMAINS.includes(rawModule as any)
          ? rawModule
          : 'unknown';
      const skillCode = String(skill.skill_code || 'general_fundamentals').toLowerCase();
      const isCriterionSignal = CRITERION_GRAMMAR_SIGNALS.includes(skillCode as any);
      return {
        skill_code: skillCode,
        module,
        mastery,
        confidence,
        observations,
        correct_count: Math.max(0, Math.round(numberOr(skill.correct_count, 0))),
        evidence_class: classifyEvidence(skill),
        signal_type: isCriterionSignal ? 'criterion' : 'granular',
        provenance: isCriterionSignal
          ? skillCode === 'writing_grammar'
            ? 'Writing grammatical range and accuracy criterion'
            : 'Speaking grammatical range and accuracy criterion · transcript-based'
          : module === 'grammar'
            ? 'Grammar Lab deterministic practice'
            : `${module} practice`,
        is_due: Number.isFinite(reviewMs) && reviewMs <= nowMs && observations > 0,
        next_review_at: skill.next_review_at || null,
      };
    });

  const criterion_signals = normalized
    .filter((skill) => skill.signal_type === 'criterion')
    .sort((a, b) => a.mastery - b.mastery || b.observations - a.observations);
  const granular = normalized.filter((skill) => skill.signal_type === 'granular');

  const measured_priorities = granular
    .filter((skill) => skill.evidence_class === 'measured_priority' && skill.mastery < 0.75)
    .sort((a, b) => a.mastery - b.mastery || b.observations - a.observations);
  const early_signals = granular
    .filter((skill) => skill.evidence_class === 'early_signal')
    .sort((a, b) => a.mastery - b.mastery);
  const diagnostics = granular.filter((skill) => skill.evidence_class === 'diagnostic');
  const due_reviews = granular
    .filter((skill) => skill.is_due)
    .sort((a, b) => a.mastery - b.mastery);
  const maintenance = granular
    .filter((skill) => skill.evidence_class === 'measured_priority' && skill.mastery >= 0.75)
    .sort((a, b) => b.mastery - a.mastery);

  const measuredCount = granular.filter(
    (skill) => skill.evidence_class === 'measured_priority'
  ).length;
  const grammarCriterion = criterion_signals.find(
    (skill) => skill.mastery < 0.75 && skill.observations > 0
  );
  const hasGranularGrammarEvidence = granular.some(
    (skill) => skill.module === 'grammar' && skill.observations > 0
  );
  const confidence_label =
    measuredCount >= 8
      ? 'high'
      : measuredCount >= 4
        ? 'moderate'
        : measuredCount
          ? 'developing'
          : 'diagnostic';

  return {
    confidence_label,
    counts: {
      measured: measuredCount,
      early: early_signals.length,
      diagnostic: diagnostics.length,
      due_reviews: due_reviews.length,
    },
    measured_priorities,
    early_signals,
    diagnostics,
    due_reviews,
    maintenance,
    criterion_signals,
    grammar_diagnostic_requested: Boolean(grammarCriterion && !hasGranularGrammarEvidence),
    grammar_diagnostic_source: grammarCriterion?.skill_code || null,
    grammar_retest_preference:
      criterion_signals[0]?.skill_code === 'speaking_grammar' ? 'speaking' : 'writing',
  };
}

export function summarizeVocabularyEvidence(
  items: VocabularyItemSignal[] = [],
  reviews: VocabularyReviewSignal[] = [],
  now: Date | string = new Date()
) {
  const nowMs = new Date(now).getTime();
  const recentCutoff = nowMs - 30 * 86400000;
  const dueCount = items.filter((item) => {
    const dueAt = item.next_review_date ? new Date(item.next_review_date).getTime() : NaN;
    return Number.isFinite(dueAt) && dueAt <= nowMs;
  }).length;
  const recentReviews = reviews.filter((review) => {
    const reviewedAt = review.reviewed_at ? new Date(review.reviewed_at).getTime() : NaN;
    return Number.isFinite(reviewedAt) && reviewedAt >= recentCutoff;
  });
  const retained = recentReviews.filter((review) => numberOr(review.quality, -1) >= 3).length;
  const retention =
    recentReviews.length > 0 ? Math.round((retained / recentReviews.length) * 100) : null;
  const reliableRetention = recentReviews.length >= 10;
  const needsSupport = dueCount >= 5 || (reliableRetention && Number(retention) < 70);

  return {
    saved_count: items.length,
    due_count: dueCount,
    reviews_30d: recentReviews.length,
    retained_30d: retained,
    retention_30d: retention,
    confidence: reliableRetention
      ? 'reliable'
      : recentReviews.length > 0
        ? 'developing'
        : 'insufficient',
    needs_support: needsSupport,
    reason:
      dueCount >= 5
        ? `${dueCount} saved words are due for spaced review.`
        : reliableRetention && Number(retention) < 70
          ? `Recent review retention is ${retention}% across ${recentReviews.length} reviews.`
          : null,
  };
}

export function isScoredLearningSession(session: any) {
  if (!session || session.is_completed === false) return false;
  if (session.score == null || session.score === '' || typeof session.score === 'boolean')
    return false;
  const score = Number(session.score);
  const module = String(session.test_type || '').toLowerCase();
  if (!IELTS_MODULES.includes(module as any) || !Number.isFinite(score) || score < 0 || score > 9)
    return false;
  if (
    ['writing', 'speaking'].includes(module) &&
    session.evaluation_status &&
    session.evaluation_status !== 'completed'
  )
    return false;
  // Exclude known early exits, but keep real zero scores and unknown durations.
  const content = session.content_data || {};
  const timeLimit = module === 'reading' ? 3600 : module === 'listening' ? 2400 : 0;
  const remaining = content.time_remaining == null ? NaN : Number(content.time_remaining);
  const elapsed =
    timeLimit && Number.isFinite(remaining) && remaining >= 0 ? timeLimit - remaining : NaN;
  const seconds = [session.actual_duration_seconds, content.timeMetrics?.totalTimeSpent, elapsed]
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0 && value <= 14400);
  return !(
    score === 0 &&
    ['reading', 'listening'].includes(module) &&
    !(Number(content.correctAnswers ?? content.correct) > 0) &&
    seconds != null &&
    seconds < 300
  );
}

export function aggregateReadiness(sessions: any[], now: Date | string = new Date()) {
  const cutoff = addDays(startOfUtcDay(now), -90).getTime();
  const recent = (Array.isArray(sessions) ? sessions : []).filter((session) => {
    const score = numberOr(session?.score, NaN);
    const completedAt = new Date(session?.completed_at || session?.created_at || 0).getTime();
    return (
      isScoredLearningSession(session) &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 9 &&
      completedAt >= cutoff &&
      completedAt <= new Date(now).getTime()
    );
  });

  const modules: Record<string, any> = {};
  IELTS_MODULES.forEach((module) => {
    const moduleSessions = recent
      .filter((session) => String(session.test_type).toLowerCase() === module)
      .sort(
        (a, b) =>
          Date.parse(b.completed_at || b.created_at) - Date.parse(a.completed_at || a.created_at)
      );
    const scores = moduleSessions
      .map((session) => numberOr(session.score, NaN))
      .filter(Number.isFinite);
    const modeCounts = moduleSessions.reduce(
      (counts, session) => {
        const rawMode = String(session.test_mode || 'practice').toLowerCase();
        const mode = ['mock', 'exam'].includes(rawMode)
          ? 'exam'
          : rawMode === 'timed'
            ? 'timed'
            : 'practice';
        counts[mode] += 1;
        return counts;
      },
      { practice: 0, timed: 0, exam: 0 }
    );
    const latestExam = moduleSessions.find((session) =>
      ['mock', 'exam'].includes(String(session.test_mode || '').toLowerCase())
    );
    const latestExamScore = latestExam ? Number(latestExam.score) : NaN;
    const count = scores.length;
    modules[module] = {
      module,
      sample_count: count,
      sufficient: count >= 2,
      median: count ? roundBand(median(scores)) : null,
      observed_range: count ? [Math.min(...scores), Math.max(...scores)] : null,
      mode_counts: modeCounts,
      latest_exam_score: Number.isFinite(latestExamScore) ? latestExamScore : null,
      confidence:
        count >= 5 ? 'high' : count >= 3 ? 'moderate' : count >= 2 ? 'developing' : 'insufficient',
    };
  });

  const missing_diagnostics = IELTS_MODULES.filter((module) => !modules[module].sufficient);
  const overall =
    missing_diagnostics.length === 0
      ? {
          available: true,
          range: [
            roundBand(
              IELTS_MODULES.reduce((sum, module) => sum + modules[module].observed_range[0], 0) / 4
            ),
            roundBand(
              IELTS_MODULES.reduce((sum, module) => sum + modules[module].observed_range[1], 0) / 4
            ),
          ],
          module_median: roundBand(
            IELTS_MODULES.reduce((sum, module) => sum + modules[module].median, 0) / 4
          ),
          confidence: IELTS_MODULES.every((module) => modules[module].sample_count >= 5)
            ? 'high'
            : 'developing',
          disclaimer:
            'Observed practice range from scored attempts in the last 90 days; not a score prediction.',
        }
      : {
          available: false,
          range: null,
          module_median: null,
          confidence: 'insufficient',
          disclaimer: `Complete recent scored tests for: ${missing_diagnostics.join(', ')}.`,
        };

  return { window_days: 90, modules, overall, missing_diagnostics };
}

export function buildRoadmap(testDate: string | null | undefined, now: Date | string = new Date()) {
  const start = startOfUtcDay(now);
  const parsedExam = testDate ? startOfUtcDay(testDate) : null;
  const hasScheduledExam = Boolean(
    parsedExam && !Number.isNaN(parsedExam.getTime()) && parsedExam.getTime() > start.getTime()
  );
  // Keep a planning horizon for task allocation when a date is missing or expired, but do not
  // surface that internal horizon as a learner's exam timeline.
  const examDate = hasScheduledExam ? parsedExam : addDays(start, 84);
  const totalDays = Math.max(1, Math.ceil((examDate.getTime() - start.getTime()) / 86400000));

  const templates = [
    {
      key: 'foundation',
      name: 'Get clear results',
      objective: 'Establish trustworthy starting scores and close essential knowledge gaps.',
      checkpoint: 'Two recent scored attempts in every IELTS module.',
    },
    {
      key: 'repair',
      name: 'Focused practice',
      objective: 'Work on confirmed focus skills with targeted practice and spaced review.',
      checkpoint: 'Estimated skill progress reaches 75%+ with at least 20 recorded answers.',
    },
    {
      key: 'integration',
      name: 'Timed integration',
      objective: 'Combine skills under realistic section timing and review error patterns.',
      checkpoint: 'Two timed modules completed within official time limits.',
    },
    {
      key: 'readiness',
      name: 'Mock & test readiness',
      objective: 'Stabilize pacing, confidence, and exam-day decisions with full mocks.',
      checkpoint: 'A recent mock range is at or above the target in all four modules.',
    },
  ];

  const activeTemplates =
    totalDays <= 7
      ? templates.slice(3)
      : totalDays <= 14
        ? templates.slice(2)
        : totalDays <= 30
          ? templates.slice(1)
          : templates;
  const weights =
    activeTemplates.length === 4
      ? [0.2, 0.4, 0.25, 0.15]
      : activeTemplates.length === 3
        ? [0.5, 0.3, 0.2]
        : activeTemplates.length === 2
          ? [0.6, 0.4]
          : [1];

  let cursor = start;
  return activeTemplates.map((phase, index) => {
    const remaining = Math.ceil((examDate.getTime() - cursor.getTime()) / 86400000);
    const phaseDays =
      index === activeTemplates.length - 1
        ? Math.max(1, remaining)
        : Math.max(1, Math.floor(totalDays * weights[index]));
    const end = index === activeTemplates.length - 1 ? examDate : addDays(cursor, phaseDays - 1);
    const item = {
      ...phase,
      ...(hasScheduledExam
        ? {
            start_date: toIsoDate(cursor),
            end_date: toIsoDate(end),
          }
        : {}),
      current: start.getTime() >= cursor.getTime() && start.getTime() <= end.getTime(),
    };
    cursor = addDays(end, 1);
    return item;
  });
}

export function getAllocation(daysUntilExam: number | null) {
  if (daysUntilExam !== null && daysUntilExam <= 14) {
    return { measured_priority: 25, due_review: 15, assessment: 45, maintenance: 15 };
  }
  if (daysUntilExam !== null && daysUntilExam <= 30) {
    return { measured_priority: 35, due_review: 20, assessment: 30, maintenance: 15 };
  }
  return { measured_priority: 45, due_review: 20, assessment: 20, maintenance: 15 };
}

/** Progress per subject: learn with feedback first, then check transfer under exam conditions. */
export function recommendAssessmentMode(
  moduleReadiness: any,
  targetBand = 7,
  daysUntilExam: number | null = null
) {
  const count = Number(moduleReadiness?.sample_count || 0);
  const medianScore = Number(moduleReadiness?.median ?? 0);
  if (count < 2)
    return {
      mode: 'practice',
      reason: 'Start in Practice Mode to build two scored results with feedback.',
    };
  if (daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= 14) {
    return {
      mode: 'exam',
      reason:
        'You have starting scores and your test is close. Try Exam Mode to check pacing without hints.',
    };
  }
  if ((count >= 3 && medianScore >= targetBand - 1) || count >= 5) {
    return {
      mode: 'exam',
      reason:
        'You have repeated scored practice. Use Exam Mode to check how those skills hold up without hints and under time limits.',
    };
  }
  return {
    mode: 'practice',
    reason:
      'Build consistency in Practice Mode, review your feedback, then try Exam Mode after more scored practice.',
  };
}

const labelSkill = (code: string) =>
  code
    .split('_')
    .slice(1)
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Core skills';

type GeneratedActivity = {
  title: string;
  module: string;
  activity_type: string;
  priority: string;
  skill_targets: string[];
  reason: string;
  success_criterion: string;
  evidence: Record<string, unknown>;
  stage_key: 'foundation' | 'repair' | 'integration' | 'readiness';
  completion_policy: 'verified';
  requested_mode: string;
  evidence_key: string;
  routing: {
    route: string;
    mode: string;
  };
};

function activityForCategory(
  category: string,
  evidence: any,
  readiness: any,
  index: number,
  targetBand = 7
): GeneratedActivity {
  const measured =
    evidence.measured_priorities[index % Math.max(1, evidence.measured_priorities.length)];
  const due = evidence.due_reviews[index % Math.max(1, evidence.due_reviews.length)];
  const early = evidence.early_signals[index % Math.max(1, evidence.early_signals.length)];
  const strongCandidates = evidence.maintenance.filter((skill: any) =>
    IELTS_MODULES.includes(skill.module)
  );
  const strong = strongCandidates[index % Math.max(1, strongCandidates.length)];
  const missingModule =
    readiness.missing_diagnostics[index % Math.max(1, readiness.missing_diagnostics.length)];

  // Empty evidence is a reason to measure, never evidence of a stronger skill.
  if (
    (category === 'measured_priority' && !measured) ||
    (category === 'due_review' && !due) ||
    (category === 'maintenance' && !strong)
  ) {
    return activityForCategory('assessment', evidence, readiness, index, targetBand);
  }

  if (category === 'measured_priority' && measured) {
    const currentAccuracy = Math.round(measured.mastery * 100);
    return {
      title: `${labelSkill(measured.skill_code)} repair`,
      module: measured.module,
      activity_type: 'targeted_drill',
      priority: 'high',
      skill_targets: [measured.skill_code],
      reason: `${currentAccuracy}% skill progress across ${measured.observations} results makes this a confirmed focus.`,
      success_criterion: ['writing', 'speaking'].includes(measured.module)
        ? `Complete a scored ${measured.module} response and review the feedback for ${labelSkill(measured.skill_code).toLowerCase()}.`
        : `Get at least ${Math.min(
            9,
            Math.max(1, Math.ceil(Math.min(90, currentAccuracy + 10) / 10))
          )} of 10 questions right.`,
      evidence: {
        class: 'measured_priority',
        observations: measured.observations,
        confidence: measured.confidence,
      },
      stage_key: 'repair',
      completion_policy: 'verified',
      requested_mode: 'practice',
      evidence_key: `skill:${measured.skill_code}`,
      routing: { route: measured.module, mode: 'practice' },
    };
  }
  if (category === 'due_review' && due) {
    return {
      title: `${labelSkill(due.skill_code)} spaced review`,
      module: due.module,
      activity_type: 'spaced_review',
      priority: 'high',
      skill_targets: [due.skill_code],
      reason: `This previously practised skill is due for recall; it is not being inferred as a new weakness.`,
      success_criterion: ['writing', 'speaking'].includes(due.module)
        ? `Complete a scored ${due.module} response and compare this criterion with your previous feedback.`
        : 'Recall the rule, re-attempt errors, and score 8/10 without notes.',
      evidence: { class: due.evidence_class, observations: due.observations, due: true },
      stage_key: 'repair',
      completion_policy: 'verified',
      requested_mode: 'review',
      evidence_key: `review:${due.skill_code}`,
      routing: { route: due.module, mode: 'review' },
    };
  }
  if (category === 'assessment') {
    const shouldDiagnoseGrammar =
      !missingModule && evidence.grammar_diagnostic_requested && index % 2 === 0;
    const rankedModules = [...IELTS_MODULES].sort(
      (a, b) =>
        Number(readiness.modules?.[a]?.median ?? 0) - Number(readiness.modules?.[b]?.median ?? 0)
    );
    const belowTarget = rankedModules.filter(
      (key) => Number(readiness.modules?.[key]?.median ?? 0) < targetBand
    );
    const assessmentModules = belowTarget.length ? belowTarget : rankedModules;
    const module = shouldDiagnoseGrammar
      ? 'grammar'
      : missingModule || assessmentModules[index % assessmentModules.length];
    return {
      title: shouldDiagnoseGrammar
        ? 'Grammar level check'
        : `${module.charAt(0).toUpperCase() + module.slice(1)} ${missingModule ? 'practice test' : 'practice checkpoint'}`,
      module,
      activity_type: shouldDiagnoseGrammar
        ? 'grammar_diagnostic'
        : missingModule
          ? 'diagnostic'
          : 'practice_assessment',
      priority: 'high',
      skill_targets: !shouldDiagnoseGrammar && early?.module === module ? [early.skill_code] : [],
      reason: shouldDiagnoseGrammar
        ? 'Writing or Speaking score evidence is general. A level check is needed before naming a specific grammar focus.'
        : missingModule
          ? `More scored ${module} test results are needed before the plan can identify reliable focus areas.`
          : 'Use Practice Mode and feedback to build consistency before trying Exam Mode.',
      success_criterion: shouldDiagnoseGrammar
        ? 'Complete all 24 questions so the six grammar families can be measured separately.'
        : missingModule
          ? 'Complete a scored attempt so the next plan can use measured evidence.'
          : 'Complete a scored attempt and review the feedback before your next attempt.',
      evidence: {
        class: shouldDiagnoseGrammar || missingModule ? 'diagnostic' : 'assessment',
        observations: shouldDiagnoseGrammar
          ? evidence.criterion_signals?.find(
              (signal: any) => signal.skill_code === evidence.grammar_diagnostic_source
            )?.observations || 0
          : early?.observations || 0,
        source: shouldDiagnoseGrammar ? evidence.grammar_diagnostic_source : null,
      },
      stage_key: shouldDiagnoseGrammar || missingModule ? 'foundation' : 'integration',
      completion_policy: 'verified',
      requested_mode: 'practice',
      evidence_key: shouldDiagnoseGrammar
        ? `grammar-diagnostic:${evidence.grammar_diagnostic_source || 'general'}`
        : missingModule
          ? `module-diagnostic:${module}`
          : `practice-check:${module}`,
      routing: {
        route: module,
        mode: shouldDiagnoseGrammar ? 'diagnostic' : 'practice',
      },
    };
  }

  const preferredMaintenanceModule = strong?.module || measured?.module;
  const module = IELTS_MODULES.includes(preferredMaintenanceModule as any)
    ? preferredMaintenanceModule
    : 'listening';
  return {
    title: `${module.charAt(0).toUpperCase() + module.slice(1)} maintenance`,
    module,
    activity_type: 'maintenance',
    priority: 'low',
    skill_targets: strong ? [strong.skill_code] : [],
    reason:
      'A short maintenance block protects stronger skills while the main effort stays focused elsewhere.',
    success_criterion: ['writing', 'speaking'].includes(module)
      ? `Complete a scored ${module} response and check that your stronger criteria stay consistent.`
      : 'Complete the set at 80%+ accuracy with steady timing.',
    evidence: {
      class: strong?.evidence_class || 'maintenance',
      observations: strong?.observations || 0,
    },
    stage_key: 'repair',
    completion_policy: 'verified',
    requested_mode: 'practice',
    evidence_key: `maintenance:${module}`,
    routing: { route: module, mode: 'practice' },
  };
}

export function buildSevenDaySchedule({
  availability,
  evidence,
  readiness,
  vocabularyEvidence = null,
  testDate,
  targetBand = 7,
  now = new Date(),
}: {
  availability: StudyAvailability;
  evidence: any;
  readiness: any;
  vocabularyEvidence?: any;
  testDate?: string | null;
  targetBand?: number;
  now?: Date | string;
}) {
  const start = startOfUtcDay(now);
  const daysUntilExam = testDate
    ? Math.ceil((startOfUtcDay(testDate).getTime() - start.getTime()) / 86400000)
    : null;
  const allocation = getAllocation(daysUntilExam);
  const weeklyCapacity = getWeeklyCapacity(availability);
  const plannedMinutes = STUDY_DAYS.reduce((total, day) => {
    const capacity = numberOr(availability.days[day], 0);
    if (capacity < 20) return total;
    const blockCount = capacity >= 80 ? 3 : capacity >= 60 ? 2 : 1;
    const primaryMinutes = clamp(
      blockCount === 1 ? capacity : Math.round((capacity * 0.55) / 5) * 5,
      20,
      60
    );
    const remaining = Math.max(0, capacity - primaryMinutes);
    const optionalMinutes =
      blockCount > 1 ? clamp(Math.floor(remaining / (blockCount - 1) / 5) * 5, 20, 60) : 0;
    return total + primaryMinutes + optionalMinutes * (blockCount - 1);
  }, 0);
  const grammarBudgetMinutes = Math.floor((plannedMinutes * 0.2) / 5) * 5;
  const allocatedMinutes: Record<string, number> = Object.fromEntries(
    Object.keys(allocation).map((category) => [category, 0])
  );
  let assignedMinutes = 0;
  let grammarMinutes = 0;
  let grammarRepairsSinceRetest = 0;

  const schedule: Record<string, any[]> = {};
  let taskCursor = 0;
  const categoryCursors: Record<string, number> = {};
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(start, offset);
    const dateKey = toIsoDate(date);
    const day = STUDY_DAYS[(date.getUTCDay() + 6) % 7];
    const capacity = numberOr(availability.days[day], 0);
    schedule[day] = [];
    if (capacity < 20) continue;

    const blockCount = capacity >= 80 ? 3 : capacity >= 60 ? 2 : 1;
    const primaryMinutes = clamp(
      blockCount === 1 ? capacity : Math.round((capacity * 0.55) / 5) * 5,
      20,
      60
    );
    const remaining = Math.max(0, capacity - primaryMinutes);
    const optionalMinutes = blockCount > 1 ? Math.floor(remaining / (blockCount - 1) / 5) * 5 : 0;

    for (let block = 0; block < blockCount; block += 1) {
      const usedToday = schedule[day].reduce(
        (total: number, task: any) => total + task.estimated_time,
        0
      );
      let minutes = Math.min(
        capacity - usedToday,
        block === 0 ? primaryMinutes : clamp(optionalMinutes, 20, 60)
      );
      if (minutes < 20) continue;
      let category = Object.keys(allocation).sort((a, b) => {
        const deficitA =
          ((allocation as Record<string, number>)[a] / 100) * (assignedMinutes + minutes) -
          allocatedMinutes[a];
        const deficitB =
          ((allocation as Record<string, number>)[b] / 100) * (assignedMinutes + minutes) -
          allocatedMinutes[b];
        return deficitB - deficitA;
      })[0];
      if (
        (category === 'measured_priority' && !evidence.measured_priorities.length) ||
        (category === 'due_review' && !evidence.due_reviews.length) ||
        (category === 'maintenance' && !evidence.maintenance.length)
      )
        category = 'assessment';
      const categoryIndex = categoryCursors[category] || 0;
      categoryCursors[category] = categoryIndex + 1;
      let base = activityForCategory(category, evidence, readiness, categoryIndex, targetBand);
      const grammarRepairsBeforeBlock = grammarRepairsSinceRetest;
      if (base.module === 'grammar' && base.activity_type === 'targeted_drill') {
        if (grammarRepairsSinceRetest >= 2) {
          const retestTarget = evidence.grammar_retest_preference || 'writing';
          base = {
            title: `${retestTarget === 'speaking' ? 'Speaking' : 'Writing'} grammar checkpoint`,
            module: retestTarget,
            activity_type: 'timed_assessment',
            priority: 'high',
            skill_targets: base.skill_targets,
            reason:
              'After the two planned Grammar Lab practice sessions, complete a scored IELTS response to check whether the skill carries into your writing or speaking.',
            success_criterion: `Complete one scored ${retestTarget === 'speaking' ? 'Speaking' : 'Writing'} test and review the updated Grammar evidence.`,
            evidence: base.evidence,
            stage_key: 'integration',
            completion_policy: 'verified',
            requested_mode: 'practice',
            evidence_key: `grammar-retest:${base.skill_targets[0] || 'general'}:${retestTarget}`,
            routing: {
              route: retestTarget,
              mode: 'practice',
            },
          };
          grammarRepairsSinceRetest = 0;
        } else {
          grammarRepairsSinceRetest += 1;
        }
      }

      if (base.module === 'grammar' && grammarMinutes + minutes > grammarBudgetMinutes) {
        grammarRepairsSinceRetest = grammarRepairsBeforeBlock;
        const fallbackModule =
          readiness.missing_diagnostics[0] ||
          IELTS_MODULES[(taskCursor + block) % IELTS_MODULES.length];
        base = {
          title: `${fallbackModule.charAt(0).toUpperCase() + fallbackModule.slice(1)} practice`,
          module: fallbackModule,
          activity_type: readiness.missing_diagnostics.includes(fallbackModule)
            ? 'diagnostic'
            : 'maintenance',
          priority: 'medium',
          skill_targets: [],
          reason:
            'Grammar is capped at 20% of weekly study time so the four IELTS modules remain the main preparation focus.',
          success_criterion: 'Complete the activity and review the evidence it produces.',
          evidence: {
            class: readiness.missing_diagnostics.includes(fallbackModule)
              ? 'diagnostic'
              : 'maintenance',
            observations: 0,
          },
          stage_key: readiness.missing_diagnostics.includes(fallbackModule)
            ? 'foundation'
            : 'repair',
          completion_policy: 'verified',
          requested_mode: readiness.missing_diagnostics.includes(fallbackModule)
            ? 'practice'
            : 'practice',
          evidence_key: readiness.missing_diagnostics.includes(fallbackModule)
            ? `module-diagnostic:${fallbackModule}`
            : `maintenance:${fallbackModule}`,
          routing: {
            route: fallbackModule,
            mode: readiness.missing_diagnostics.includes(fallbackModule)
              ? 'diagnostic'
              : 'practice',
          },
        };
      }
      if (category === 'assessment' && IELTS_MODULES.includes(base.module as any)) {
        const progression = recommendAssessmentMode(
          readiness.modules?.[base.module],
          targetBand,
          daysUntilExam
        );
        const examMinutes = (
          { reading: 60, writing: 60, listening: 40, speaking: 20 } as Record<string, number>
        )[base.module];
        if (progression.mode === 'exam' && capacity - usedToday >= examMinutes) {
          minutes = Math.max(minutes, examMinutes);
          base = {
            ...base,
            title: `${base.module.charAt(0).toUpperCase() + base.module.slice(1)} Exam Mode check`,
            activity_type: 'exam_assessment',
            stage_key:
              Number(readiness.modules?.[base.module]?.latest_exam_score ?? -1) >= targetBand
                ? 'readiness'
                : 'integration',
            requested_mode: 'exam',
            evidence_key: `exam-check:${base.module}`,
            reason: progression.reason,
            success_criterion:
              'Complete a full Exam Mode attempt within the official time limit, then review your score and feedback.',
            routing: { ...base.routing, mode: 'exam' },
          };
        } else {
          base = {
            ...base,
            reason:
              progression.mode === 'exam'
                ? `You are ready to try Exam Mode, but it needs ${examMinutes} minutes. Use Practice Mode today or add a longer study session.`
                : progression.reason,
          };
        }
      }
      const activityKeyParts = [
        'v2',
        dateKey,
        base.stage_key,
        base.module,
        base.evidence_key.replace(/[^a-z0-9:_-]/gi, '-'),
        block === 0 ? 'primary' : `optional-${block}`,
      ];
      schedule[day].push({
        ...base,
        activity_key: activityKeyParts.join(':'),
        scheduled_day: day,
        scheduled_date: dateKey,
        estimated_time: minutes,
        is_optional: block > 0,
      });
      allocatedMinutes[category] += minutes;
      assignedMinutes += minutes;
      if (base.module === 'grammar') grammarMinutes += minutes;
      taskCursor += 1;
    }
  }

  let vocabularyMinutes = 0;
  const vocabularyCapMinutes = Math.max(
    0,
    Math.min(
      Math.floor((assignedMinutes * 0.15) / 5) * 5,
      Math.floor((assignedMinutes * 0.25) / 5) * 5 - grammarMinutes
    )
  );
  if (vocabularyEvidence?.needs_support && vocabularyCapMinutes >= 20) {
    const targetDay = STUDY_DAYS.find((day) =>
      (schedule[day] || []).some(
        (task) => task.is_optional || ['maintenance', 'spaced_review'].includes(task.activity_type)
      )
    );
    if (targetDay) {
      const replaceIndex = schedule[targetDay].findIndex(
        (task) => task.is_optional || ['maintenance', 'spaced_review'].includes(task.activity_type)
      );
      const replaced = schedule[targetDay][replaceIndex];
      const minutes = Math.min(replaced.estimated_time, vocabularyCapMinutes);
      assignedMinutes += minutes - replaced.estimated_time;
      if (replaced.module === 'grammar') grammarMinutes -= replaced.estimated_time;
      schedule[targetDay][replaceIndex] = {
        ...replaced,
        title: 'Vocabulary spaced review',
        module: 'vocabulary',
        activity_type: 'vocabulary_review',
        stage_key: 'repair',
        priority: 'high',
        skill_targets: [],
        requested_mode: 'review',
        completion_policy: 'verified',
        evidence_key: 'vocabulary:due-review',
        reason:
          vocabularyEvidence.reason ||
          'Your saved vocabulary has enough review evidence for a focused recall session.',
        success_criterion: 'Complete the due review queue and rate each word honestly.',
        evidence: {
          class: 'measured_support',
          due_count: vocabularyEvidence.due_count,
          reviews_30d: vocabularyEvidence.reviews_30d,
          retention_30d: vocabularyEvidence.retention_30d,
        },
        routing: { route: 'vocabulary', mode: 'review' },
        activity_key: `v2:${replaced.scheduled_date}:repair:vocabulary:due-review:${replaceIndex}`,
        estimated_time: minutes,
      };
      vocabularyMinutes = minutes;
    }
  }

  return {
    schedule,
    allocation,
    weekly_capacity_minutes: weeklyCapacity,
    weekly_planned_minutes: assignedMinutes,
    grammar_minutes: grammarMinutes,
    grammar_cap_minutes: grammarBudgetMinutes,
    vocabulary_minutes: vocabularyMinutes,
    vocabulary_cap_minutes: vocabularyCapMinutes,
  };
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as any)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function fingerprintLearningPathInputs(value: unknown) {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function findRecurringObjectiveMistakes(sessions: any[]) {
  const observations = new Map<string, Array<{ id: string; accuracy: number }>>();
  [...(sessions || [])]
    .sort(
      (a, b) =>
        (Date.parse(b.completed_at || b.created_at) || 0) -
        (Date.parse(a.completed_at || a.created_at) || 0)
    )
    .forEach((session: any) => {
      const module = String(session.test_type || '').toLowerCase();
      if (!['reading', 'listening'].includes(module) || !session.is_completed || !session.id)
        return;
      Object.entries(session.content_data?.typeStats || {}).forEach(
        ([type, stats]: [string, any]) => {
          const total = Number(stats?.total || 0);
          const correct = Number(stats?.correct || 0);
          if (total < 3 || correct < 0 || correct > total) return;
          const key = `${module}:${type}`;
          const points = observations.get(key) || [];
          if (points.length < 3 && !points.some((point) => point.id === session.id)) {
            points.push({ id: session.id, accuracy: correct / total });
            observations.set(key, points);
          }
        }
      );
    });
  return [...observations.entries()]
    .filter(
      ([, points]) =>
        points[0].accuracy < 0.8 && points.filter((point) => point.accuracy < 0.8).length >= 2
    )
    .map(([key, points]) => {
      const [module, type] = key.split(':');
      return { module, type, sessionCount: points.filter((point) => point.accuracy < 0.8).length };
    })
    .sort(
      (a, b) =>
        b.sessionCount - a.sessionCount ||
        `${a.module}:${a.type}`.localeCompare(`${b.module}:${b.type}`)
    );
}

export function scheduleRecurringRepair(schedule: Record<string, any[]>, mistake: any) {
  if (!mistake) return schedule;
  const day = Object.keys(schedule).find((key) => (schedule[key] || []).length > 0);
  if (!day) return schedule;
  const replaceable = schedule[day].findIndex(
    (task) => task.is_optional && !String(task.activity_key || '').startsWith('result:')
  );
  const index = replaceable >= 0 ? replaceable : Math.max(0, schedule[day].length - 1);
  const existing = schedule[day][index];
  if (String(existing.activity_key || '').startsWith('result:')) return schedule;
  const evidenceKey = `recurring:${mistake.module}:${mistake.type}`;
  schedule[day][index] = {
    ...existing,
    activity_key: `v2:${existing.scheduled_date || day}:repair:${evidenceKey}:${index}`,
    evidence_key: evidenceKey,
    stage_key: 'repair',
    completion_policy: 'verified',
    requested_mode: 'practice',
    title: `${mistake.module === 'reading' ? 'Reading' : 'Listening'} ${String(
      mistake.type
    ).replace(/_/g, ' ')} repair`,
    module: mistake.module,
    activity_type: 'targeted_repair',
    priority: 'high',
    skill_targets: [`${mistake.module}_${mistake.type}`],
    reason: `This mistake type appeared in ${mistake.sessionCount} completed sessions, so it is ready for focused repair.`,
    success_criterion: 'Complete a focused set and review every missed answer.',
    evidence: { class: 'measured_priority', observations: mistake.sessionCount },
    routing: { route: mistake.module, mode: 'practice' },
  };
  return schedule;
}

export function adaptLearningPathV1(path: any) {
  if (!path || typeof path !== 'object') return null;
  if (path.version === 2 || path.generator_version) return path;
  return {
    ...path,
    version: 1,
    generator_version: 'legacy-v1',
    goal_snapshot: {
      target_band: path.target_level || null,
      test_date: null,
      study_availability: null,
    },
    evidence_summary: null,
    readiness: null,
    roadmap: Array.isArray(path.milestones)
      ? path.milestones.map((milestone: any, index: number) => ({
          key: `legacy-${index + 1}`,
          name: `Milestone ${index + 1}`,
          objective: milestone.goal,
          checkpoint: milestone.assessment,
          legacy: true,
        }))
      : [],
    coach_summary:
      path.motivation_message ||
      'This is a legacy plan. Refresh after a scored test or goal change for evidence-based planning.',
  };
}
