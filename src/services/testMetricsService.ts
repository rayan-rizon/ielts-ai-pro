/**
 * Test Metrics Service
 *
 * Calculates enhanced analytics metrics for IELTS tests.
 * Designed to be reusable across Reading, Listening, Writing, and Speaking tests.
 *
 * Premium metrics are calculated but should be gated at the UI layer.
 */

// ============================================
// Type Definitions
// ============================================

export interface QuestionStats {
  correct: number;
  total: number;
}

export interface SectionStats {
  title?: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface TimeMetrics {
  /** Average seconds spent per question */
  averageSecondsPerQuestion: number;
  /** Time spent per question type in seconds */
  timePerQuestionType: Record<string, number>;
  /** Number of questions answered very quickly (< 20 seconds) */
  rushedQuestions: number;
  /** Number of questions where user spent excessive time (> 180 seconds) */
  overanalyzedQuestions: number;
  /** Total time spent on test in seconds */
  totalTimeSpent: number;
  /** Recommended pace per question for this test type */
  recommendedPace: number;
  /** Pace efficiency: recommended/actual (1.0 is on pace, > 1 is faster) */
  paceEfficiency: number;
}

export interface ErrorPatterns {
  /** Count of answers that were close to correct (e.g., spelling errors) */
  nearMissCount: number;
  /** Question types with highest error rates */
  troubleTypes: string[];
  /** Count of unanswered questions */
  unansweredCount: number;
  /** Last-changed answer count (indicates uncertainty) */
  changedAnswers: number;
  /** Total number of times answers were changed across all questions */
  totalAnswerChanges: number;
  /** Confidence index: 0-100 based on decisiveness */
  confidenceIndex: number;
  /** Indecision score: % of questions with multiple changes */
  indecisionScore: number;
}

export interface SkillGaps {
  /** Detail retention - remembering specific facts (gap fill, table completion) */
  detailRetention: number;
  /** Paraphrasing recognition - matching synonyms (matching features) */
  paraphrasingRecognition: number;
  /** Logical reasoning - inference skills (TFNG, YNNG) */
  logicalReasoning: number;
  /** Scanning efficiency - finding specific info (short answer) */
  scanningEfficiency: number;
  /** Global comprehension - understanding main ideas (matching headings) */
  globalComprehension: number;
}

export interface PassageProficiency {
  /** Performance by passage/section number */
  bySection: { section: number; accuracy: number; title?: string; avgTime?: number }[];
  /** Best performing section number */
  bestSection: number;
  /** Weakest section number */
  weakestSection: number;
  /** Accuracy trend across passages (improving, declining, stable) */
  trend: 'improving' | 'declining' | 'stable';
  /** Fatigue factor: performance/speed drop in final section (0-100, high is bad) */
  fatigueFactor: number;
}

export interface EnhancedTestMetrics {
  /** Core metrics (always calculated - Free tier) */
  core: {
    bandScore: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    sectionStats: SectionStats[];
    typeStats: Record<string, QuestionStats>;
  };
  /** Time efficiency metrics (Pro/Premium) */
  timeMetrics: TimeMetrics;
  /** Error pattern analysis (Pro/Premium) */
  errorPatterns: ErrorPatterns;
  /** Skill gap breakdown (Premium) */
  skillGaps: SkillGaps;
  /** Passage proficiency analysis (Pro/Premium) */
  passageProficiency: PassageProficiency;
}

// ============================================
// Skill Mapping Configuration
// ============================================

/**
 * Maps question types to the skill they primarily test.
 * Used for skill gap analysis.
 */
const QUESTION_TYPE_TO_SKILL: Record<string, keyof SkillGaps> = {
  // Detail retention
  gap_fill: 'detailRetention',
  table_completion: 'detailRetention',
  sentence_completion: 'detailRetention',
  summary_completion: 'detailRetention',
  note_completion: 'detailRetention',
  notes_completion: 'detailRetention',
  short_answer: 'detailRetention',

  // Paraphrasing recognition
  matching: 'paraphrasingRecognition',
  matching_features: 'paraphrasingRecognition',

  // Logical reasoning
  true_false_not_given: 'logicalReasoning',
  yes_no_not_given: 'logicalReasoning',

  // Scanning efficiency
  multiple_choice: 'scanningEfficiency',
  map_labeling: 'scanningEfficiency',
  diagram_completion: 'scanningEfficiency',
  flow_chart_completion: 'scanningEfficiency',
  flowchart: 'scanningEfficiency',

  // Global comprehension
  matching_headings: 'globalComprehension',
};

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate time metrics from answer timestamps.
 * If no timestamps are available, returns estimated defaults.
 */
export function calculateTimeMetrics(
  answers: Record<string, unknown>,
  answerTimestamps: Record<string, number> | null,
  totalTimeSpent: number,
  totalQuestions: number,
  testType: 'reading' | 'listening' = 'reading'
): TimeMetrics {
  // Recommended pace: 60 min / 40 questions = 90 seconds for reading
  // Listening pace varies by section
  const recommendedPace = testType === 'reading' ? 90 : 60;

  const answeredCount = Object.keys(answers).length;
  const avgTimePerQuestion = answeredCount > 0 ? totalTimeSpent / answeredCount : recommendedPace;

  let rushedQuestions = 0;
  let overanalyzedQuestions = 0;
  const timePerQuestionType: Record<string, number> = {};

  // If we have timestamps, calculate detailed metrics
  if (answerTimestamps && Object.keys(answerTimestamps).length > 0) {
    const sortedTimestamps = Object.entries(answerTimestamps).sort(([, a], [, b]) => a - b);

    for (let i = 0; i < sortedTimestamps.length; i++) {
      const [questionId, timestamp] = sortedTimestamps[i];
      const prevTimestamp = i > 0 ? sortedTimestamps[i - 1][1] : 0;
      const timeOnQuestion = timestamp - prevTimestamp;

      if (timeOnQuestion < 20) rushedQuestions++;
      if (timeOnQuestion > 180) overanalyzedQuestions++;
    }
  } else {
    // No timestamp data available - we can't accurately determine rushed/overanalyzed
    // Return -1 to indicate "data not available" instead of fake estimates
    rushedQuestions = -1;
    overanalyzedQuestions = -1;
  }

  const paceEfficiency = recommendedPace / Math.max(avgTimePerQuestion, 1);

  return {
    averageSecondsPerQuestion: Math.round(avgTimePerQuestion),
    timePerQuestionType,
    rushedQuestions,
    overanalyzedQuestions,
    totalTimeSpent: Math.round(totalTimeSpent),
    recommendedPace,
    paceEfficiency: Math.min(2, Math.max(0.1, paceEfficiency)),
  };
}

/**
 * Analyze error patterns from user responses.
 */
export function calculateErrorPatterns(
  answers: Record<string, unknown>,
  correctAnswersMap: Record<string, string | { correctAnswer?: string }> | null | undefined,
  totalQuestions: number,
  typeStats: Record<string, QuestionStats>,
  answerChangeCounts?: Record<string, number> | null
): ErrorPatterns {
  // Safety guard for missing data
  if (!correctAnswersMap || !answers) {
    return {
      nearMissCount: 0,
      troubleTypes: [],
      unansweredCount: 0,
      changedAnswers: 0,
      totalAnswerChanges: 0,
      confidenceIndex: 100,
      indecisionScore: 0,
    };
  }

  let nearMissCount = 0;
  let unansweredCount = 0;

  // Check for near misses (answers that are close to correct)
  Object.entries(answers).forEach(([questionId, userAnswer]) => {
    const entry = correctAnswersMap[questionId];
    if (!entry) return;

    // Handle both string and object formats for correctAnswersMap
    const correctAnswer =
      typeof entry === 'object' && entry !== null
        ? (entry as { correctAnswer?: string }).correctAnswer || ''
        : String(entry);

    const userStr = String(userAnswer || '')
      .toLowerCase()
      .trim();
    const correctStr = String(correctAnswer).toLowerCase().trim();

    // Check for near miss: partial match, spelling difference
    if (userStr !== correctStr && userStr.length > 0) {
      // Levenshtein-like check for close answers
      if (isNearMiss(userStr, correctStr)) {
        nearMissCount++;
      }
    }
  });

  // Count unanswered by checking unique QUESTION NUMBERS, not answer keys
  // This correctly handles grouped questions (e.g., table_completion) where
  // multiple answer keys map to the same question number
  const answeredQuestionNumbers = new Set<string>();
  Object.entries(answers).forEach(([questionId, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      // Get the question number from correctAnswersMap if available
      const entry = correctAnswersMap[questionId];
      // Use simple property access - entry might be an object with questionNumber
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entryObj = entry as any;
      const questionNumber =
        entryObj && entryObj.questionNumber !== undefined
          ? String(entryObj.questionNumber)
          : questionId; // Fall back to questionId if no mapping
      answeredQuestionNumbers.add(questionNumber);
    }
  });
  unansweredCount = Math.max(
    0,
    Math.min(totalQuestions, totalQuestions - answeredQuestionNumbers.size)
  );

  // Find trouble types (lowest accuracy)
  const troubleTypes = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    }))
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((t) => t.type);

  // Calculate confidence and indecision
  const totalAnswerChanges = answerChangeCounts
    ? Object.values(answerChangeCounts).reduce((sum, v) => sum + (Number(v) || 0), 0)
    : 0;

  const questionsWithChanges = answerChangeCounts
    ? Object.values(answerChangeCounts).filter((v) => (v || 0) > 0).length
    : 0;

  const questionsWithMultipleChanges = answerChangeCounts
    ? Object.values(answerChangeCounts).filter((v) => (v || 0) > 1).length
    : 0;

  // Calculate answered count
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== null && answers[k] !== undefined && answers[k] !== ''
  ).length;

  // Confidence: Percentage-based calculation
  // 100 = no changes, no unanswered; decreases proportionally
  const changesPenalty = answeredCount > 0 ? (questionsWithChanges / answeredCount) * 40 : 0;
  const unansweredPenalty = totalQuestions > 0 ? (unansweredCount / totalQuestions) * 60 : 0;
  const confidenceIndex = Math.max(
    0,
    Math.min(100, Math.round(100 - changesPenalty - unansweredPenalty))
  );

  // Indecision: % of changed questions that had multiple changes
  const indecisionScore =
    questionsWithChanges > 0
      ? Math.round((questionsWithMultipleChanges / questionsWithChanges) * 100)
      : 0;

  return {
    nearMissCount,
    troubleTypes,
    unansweredCount,
    changedAnswers: questionsWithChanges,
    totalAnswerChanges,
    confidenceIndex,
    indecisionScore,
  };
}

/**
 * Check if two strings are near misses (very similar but not exact).
 * Enhanced with IELTS-specific rules for answer variations.
 */
function isNearMiss(userAnswer: string, correctAnswer: string): boolean {
  // Normalize both answers
  const normalizeForIELTS = (str: string): string => {
    return (
      str
        .toLowerCase()
        .trim()
        // Remove common articles that IELTS marking ignores
        .replace(/^(a|an|the)\s+/i, '')
        // Remove trailing punctuation
        .replace(/[.,;:!?]+$/, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
    );
  };

  const userNorm = normalizeForIELTS(userAnswer);
  const correctNorm = normalizeForIELTS(correctAnswer);

  // If normalized versions match, it's not a "miss" at all
  if (userNorm === correctNorm) return false;

  // Check plural/singular variations (e.g., "car" vs "cars")
  if (userNorm + 's' === correctNorm || correctNorm + 's' === userNorm) return true;
  if (userNorm + 'es' === correctNorm || correctNorm + 'es' === userNorm) return true;

  // Check length difference - must be within 3 chars
  if (Math.abs(userNorm.length - correctNorm.length) > 3) return false;

  // Calculate Levenshtein distance for close matches
  const distance = levenshteinDistance(userNorm, correctNorm);
  const maxLen = Math.max(userNorm.length, correctNorm.length);
  const similarity = 1 - distance / maxLen;

  // Near miss if similarity is 70-99%
  return similarity >= 0.7 && similarity < 1;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate skill gap analysis based on question type performance.
 */
export function calculateSkillGaps(typeStats: Record<string, QuestionStats>): SkillGaps {
  const skillScores: Record<keyof SkillGaps, { correct: number; total: number }> = {
    detailRetention: { correct: 0, total: 0 },
    paraphrasingRecognition: { correct: 0, total: 0 },
    logicalReasoning: { correct: 0, total: 0 },
    scanningEfficiency: { correct: 0, total: 0 },
    globalComprehension: { correct: 0, total: 0 },
  };

  // Aggregate question type stats into skill categories
  Object.entries(typeStats).forEach(([qType, stats]) => {
    const skill = QUESTION_TYPE_TO_SKILL[qType];
    if (skill && skillScores[skill]) {
      skillScores[skill].correct += stats.correct;
      skillScores[skill].total += stats.total;
    }
  });

  // Calculate percentage for each skill
  const calculateScore = (skill: keyof SkillGaps): number => {
    const data = skillScores[skill];
    if (data.total === 0) return -1; // Not tested
    return Math.round((data.correct / data.total) * 100);
  };

  return {
    detailRetention: calculateScore('detailRetention'),
    paraphrasingRecognition: calculateScore('paraphrasingRecognition'),
    logicalReasoning: calculateScore('logicalReasoning'),
    scanningEfficiency: calculateScore('scanningEfficiency'),
    globalComprehension: calculateScore('globalComprehension'),
  };
}

/**
 * Analyze passage/section proficiency.
 */
export function calculatePassageProficiency(sectionStats: SectionStats[]): PassageProficiency {
  if (!sectionStats || sectionStats.length === 0) {
    return {
      bySection: [],
      bestSection: 1,
      weakestSection: 1,
      trend: 'stable',
      fatigueFactor: 0,
    };
  }

  const bySection = sectionStats.map((s, idx) => ({
    section: idx + 1,
    accuracy: s.percentage,
    title: s.title,
  }));

  // Find best and weakest
  const sorted = [...bySection].sort((a, b) => b.accuracy - a.accuracy);
  const bestSection = sorted[0]?.section || 1;
  const weakestSection = sorted[sorted.length - 1]?.section || 1;

  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let fatigueFactor = 0;

  if (bySection.length >= 2) {
    const first = bySection[0].accuracy;
    const last = bySection[bySection.length - 1].accuracy;
    const diff = last - first;

    if (diff > 10) trend = 'improving';
    else if (diff < -10) trend = 'declining';

    // Calculate fatigue (drop from best to last)
    const bestAccuracy = Math.max(...bySection.map((s) => s.accuracy));
    const lastAccuracy = bySection[bySection.length - 1].accuracy;
    fatigueFactor = Math.max(0, bestAccuracy - lastAccuracy);
  }

  return { bySection, bestSection, weakestSection, trend, fatigueFactor };
}

/**
 * Main function to calculate all enhanced metrics.
 * This is the primary function for building persisted test evidence.
 */
export function calculateEnhancedMetrics(
  results: {
    bandScore: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    sectionStats: SectionStats[];
    typeStats: Record<string, QuestionStats>;
    correctAnswersMap?: Record<string, string>;
  },
  answers: Record<string, unknown>,
  answerTimestamps: Record<string, number> | null,
  totalTimeSpentSeconds: number,
  testType: 'reading' | 'listening' = 'reading',
  answerChangeCounts?: Record<string, number> | null
): EnhancedTestMetrics {
  // Core metrics (always calculated)
  const core = {
    bandScore: results.bandScore,
    totalQuestions: results.totalQuestions,
    correctAnswers: results.correctAnswers,
    percentage: results.percentage,
    sectionStats: results.sectionStats || [],
    typeStats: results.typeStats || {},
  };

  // Time metrics
  const timeMetrics = calculateTimeMetrics(
    answers,
    answerTimestamps,
    totalTimeSpentSeconds,
    results.totalQuestions,
    testType
  );

  // Error patterns
  const errorPatterns = calculateErrorPatterns(
    answers,
    results.correctAnswersMap || {},
    results.totalQuestions,
    results.typeStats || {},
    answerChangeCounts
  );

  // Skill gaps
  const skillGaps = calculateSkillGaps(results.typeStats || {});

  // Passage proficiency
  const passageProficiency = calculatePassageProficiency(results.sectionStats || []);

  return {
    core,
    timeMetrics,
    errorPatterns,
    skillGaps,
    passageProficiency,
  };
}

/**
 * Helper to get skill name for display.
 */
export const SKILL_LABELS: Record<keyof SkillGaps, string> = {
  detailRetention: 'Detail Retention',
  paraphrasingRecognition: 'Paraphrasing Recognition',
  logicalReasoning: 'Logical Reasoning',
  scanningEfficiency: 'Scanning Efficiency',
  globalComprehension: 'Global Comprehension',
};

/**
 * Helper to get skill description for tooltips.
 */
export const SKILL_DESCRIPTIONS: Record<keyof SkillGaps, string> = {
  detailRetention: 'Ability to remember and locate specific details from the passage',
  paraphrasingRecognition: 'Recognizing when information is rephrased or expressed differently',
  logicalReasoning: 'Making inferences and determining if statements are true, false, or not given',
  scanningEfficiency: 'Quickly finding specific information in the text',
  globalComprehension: 'Understanding the main ideas and structure of passages',
};

export default {
  calculateEnhancedMetrics,
  calculateTimeMetrics,
  calculateErrorPatterns,
  calculateSkillGaps,
  calculatePassageProficiency,
  SKILL_LABELS,
  SKILL_DESCRIPTIONS,
};
