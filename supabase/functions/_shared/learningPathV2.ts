export const LEARNING_PATH_GENERATOR_VERSION = '2.1.0';

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
    timezone:
      typeof source.timezone === 'string' && source.timezone.trim()
        ? source.timezone.trim()
        : timezone,
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
    grammar_transfer_preference:
      criterion_signals[0]?.skill_code === 'speaking_grammar' ? 'speaking' : 'writing',
  };
}

export function aggregateReadiness(sessions: any[], now: Date | string = new Date()) {
  const cutoff = addDays(startOfUtcDay(now), -90).getTime();
  const recent = (Array.isArray(sessions) ? sessions : []).filter((session) => {
    const score = numberOr(session?.score, NaN);
    const completedAt = new Date(session?.completed_at || session?.created_at || 0).getTime();
    return (
      IELTS_MODULES.includes(String(session?.test_type).toLowerCase() as any) &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 9 &&
      completedAt >= cutoff
    );
  });

  const modules: Record<string, any> = {};
  IELTS_MODULES.forEach((module) => {
    const scores = recent
      .filter((session) => String(session.test_type).toLowerCase() === module)
      .map((session) => numberOr(session.score, NaN))
      .filter(Number.isFinite);
    const count = scores.length;
    modules[module] = {
      module,
      sample_count: count,
      sufficient: count >= 2,
      median: count ? roundBand(median(scores)) : null,
      observed_range: count ? [Math.min(...scores), Math.max(...scores)] : null,
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
          disclaimer: `Complete recent scored diagnostics for: ${missing_diagnostics.join(', ')}.`,
        };

  return { window_days: 90, modules, overall, missing_diagnostics };
}

export function buildRoadmap(testDate: string | null | undefined, now: Date | string = new Date()) {
  const start = startOfUtcDay(now);
  const parsedExam = testDate ? startOfUtcDay(testDate) : addDays(start, 84);
  const examDate = parsedExam.getTime() > start.getTime() ? parsedExam : addDays(start, 28);
  const totalDays = Math.max(1, Math.ceil((examDate.getTime() - start.getTime()) / 86400000));

  const templates = [
    {
      key: 'foundation',
      name: 'Foundation & diagnosis',
      objective: 'Establish trustworthy baselines and close essential knowledge gaps.',
      checkpoint: 'Two recent scored attempts in every IELTS module.',
    },
    {
      key: 'repair',
      name: 'Targeted repair',
      objective: 'Repair measured priority skills with focused practice and spaced review.',
      checkpoint: 'Priority skills reach 70%+ accuracy across at least 20 new observations.',
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
      start_date: toIsoDate(cursor),
      end_date: toIsoDate(end),
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

const labelSkill = (code: string) =>
  code
    .split('_')
    .slice(1)
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Core skills';

function activityForCategory(category: string, evidence: any, readiness: any, index: number) {
  const measured =
    evidence.measured_priorities[index % Math.max(1, evidence.measured_priorities.length)];
  const due = evidence.due_reviews[index % Math.max(1, evidence.due_reviews.length)];
  const early = evidence.early_signals[index % Math.max(1, evidence.early_signals.length)];
  const strong = evidence.maintenance[index % Math.max(1, evidence.maintenance.length)];
  const missingModule =
    readiness.missing_diagnostics[index % Math.max(1, readiness.missing_diagnostics.length)];

  if (category === 'measured_priority' && measured) {
    const currentAccuracy = Math.round(measured.mastery * 100);
    return {
      title: `${labelSkill(measured.skill_code)} repair`,
      module: measured.module,
      activity_type: 'targeted_drill',
      priority: 'high',
      skill_targets: [measured.skill_code],
      reason: `${currentAccuracy}% mastery across ${measured.observations} observations makes this a measured priority.`,
      success_criterion: `Reach at least ${Math.min(90, currentAccuracy + 10)}% on a 10-question check.`,
      evidence: {
        class: 'measured_priority',
        observations: measured.observations,
        confidence: measured.confidence,
      },
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
      success_criterion: 'Recall the rule, re-attempt errors, and score 8/10 without notes.',
      evidence: { class: due.evidence_class, observations: due.observations, due: true },
      routing: { route: due.module, mode: 'review' },
    };
  }
  if (category === 'assessment') {
    const shouldDiagnoseGrammar =
      !missingModule && evidence.grammar_diagnostic_requested && index % 2 === 0;
    const candidateAssessmentModule = early?.module || measured?.module;
    const module = shouldDiagnoseGrammar
      ? 'grammar'
      : missingModule ||
        (IELTS_MODULES.includes(candidateAssessmentModule as any)
          ? candidateAssessmentModule
          : 'reading');
    return {
      title: shouldDiagnoseGrammar
        ? 'Grammar diagnostic'
        : `${module.charAt(0).toUpperCase() + module.slice(1)} ${missingModule ? 'diagnostic' : 'timed check'}`,
      module,
      activity_type: shouldDiagnoseGrammar
        ? 'grammar_diagnostic'
        : missingModule
          ? 'diagnostic'
          : 'timed_assessment',
      priority: 'high',
      skill_targets: shouldDiagnoseGrammar ? [] : early ? [early.skill_code] : [],
      reason: shouldDiagnoseGrammar
        ? 'Writing or Speaking criterion evidence is general. A diagnostic is needed before naming a specific grammar repair.'
        : missingModule
          ? `A recent scored ${module} diagnostic is still missing, so the plan will measure before labelling a weakness.`
          : 'A timed check keeps the readiness evidence current and tests transfer under pressure.',
      success_criterion: shouldDiagnoseGrammar
        ? 'Complete all 24 questions so the six grammar families can be measured separately.'
        : missingModule
          ? 'Complete a scored attempt so the next plan can use measured evidence.'
          : 'Finish within the official time limit and review every incorrect answer.',
      evidence: {
        class: shouldDiagnoseGrammar || missingModule ? 'diagnostic' : 'assessment',
        observations: shouldDiagnoseGrammar
          ? evidence.criterion_signals?.find(
              (signal: any) => signal.skill_code === evidence.grammar_diagnostic_source
            )?.observations || 0
          : early?.observations || 0,
        source: shouldDiagnoseGrammar ? evidence.grammar_diagnostic_source : null,
      },
      routing: {
        route: module,
        mode: shouldDiagnoseGrammar || missingModule ? 'diagnostic' : 'timed',
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
    success_criterion: 'Complete the set at 80%+ accuracy with steady timing.',
    evidence: {
      class: strong?.evidence_class || 'maintenance',
      observations: strong?.observations || 0,
    },
    routing: { route: module, mode: 'practice' },
  };
}

export function buildSevenDaySchedule({
  availability,
  evidence,
  readiness,
  testDate,
  now = new Date(),
}: {
  availability: StudyAvailability;
  evidence: any;
  readiness: any;
  testDate?: string | null;
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
  let grammarRepairsSinceTransfer = 0;

  const schedule: Record<string, any[]> = {};
  let taskCursor = 0;
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
      const minutes = block === 0 ? primaryMinutes : clamp(optionalMinutes, 20, 60);
      if (minutes < 20) continue;
      const category = Object.keys(allocation).sort((a, b) => {
        const deficitA =
          ((allocation as Record<string, number>)[a] / 100) * (assignedMinutes + minutes) -
          allocatedMinutes[a];
        const deficitB =
          ((allocation as Record<string, number>)[b] / 100) * (assignedMinutes + minutes) -
          allocatedMinutes[b];
        return deficitB - deficitA;
      })[0];
      let base = activityForCategory(category, evidence, readiness, taskCursor);
      const grammarRepairsBeforeBlock = grammarRepairsSinceTransfer;
      if (base.module === 'grammar' && base.activity_type === 'targeted_drill') {
        if (grammarRepairsSinceTransfer >= 2) {
          const transferTarget = evidence.grammar_transfer_preference || 'writing';
          base = {
            title: `${transferTarget === 'speaking' ? 'Speaking' : 'Writing'} grammar transfer`,
            module: 'grammar',
            activity_type: 'grammar_transfer',
            priority: 'high',
            skill_targets: base.skill_targets,
            reason:
              'Two focused Grammar Lab repairs are complete in the sequence; now apply the target in IELTS production.',
            success_criterion:
              transferTarget === 'speaking'
                ? 'Record a short response and review only transcript-grounded grammar observations.'
                : 'Write a short Academic IELTS paragraph and review exact text-grounded grammar observations.',
            evidence: base.evidence,
            routing: {
              route: 'grammar',
              mode: 'transfer',
              transferTarget,
            },
          };
          grammarRepairsSinceTransfer = 0;
        } else {
          grammarRepairsSinceTransfer += 1;
        }
      }

      if (base.module === 'grammar' && grammarMinutes + minutes > grammarBudgetMinutes) {
        grammarRepairsSinceTransfer = grammarRepairsBeforeBlock;
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
          routing: {
            route: fallbackModule,
            mode: readiness.missing_diagnostics.includes(fallbackModule)
              ? 'diagnostic'
              : 'practice',
          },
        };
      }
      schedule[day].push({
        ...base,
        activity_key: `v2:${dateKey}:${block === 0 ? 'primary' : `optional:${block}`}`,
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
  return {
    schedule,
    allocation,
    weekly_capacity_minutes: weeklyCapacity,
    weekly_planned_minutes: assignedMinutes,
    grammar_minutes: grammarMinutes,
    grammar_cap_minutes: grammarBudgetMinutes,
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
