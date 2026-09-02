import { LISTENING_RAW_SCORE_THRESHOLDS, READING_RAW_SCORE_THRESHOLDS } from '@/lib/ieltsBandScore';
import { QUESTION_TYPE_LABELS } from './utils';

const FREE_TEXT_TYPES = new Set([
  'gap_fill',
  'table_completion',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'notes_completion',
  'short_answer',
  'flow_chart_completion',
  'flowchart',
  'diagram_completion',
]);

/**
 * @typedef {Object} PremiumAnalysis
 * @property {Array<Object>} topBlockers
 * @property {Array<Object>} typeLosses
 * @property {{nearMiss:number, changedWrong:number, skipped:number, otherWrong:number, total:number}} errorBuckets
 * @property {Array<Object>} mistakeQueue
 * @property {Object} target
 * @property {Array<Object>} sectionStrategy
 * @property {Object} history
 * @property {Array<Object>} plan
 * @property {Object} dataAvailability
 */

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const safeCount = (value) => Math.max(0, Math.round(safeNumber(value)));

export const labelQuestionType = (type) =>
  QUESTION_TYPE_LABELS[type] ||
  String(type || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1]
          : Math.min(previous[j - 1], previous[j], current[j - 1]) + 1;
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

export function isPossibleNearMiss(userAnswer, correctAnswer) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (!user || !correct || user === correct || Math.abs(user.length - correct.length) > 2) {
    return false;
  }
  const distance = levenshteinDistance(user, correct);
  return (
    distance > 0 && distance <= Math.max(1, Math.floor(Math.max(user.length, correct.length) * 0.2))
  );
}

function buildMetadataMap(testData) {
  const map = new Map();
  const sections = Array.isArray(testData?.sections)
    ? testData.sections
    : Array.isArray(testData?.content)
      ? testData.content
      : [];
  sections.forEach((section, sectionIndex) => {
    const questions = section?.questions || section?.question_groups || [];
    const visit = (question) => {
      if (!question || typeof question !== 'object') return;
      const meta = {
        type: question.type || question.question_type || null,
        sectionIndex,
      };
      if (question.id != null) map.set(String(question.id), meta);
      if (question.question_number != null) map.set(`number:${question.question_number}`, meta);
      (question.questions || question.items || []).forEach(visit);
    };
    questions.forEach(visit);
  });
  return map;
}

export function normalizeResponseDetails(testResults, testData) {
  if (Array.isArray(testResults?.responseDetails) && testResults.responseDetails.length > 0) {
    return testResults.responseDetails.map((entry) => ({ ...entry }));
  }

  const source = testResults?.correctAnswersMap || testResults?.answersMap || {};
  const metadata = buildMetadataMap(testData);
  return Object.entries(source).map(([key, value]) => {
    const entry = value && typeof value === 'object' ? value : {};
    const questionId = String(entry.questionId || key);
    const questionNumber = entry.questionNumber ?? key;
    const meta = metadata.get(questionId) || metadata.get(`number:${questionNumber}`) || {};
    return {
      questionId,
      questionNumber,
      type: entry.type || entry.questionType || meta.type || null,
      sectionIndex: Number.isInteger(entry.sectionIndex) ? entry.sectionIndex : meta.sectionIndex,
      userAnswer: entry.userAnswer ?? '',
      correctAnswer: entry.correctAnswer ?? '',
      isCorrect: entry.isCorrect === true ? true : entry.isCorrect == null ? null : false,
    };
  });
}

function getHistoryTypeStats(session) {
  return (
    session?.content_data?.typeStats || session?.resultData?.typeStats || session?.typeStats || {}
  );
}

function getHistoryScore(session) {
  return safeNumber(session?.score ?? session?.bandScore, null);
}

export function classifyTypeTrend(entry, recentSessions) {
  let attempts = 0;
  let correct = 0;
  let total = 0;
  recentSessions.forEach((session) => {
    const stat = getHistoryTypeStats(session)?.[entry.type];
    const statTotal = safeCount(stat?.total);
    if (statTotal <= 0) return;
    attempts += 1;
    total += statTotal;
    correct += Math.min(statTotal, safeCount(stat?.correct));
  });

  if (attempts < 2 || total < 6) {
    return {
      status: 'limited',
      label: 'New / limited data',
      historicalAccuracy: null,
      attempts,
      total,
    };
  }

  const historicalAccuracy = Math.round((correct / total) * 100);
  const difference = entry.accuracy - historicalAccuracy;
  if (difference >= 15) {
    return { status: 'improving', label: 'Improving', historicalAccuracy, attempts, total };
  }
  if (difference <= -15) {
    return { status: 'declining', label: 'Declining', historicalAccuracy, attempts, total };
  }
  if (historicalAccuracy < 50 && entry.accuracy < 60) {
    return {
      status: 'recurring',
      label: 'Recurring weakness',
      historicalAccuracy,
      attempts,
      total,
    };
  }
  return { status: 'stable', label: 'Stable', historicalAccuracy, attempts, total };
}

function buildTypeLosses(testResults, responseDetails, recentSessions) {
  const skippedByType = responseDetails.reduce((acc, response) => {
    if (!response.type || String(response.userAnswer ?? '').trim()) return acc;
    acc[response.type] = (acc[response.type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(testResults?.typeStats || {})
    .map(([type, stat]) => {
      const total = safeCount(stat?.total);
      const correct = Math.min(total, safeCount(stat?.correct));
      const lost = Math.max(0, total - correct);
      const skipped = Math.min(lost, safeCount(skippedByType[type]));
      const entry = {
        type,
        label: labelQuestionType(type),
        total,
        correct,
        lost,
        skipped,
        incorrect: Math.max(0, lost - skipped),
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
      return { ...entry, trend: classifyTypeTrend(entry, recentSessions) };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.lost - a.lost || b.total - a.total || a.label.localeCompare(b.label));
}

function buildErrorBuckets(responseDetails, answerChangeCounts) {
  const buckets = {
    nearMiss: [],
    changedWrong: [],
    skipped: [],
    otherWrong: [],
  };

  responseDetails.forEach((response) => {
    if (response.isCorrect === true) return;
    const userAnswer = String(response.userAnswer ?? '').trim();
    if (!userAnswer) {
      buckets.skipped.push(response);
      return;
    }
    if (
      FREE_TEXT_TYPES.has(response.type) &&
      isPossibleNearMiss(response.userAnswer, response.correctAnswer)
    ) {
      buckets.nearMiss.push(response);
      return;
    }
    if (safeCount(answerChangeCounts?.[response.questionId]) > 0) {
      buckets.changedWrong.push(response);
      return;
    }
    buckets.otherWrong.push(response);
  });

  return buckets;
}

function buildMistakeQueue(buckets, trendByType) {
  const bucketConfig = {
    nearMiss: { score: 4, reason: 'Possible spelling or format near miss', label: 'Quick win' },
    changedWrong: {
      score: 3,
      reason: 'Changed before finishing incorrect',
      label: 'Decision check',
    },
    skipped: { score: 2, reason: 'Left unanswered', label: 'Recoverable blank' },
    otherWrong: { score: 1, reason: 'Incorrect answer', label: 'Concept review' },
  };

  return Object.entries(buckets)
    .flatMap(([bucket, responses]) =>
      responses.map((response) => {
        const recurringBonus = trendByType[response.type]?.status === 'recurring' ? 1 : 0;
        return {
          ...response,
          bucket,
          priority: bucketConfig[bucket].score + recurringBonus,
          reason: bucketConfig[bucket].reason,
          label: bucketConfig[bucket].label,
        };
      })
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        safeNumber(a.questionNumber, Number.MAX_SAFE_INTEGER) -
          safeNumber(b.questionNumber, Number.MAX_SAFE_INTEGER)
    )
    .slice(0, 5);
}

function buildSectionStrategy(testResults, testType) {
  const sectionStats = Array.isArray(testResults?.sectionStats) ? testResults.sectionStats : [];
  const passageTimes = testResults?.passageTimes || {};
  const usesZeroBasedPassageKeys = Object.prototype.hasOwnProperty.call(passageTimes, 0);
  return sectionStats.map((section, index) => {
    const total = safeCount(section?.total);
    const correct = Math.min(total, safeCount(section?.correct));
    const passageKey = usesZeroBasedPassageKeys ? index : index + 1;
    const seconds = testType === 'reading' ? safeCount(passageTimes[passageKey]) : null;
    return {
      index,
      label: testType === 'reading' ? `Passage ${index + 1}` : `Part ${index + 1}`,
      total,
      correct,
      lost: Math.max(0, total - correct),
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      seconds: seconds > 0 ? seconds : null,
      paceDeltaSeconds: seconds > 0 ? seconds - 20 * 60 : null,
    };
  });
}

function getThresholds(testType) {
  return testType === 'listening' ? LISTENING_RAW_SCORE_THRESHOLDS : READING_RAW_SCORE_THRESHOLDS;
}

export function getTargetPlanner(correct, total, currentBand, requestedTarget, testType) {
  const thresholds = getThresholds(testType);
  const validBands = Object.keys(thresholds)
    .map(Number)
    .filter((band) => band > currentBand)
    .sort((a, b) => a - b);
  const nextBand = validBands[0] || 9;
  const requested = safeNumber(requestedTarget, nextBand);
  const targetBand = validBands.includes(requested) ? requested : nextBand;
  const rawNeeded = Math.min(total, Math.ceil(((thresholds[targetBand] || 40) / 40) * total));
  return {
    targetBand,
    nextBand,
    total,
    rawNeeded,
    additionalCorrect: Math.max(0, rawNeeded - correct),
    options: validBands.length ? validBands : [9],
  };
}

function buildPlan(typeLosses, mistakeQueue, testType) {
  const primary = typeLosses[0]?.label || 'weak question types';
  const secondary = typeLosses[1]?.label || primary;
  const reviewCount = Math.max(1, mistakeQueue.length);
  const sectionLabel = testType === 'reading' ? 'Timed passage' : 'Focused listening part';
  return [
    {
      day: 1,
      title: `Review ${reviewCount} priority mistakes`,
      minutes: 20,
      skill: primary,
      kind: 'review',
    },
    {
      day: 2,
      title: `${primary} technique practice`,
      minutes: 30,
      skill: primary,
      kind: 'practice',
    },
    {
      day: 3,
      title: `${secondary} accuracy session`,
      minutes: 25,
      skill: secondary,
      kind: 'practice',
    },
    { day: 4, title: sectionLabel, minutes: 20, skill: 'Pacing and focus', kind: 'timed' },
    {
      day: 5,
      title: 'Spelling and decision-check drill',
      minutes: 20,
      skill: 'Error correction',
      kind: 'review',
    },
    {
      day: 6,
      title: 'Mixed weak-type practice',
      minutes: 30,
      skill: `${primary}, ${secondary}`,
      kind: 'practice',
    },
    {
      day: 7,
      title: 'Mini retest and result comparison',
      minutes: 30,
      skill: 'Exam readiness',
      kind: 'assessment',
    },
  ];
}

/** @returns {PremiumAnalysis} */
export function buildPremiumAnalysis({
  testResults,
  testData,
  recentSessions = [],
  testType = 'reading',
  targetBand,
}) {
  const history = recentSessions.slice(0, 5);
  const responseDetails = normalizeResponseDetails(testResults, testData);
  const typeLosses = buildTypeLosses(testResults, responseDetails, history);
  const trendByType = Object.fromEntries(typeLosses.map((entry) => [entry.type, entry.trend]));
  const buckets = buildErrorBuckets(responseDetails, testResults?.answerChangeCounts || {});
  const mistakeQueue = buildMistakeQueue(buckets, trendByType);
  const correct = safeCount(testResults?.correctAnswers);
  const total = safeCount(testResults?.totalQuestions);
  const currentBand = safeNumber(testResults?.bandScore);
  const target = getTargetPlanner(correct, total, currentBand, targetBand, testType);
  const sectionStrategy = buildSectionStrategy(testResults, testType);
  const totalBucketed = Object.values(buckets).reduce((sum, list) => sum + list.length, 0);
  const expectedLosses = Math.max(0, total - correct);
  const topBlockers = typeLosses.slice(0, 3).map((entry) => ({
    title: entry.label,
    detail: `${entry.lost} point${entry.lost === 1 ? '' : 's'} lost`,
    status: entry.trend.label,
    type: entry.type,
  }));

  return {
    responseDetails,
    typeLosses,
    errorBuckets: {
      nearMiss: buckets.nearMiss.length,
      changedWrong: buckets.changedWrong.length,
      skipped: buckets.skipped.length,
      otherWrong: buckets.otherWrong.length,
      total: totalBucketed,
    },
    mistakeQueue,
    target,
    sectionStrategy,
    topBlockers,
    history: {
      hasEnoughData: history.length >= 2,
      scores: history
        .map((session) => ({
          score: getHistoryScore(session),
          date: session.completed_at || session.created_at,
        }))
        .filter((entry) => entry.score !== null),
    },
    plan: buildPlan(typeLosses, mistakeQueue, testType),
    dataAvailability: {
      hasResponseDetails: responseDetails.length > 0 && responseDetails.some((entry) => entry.type),
      hasReliableBuckets: responseDetails.length > 0 && totalBucketed === expectedLosses,
      hasHistory: history.length >= 2,
      hasSectionTiming:
        testType === 'reading' && sectionStrategy.some((section) => section.seconds !== null),
    },
  };
}
