import { calculateTestBandScore } from '@/lib/ieltsBandScore';
import {
  percentOf,
  reconcileObjectiveResultEvidence,
} from '@/features/testing/shared/utils/resultEvidence';

const toSafeCount = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
};

const normalizeStat = (stat) => {
  const total = toSafeCount(stat?.total);
  const correct = Math.min(total, toSafeCount(stat?.correct));
  return {
    ...stat,
    total,
    correct,
    percentage: percentOf(correct, total),
  };
};

export function normalizeTestResults(testResults, testType = 'reading') {
  if (!testResults) return testResults;

  const reconciled = reconcileObjectiveResultEvidence(testResults, testType);

  const totalQuestions = toSafeCount(reconciled.totalQuestions);
  const correctAnswers = Math.min(totalQuestions, toSafeCount(reconciled.correctAnswers));
  const percentage = percentOf(correctAnswers, totalQuestions);
  const bandScore = calculateTestBandScore(correctAnswers, totalQuestions, testType);
  const requestedUnanswered =
    reconciled.unanswered ?? reconciled.errorPatterns?.unansweredCount ?? 0;
  const unanswered = Math.min(
    Math.max(0, totalQuestions - correctAnswers),
    toSafeCount(requestedUnanswered)
  );

  const typeStats = Object.fromEntries(
    Object.entries(reconciled.typeStats || {}).map(([type, stat]) => [type, normalizeStat(stat)])
  );
  const sectionStats = Array.isArray(reconciled.sectionStats)
    ? reconciled.sectionStats.map(normalizeStat)
    : [];

  return {
    ...reconciled,
    totalQuestions,
    correctAnswers,
    percentage,
    bandScore,
    unanswered,
    typeStats,
    sectionStats,
  };
}
