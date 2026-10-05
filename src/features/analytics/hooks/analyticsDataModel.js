import { percentOf } from '@/features/testing/shared/utils/resultEvidence';
import {
  computeAdvancedMetrics,
  computeChartData,
  computeExamReadiness,
  computeInsights,
  computeModuleStats,
  computeStats,
  filterSessionsByTimeframe,
  getPreviousSessions,
} from './analyticsCalculations';

const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEFRAME_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };

const timeframeCutoff = (selectedTimeframe, now) => {
  const days = TIMEFRAME_DAYS[selectedTimeframe] ?? TIMEFRAME_DAYS['30d'];
  return days == null ? null : now - days * DAY_MS;
};

export function buildGrammarEvidence(grammarAttempts, selectedTimeframe, now = Date.now()) {
  const cutoff = timeframeCutoff(selectedTimeframe, now);
  const completed = (Array.isArray(grammarAttempts) ? grammarAttempts : []).filter((attempt) => {
    const timestamp = new Date(attempt.completed_at).getTime();
    return cutoff == null || timestamp >= cutoff;
  });
  const totals = completed.reduce(
    (result, attempt) => ({
      correct: result.correct + (Number(attempt.correct_count) || 0),
      questions: result.questions + (Number(attempt.total_questions) || 0),
      transfer: result.transfer + (attempt.mode === 'transfer' ? 1 : 0),
    }),
    { correct: 0, questions: 0, transfer: 0 }
  );

  return {
    completedAttempts: completed.length,
    accuracy: totals.questions > 0 ? percentOf(totals.correct, totals.questions) : null,
    transferAttempts: totals.transfer,
  };
}

export function buildAnalyticsViewModel({
  rawSessions,
  selectedTimeframe,
  authUser,
  vocabCount,
  grammarAttempts,
  skillProficiency,
  learningPathEvidence,
}) {
  const filteredSessions = filterSessionsByTimeframe(rawSessions, selectedTimeframe);
  const previousSessions = getPreviousSessions(rawSessions, selectedTimeframe);
  const baseStats = computeStats(filteredSessions, previousSessions, authUser, vocabCount);
  const moduleStats = computeModuleStats(filteredSessions);
  const advancedMetrics = computeAdvancedMetrics(filteredSessions);
  const insights = computeInsights(moduleStats);
  const chartData = computeChartData(filteredSessions, moduleStats);
  const readiness = computeExamReadiness(baseStats, moduleStats);
  const grammarEvidence = buildGrammarEvidence(grammarAttempts, selectedTimeframe);

  return {
    stats: {
      ...baseStats,
      moduleStats,
      ...advancedMetrics,
      readiness,
      skillProficiency,
      grammarEvidence,
      evidenceSummary: learningPathEvidence,
      insights: {
        ...insights,
        aiSuggestions: learningPathEvidence?.aiSuggestions ?? null,
      },
    },
    chartData,
  };
}
