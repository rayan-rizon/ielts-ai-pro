import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { formatBand, calculateImprovement, calculateScoreForecast } from '../utils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];
const MAX_REASONABLE_TEST_SECONDS = 4 * 60 * 60;

export function isValidBandScore(score) {
  const value = Number(score);
  return Number.isFinite(value) && value >= 0 && value <= 9;
}

function toValidBandScore(score) {
  return isValidBandScore(score) ? Number(score) : null;
}

function nonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getKnownDurationSeconds(session) {
  const storedMinutes = Number(session?.duration_minutes);
  if (
    Number.isFinite(storedMinutes) &&
    storedMinutes > 0 &&
    storedMinutes * 60 <= MAX_REASONABLE_TEST_SECONDS
  ) {
    return storedMinutes * 60;
  }

  const enhancedSeconds = Number(session?.content_data?.timeMetrics?.totalTimeSpent);
  if (
    Number.isFinite(enhancedSeconds) &&
    enhancedSeconds > 0 &&
    enhancedSeconds <= MAX_REASONABLE_TEST_SECONDS
  ) {
    return enhancedSeconds;
  }

  if (session?.created_at && session?.completed_at) {
    const diff =
      (new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 1000;
    if (Number.isFinite(diff) && diff > 0 && diff <= MAX_REASONABLE_TEST_SECONDS) {
      return diff;
    }
  }

  return null;
}

export default function useAnalyticsData(selectedTimeframe) {
  const { user: authUser, loading: authLoading } = useAuth();

  // Stable user ID for queries
  const userId = authUser?.id;

  // 1. Fetch Sessions (Cached 5 mins)
  const { data: rawSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['analytics', 'sessions', userId],
    queryFn: () =>
      TestSession.list(
        { user_id: userId },
        '-completed_at',
        1000,
        'id, created_at, completed_at, score, duration_minutes, test_type, is_completed, content_data'
      ),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Vocabulary Count (Cached 5 mins)
  const { data: vocabCount = 0, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary', 'count', userId],
    queryFn: () => VocabularyItem.count({ user_id: userId }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || (!!userId && (sessionsLoading || vocabLoading));

  // --- MEMOIZED DATA PROCESSING ---

  // 1. Filter Sessions by Timeframe
  const filteredSessions = useMemo(() => {
    const now = new Date();
    let startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30d

    if (selectedTimeframe === '7d') {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (selectedTimeframe === '90d') {
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (selectedTimeframe === 'all') {
      startTime = new Date(0);
    }

    return rawSessions.filter(
      (s) => s.is_completed && new Date(s.completed_at || s.created_at) >= startTime
    );
  }, [rawSessions, selectedTimeframe]);

  // 2. Previous Period Sessions (for trends)
  const previousSessions = useMemo(() => {
    if (selectedTimeframe === 'all') return [];

    const now = new Date();
    let startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let previousStartTime = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    if (selectedTimeframe === '7d') {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    } else if (selectedTimeframe === '90d') {
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStartTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    }

    return rawSessions.filter((s) => {
      const d = new Date(s.completed_at || s.created_at);
      return s.is_completed && d >= previousStartTime && d < startTime;
    });
  }, [rawSessions, selectedTimeframe]);

  // 3. Stats Aggregation (Study Hours, Score, etc)
  const stats = useMemo(() => {
    const totalTests = filteredSessions.length;
    const scoredSessions = filteredSessions.filter((s) => isValidBandScore(s.score));

    // Avg Score
    const avgScoreNum =
      scoredSessions.length > 0
        ? scoredSessions.reduce((sum, s) => sum + Number(s.score), 0) / scoredSessions.length
        : 0;

    // Study Hours
    const calculateHours = (sessions) => {
      const totalSeconds = (sessions || []).reduce((sum, s) => {
        const duration = getKnownDurationSeconds(s);
        return duration === null ? sum : sum + duration;
      }, 0);
      return Math.round(totalSeconds / 3600);
    };

    const studyHours = calculateHours(filteredSessions);
    const prevStudyHours = calculateHours(previousSessions);

    // Trend
    const studyHoursTrend =
      prevStudyHours > 0
        ? Math.round(((studyHours - prevStudyHours) / prevStudyHours) * 100)
        : studyHours > 0
          ? 100
          : 0;

    // Improvement - using weighted moving average from utils
    const improvement = calculateImprovement(scoredSessions);

    // Predicted Overall IELTS Band — real formula: average latest score from each module → nearest 0.5
    // IELTS Official: Overall = (R + L + W + S) / 4, rounded to nearest 0.5
    const moduleLatestScores = MODULES.map((type) => {
      const typeSessions = scoredSessions.filter((s) => (s.test_type || '').toLowerCase() === type);
      return typeSessions.length > 0 ? Number(typeSessions[0].score) : null;
    }).filter((s) => s !== null);

    const predictedOverallBand =
      moduleLatestScores.length > 0
        ? Math.round(
            (moduleLatestScores.reduce((sum, s) => sum + s, 0) / moduleLatestScores.length) * 2
          ) / 2
        : null;

    return {
      avgScore: formatBand(avgScoreNum),
      targetScore: authUser?.target_band_score || 7.0,
      totalTests,
      scoredTests: scoredSessions.length,
      studyHours,
      studyHoursTrend,
      vocabCount,
      improvement: improvement > 0 ? `+${formatBand(improvement)}` : formatBand(improvement),
      predictedOverallBand,
      modulesWithData: moduleLatestScores.length,
    };
  }, [filteredSessions, previousSessions, authUser, vocabCount]);

  // 4. Module Stats (Radar Data, Specifics)
  const moduleStats = useMemo(() => {
    return MODULES.map((type) => {
      const sessions = filteredSessions.filter(
        (s) => (s.test_type || '').toLowerCase() === type && isValidBandScore(s.score)
      );
      const currentAvg =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + Number(s.score), 0) / sessions.length
          : 0;

      const recentScores = sessions.slice(0, 5).map((s) => Number(s.score));

      return {
        type,
        avg: currentAvg,
        count: sessions.length,
        lastScore: sessions[0]?.score ?? 0,
        highest: sessions.length > 0 ? Math.max(...sessions.map((s) => Number(s.score))) : 0,
        sessions,
        recentScores,
      };
    });
  }, [filteredSessions]);

  // 5. Advanced Metrics (Efficiency, Types, Sections)
  const advancedMetrics = useMemo(() => {
    const allTypeStats = {};
    const allSectionStats = {};
    const moduleEfficiency = { reading: 0, writing: 0, listening: 0, speaking: 0 };
    const moduleEfficiencyCount = { reading: 0, writing: 0, listening: 0, speaking: 0 };

    const enhancedMetricsAgg = {
      totalRushedQuestions: 0,
      totalOveranalyzedQuestions: 0,
      totalTimeSpent: 0,
      sessionCount: 0,
      troubleTypesFrequency: {},
      totalNearMisses: 0,
      totalUnanswered: 0,
      sessionReferences: {
        rushed: [],
        overanalyzed: [],
        nearMisses: [],
        unanswered: [],
      },
      skillGapsTotals: {
        'Remembering Details': { sum: 0, count: 0 },
        'Finding Similar Words': { sum: 0, count: 0 },
        'Smart Thinking': { sum: 0, count: 0 },
        'Reading Speed': { sum: 0, count: 0 },
        'Main Idea': { sum: 0, count: 0 },
      },
    };

    filteredSessions.forEach((s) => {
      const content = s.content_data || {};
      const type = (s.test_type || '').toLowerCase();

      const sessionBrief = {
        id: s.id,
        date: s.completed_at || s.created_at,
        type: s.test_type,
        score: s.score,
        troubleTypes: content.errorPatterns?.troubleTypes || [],
      };

      // Type Stats
      if (content.typeStats) {
        Object.entries(content.typeStats).forEach(([qType, qStats]) => {
          if (!allTypeStats[qType]) allTypeStats[qType] = { correct: 0, total: 0 };
          allTypeStats[qType].correct += qStats.correct || 0;
          allTypeStats[qType].total += qStats.total || 0;
        });
      }

      // Section Stats
      if (content.sectionStats) {
        content.sectionStats.forEach((secStats, idx) => {
          const secKey = `Passage/Part ${idx + 1}`;
          if (!allSectionStats[secKey]) allSectionStats[secKey] = { correct: 0, total: 0 };
          allSectionStats[secKey].correct += secStats.correct || 0;
          allSectionStats[secKey].total += secStats.total || 0;
        });
      }

      // Efficiency
      const durationSeconds = getKnownDurationSeconds(s);
      if (type && moduleEfficiency[type] !== undefined && durationSeconds !== null) {
        moduleEfficiency[type] += durationSeconds / 60;
        moduleEfficiencyCount[type] += 1;
      }

      // Enhanced Metrics
      if (content.timeMetrics) {
        const rushed = nonNegativeCount(content.timeMetrics.rushedQuestions);
        const overanalyzed = nonNegativeCount(content.timeMetrics.overanalyzedQuestions);
        const trackedSeconds = Number(content.timeMetrics.totalTimeSpent);

        enhancedMetricsAgg.totalRushedQuestions += rushed;
        enhancedMetricsAgg.totalOveranalyzedQuestions += overanalyzed;
        if (
          Number.isFinite(trackedSeconds) &&
          trackedSeconds > 0 &&
          trackedSeconds <= MAX_REASONABLE_TEST_SECONDS
        ) {
          enhancedMetricsAgg.totalTimeSpent += trackedSeconds;
        }
        enhancedMetricsAgg.sessionCount += 1;

        if (rushed > 0)
          enhancedMetricsAgg.sessionReferences.rushed.push({ ...sessionBrief, count: rushed });
        if (overanalyzed > 0)
          enhancedMetricsAgg.sessionReferences.overanalyzed.push({
            ...sessionBrief,
            count: overanalyzed,
          });
      }

      if (content.errorPatterns) {
        const nearMisses = nonNegativeCount(content.errorPatterns.nearMissCount);
        const unanswered = nonNegativeCount(content.errorPatterns.unansweredCount);

        enhancedMetricsAgg.totalNearMisses += nearMisses;
        enhancedMetricsAgg.totalUnanswered += unanswered;

        if (nearMisses > 0)
          enhancedMetricsAgg.sessionReferences.nearMisses.push({
            ...sessionBrief,
            count: nearMisses,
          });
        if (unanswered > 0)
          enhancedMetricsAgg.sessionReferences.unanswered.push({
            ...sessionBrief,
            count: unanswered,
          });

        (content.errorPatterns.troubleTypes || []).forEach((tt) => {
          enhancedMetricsAgg.troubleTypesFrequency[tt] =
            (enhancedMetricsAgg.troubleTypesFrequency[tt] || 0) + 1;
        });
      }

      if (content.skillGaps) {
        Object.entries(content.skillGaps).forEach(([skill, score]) => {
          // Map technical keys to friendly names if needed
          const skillMap = {
            detailRetention: 'Remembering Details',
            paraphrasingRecognition: 'Finding Similar Words',
            logicalReasoning: 'Smart Thinking',
            scanningEfficiency: 'Reading Speed',
            globalComprehension: 'Main Idea',
          };
          const friendlyName = skillMap[skill] || skill;
          if (score >= 0 && enhancedMetricsAgg.skillGapsTotals[friendlyName]) {
            enhancedMetricsAgg.skillGapsTotals[friendlyName].sum += score;
            enhancedMetricsAgg.skillGapsTotals[friendlyName].count += 1;
          }
        });
      }
    });

    // Transform for UI
    const typeAccuracy = Object.entries(allTypeStats)
      .map(([type, stats]) => ({
        type: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
        correct: stats.correct,
        total: stats.total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const sectionPerformance = Object.entries(allSectionStats)
      .map(([section, stats]) => ({
        section,
        accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
      }))
      .sort((a, b) => a.section.localeCompare(b.section));

    const efficiency = {};
    MODULES.forEach((m) => {
      efficiency[m] =
        moduleEfficiencyCount[m] > 0
          ? Math.round(moduleEfficiency[m] / moduleEfficiencyCount[m])
          : 0;
    });

    const paceData = filteredSessions
      .map((s) => ({
        id: s.id,
        date: s.completed_at || s.created_at,
        type: s.test_type,
        rushed: nonNegativeCount(s.content_data?.timeMetrics?.rushedQuestions),
        overanalyzed: nonNegativeCount(s.content_data?.timeMetrics?.overanalyzedQuestions),
        accuracy: Math.round(
          ((s.content_data?.correct ?? s.content_data?.correctAnswers ?? 0) /
            (s.content_data?.total ?? s.content_data?.totalQuestions ?? 1)) *
            100
        ),
        score: toValidBandScore(s.score) ?? 0,
      }))
      .filter((d) => d.rushed > 0 || d.overanalyzed > 0);

    const enhancedMetrics = {
      hasData: enhancedMetricsAgg.sessionCount > 0,
      paceData,
      avgTimePerSession:
        enhancedMetricsAgg.sessionCount > 0
          ? Math.round(enhancedMetricsAgg.totalTimeSpent / enhancedMetricsAgg.sessionCount / 60)
          : 0,
      totalRushed: enhancedMetricsAgg.totalRushedQuestions,
      totalOveranalyzed: enhancedMetricsAgg.totalOveranalyzedQuestions,
      totalNearMisses: enhancedMetricsAgg.totalNearMisses,
      totalUnanswered: enhancedMetricsAgg.totalUnanswered,
      sessionReferences: enhancedMetricsAgg.sessionReferences,
      errorAuditData: [
        {
          name: 'Almost Correct',
          value: enhancedMetricsAgg.totalNearMisses,
          color: 'hsl(var(--primary))',
        },
        {
          name: 'Rushing',
          value: enhancedMetricsAgg.totalRushedQuestions,
          color: 'hsl(var(--rose-500))',
        },
        {
          name: 'Thinking Too Long',
          value: enhancedMetricsAgg.totalOveranalyzedQuestions,
          color: 'hsl(var(--amber-500))',
        },
        {
          name: 'Left Blank',
          value: enhancedMetricsAgg.totalUnanswered,
          color: 'hsl(var(--muted-foreground))',
        },
      ].filter((d) => d.value > 0),
      topTroubleTypes: Object.entries(enhancedMetricsAgg.troubleTypesFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type),
      skillGaps: Object.entries(enhancedMetricsAgg.skillGapsTotals)
        .map(([skill, data]) => ({
          skill,
          avg: data.count > 0 ? Math.round(data.sum / data.count) : -1,
        }))
        .filter((s) => s.avg >= 0)
        .sort((a, b) => a.avg - b.avg),
    };

    // Writing Criteria aggregation from content_data.criteriaScores
    const writingCriteriaAgg = {
      taskAchievement: { sum: 0, count: 0 },
      coherence: { sum: 0, count: 0 },
      lexicalResource: { sum: 0, count: 0 },
      grammar: { sum: 0, count: 0 },
    };

    // Speaking Criteria aggregation from content_data.criteriaScores
    const speakingCriteriaAgg = {
      fluency: { sum: 0, count: 0 },
      lexicalResource: { sum: 0, count: 0 },
      grammar: { sum: 0, count: 0 },
      pronunciation: { sum: 0, count: 0 },
    };

    filteredSessions.forEach((s) => {
      const content = s.content_data || {};
      const type = (s.test_type || '').toLowerCase();
      const cs = content.criteriaScores || {};

      if (type === 'writing') {
        const t1 =
          content.ai_feedbacks?.['Task 1']?.criteriaScores ||
          content.ai_feedbacks?.['Task 1']?.criteria_scores ||
          {};
        const t2 =
          content.ai_feedbacks?.['Task 2']?.criteriaScores ||
          content.ai_feedbacks?.['Task 2']?.criteria_scores ||
          {};
        const hasData =
          Object.keys(cs).length > 0 || Object.keys(t1).length > 0 || Object.keys(t2).length > 0;

        if (hasData) {
          const fallbackTa =
            t2.TaskAchievement ||
            t2.task_achievement ||
            t1.TaskAchievement ||
            t1.task_achievement ||
            0;
          const fallbackCc =
            t2['Coherence & Cohesion'] ||
            t2.CoherenceAndCohesion ||
            t1['Coherence & Cohesion'] ||
            t1.CoherenceAndCohesion ||
            0;
          const fallbackLr =
            t2['Lexical Resource'] ||
            t2.LexicalResource ||
            t1['Lexical Resource'] ||
            t1.LexicalResource ||
            0;
          const fallbackGr =
            t2.GrammaticalRangeAndAccuracy ||
            t2['Grammatical Range & Accuracy'] ||
            t1.GrammaticalRangeAndAccuracy ||
            t1['Grammatical Range & Accuracy'] ||
            0;

          const ta = Number(cs.taskAchievement || fallbackTa) || 0;
          const cc = Number(cs.coherence || fallbackCc) || 0;
          const lr = Number(cs.lexicalResource || fallbackLr) || 0;
          const gr = Number(cs.grammar || fallbackGr) || 0;

          if (ta > 0) {
            writingCriteriaAgg.taskAchievement.sum += ta;
            writingCriteriaAgg.taskAchievement.count++;
          }
          if (cc > 0) {
            writingCriteriaAgg.coherence.sum += cc;
            writingCriteriaAgg.coherence.count++;
          }
          if (lr > 0) {
            writingCriteriaAgg.lexicalResource.sum += lr;
            writingCriteriaAgg.lexicalResource.count++;
          }
          if (gr > 0) {
            writingCriteriaAgg.grammar.sum += gr;
            writingCriteriaAgg.grammar.count++;
          }
        }
      }

      if (type === 'speaking') {
        const evalCs = content.finalEvaluation || {};
        const hasData = Object.keys(cs).length > 0 || Object.keys(evalCs).length > 0;

        if (hasData) {
          const fl = Number(cs.fluency || evalCs.fluency) || 0;
          const lr = Number(cs.lexicalResource || evalCs.lexical) || 0;
          const gr = Number(cs.grammar || evalCs.grammar) || 0;
          const pr = Number(cs.pronunciation || evalCs.pronunciation) || 0;
          if (fl > 0) {
            speakingCriteriaAgg.fluency.sum += fl;
            speakingCriteriaAgg.fluency.count++;
          }
          if (lr > 0) {
            speakingCriteriaAgg.lexicalResource.sum += lr;
            speakingCriteriaAgg.lexicalResource.count++;
          }
          if (gr > 0) {
            speakingCriteriaAgg.grammar.sum += gr;
            speakingCriteriaAgg.grammar.count++;
          }
          if (pr > 0) {
            speakingCriteriaAgg.pronunciation.sum += pr;
            speakingCriteriaAgg.pronunciation.count++;
          }
        }
      }
    });

    const avgCriteria = (agg) =>
      agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : null;

    const writingCriteria = {
      taskAchievement: avgCriteria(writingCriteriaAgg.taskAchievement),
      coherence: avgCriteria(writingCriteriaAgg.coherence),
      lexicalResource: avgCriteria(writingCriteriaAgg.lexicalResource),
      grammar: avgCriteria(writingCriteriaAgg.grammar),
      hasData: Object.values(writingCriteriaAgg).some((v) => v.count > 0),
    };

    const speakingCriteria = {
      fluency: avgCriteria(speakingCriteriaAgg.fluency),
      lexicalResource: avgCriteria(speakingCriteriaAgg.lexicalResource),
      grammar: avgCriteria(speakingCriteriaAgg.grammar),
      pronunciation: avgCriteria(speakingCriteriaAgg.pronunciation),
      hasData: Object.values(speakingCriteriaAgg).some((v) => v.count > 0),
    };

    return {
      typeAccuracy,
      sectionPerformance,
      efficiency,
      enhancedMetrics,
      writingCriteria,
      speakingCriteria,
    };
  }, [filteredSessions]);

  // 6. Insights Generation
  const insights = useMemo(() => {
    const strengths = [];
    const improvementsList = [];
    const trends = [];
    const recommendations = [];
    const correlations = [];

    moduleStats.forEach((m) => {
      if (m.count === 0) return;
      if (m.avg >= 7.0) {
        strengths.push({
          type: m.type,
          text: `Strong performance in ${m.type} (Avg: ${formatBand(m.avg)})`,
        });
      } else if (m.avg <= 5.5) {
        improvementsList.push({
          type: m.type,
          text: `${m.type} needs attention (Avg: ${formatBand(m.avg)})`,
        });
        recommendations.push({
          type: m.type,
          text: `Try 15 mins of daily ${m.type} practice to boost your score.`,
          gain: 0.3,
        });
      }

      if ((m.sessions || []).length >= 3) {
        const recent = m.sessions.slice(0, 3);
        const scores = recent.map((s) => Number(s.score) || 0);
        const isRising = scores[0] > scores[1] && scores[1] >= scores[2];
        const isFalling = scores[0] < scores[1] && scores[1] <= scores[2];
        if (isRising)
          trends.push({
            type: 'positive',
            text: `Your ${m.type} score is consistently improving.`,
          });
        if (isFalling)
          trends.push({ type: 'negative', text: `Recent dip in ${m.type} scores detected.` });
      }
    });

    // Correlation logic (Cross-chart patterns)
    const { enhancedMetrics } = advancedMetrics;
    const { errorAuditData, topTroubleTypes } = enhancedMetrics;

    // Pattern 1: Rushed vs Accuracy
    const rushedCount = errorAuditData.find((d) => d.name === 'Rushing')?.value || 0;
    if (topTroubleTypes.includes('Vocabulary') && rushedCount > 5) {
      correlations.push({
        id: 'rushed-vocab',
        title: 'Speed Impact',
        text: 'Your rushed pace is causing vocabulary-related slips. Slow down for better precision.',
        impact: 'High',
      });
    }

    // Pattern 2: Overanalysis vs Time
    const overanalyzedCount =
      errorAuditData.find((d) => d.name === 'Thinking Too Long')?.value || 0;
    if (overanalyzedCount > 3) {
      correlations.push({
        id: 'overanalysis',
        title: 'Decision Fatigue',
        text: 'Frequent overanalysis is costing you precious time in later sections.',
        impact: 'Medium',
      });
    }

    // Predicted Score Logic
    let predictedScore = parseFloat(stats.avgScore);
    if (!isNaN(predictedScore)) {
      const improvementVal = parseFloat(stats.improvement.replace('+', ''));
      if (improvementVal > 0) predictedScore += 0.5;
      if (improvementVal < 0) predictedScore -= 0.2;
      predictedScore = Math.max(0, Math.min(9, predictedScore));
    } else {
      predictedScore = 0;
    }

    const demoAiSuggestions = null;

    return {
      strengths,
      improvements: improvementsList,
      correlations,
      trends,
      predictedScore: formatBand(predictedScore),
      recommendations,
      aiSuggestions: demoAiSuggestions,
    };
  }, [moduleStats, stats.avgScore, stats.improvement, advancedMetrics]);

  // 7. Chart Data
  const chartData = useMemo(() => {
    const scoredSessions = filteredSessions.filter((s) => isValidBandScore(s.score));

    // Aggregated history (group by date to avoid congestion)
    const aggregatedHistory = scoredSessions
      .slice()
      .reverse()
      .reduce((acc, s) => {
        const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        const existing = acc.find((item) => item.date === dateStr);
        if (existing) {
          // Correct cumulative average: (prev_avg * n + new_score) / (n + 1)
          const newCount = existing.count + 1;
          existing.score = Number(
            ((existing.score * existing.count + Number(s.score)) / newCount).toFixed(1)
          );
          existing.count = newCount;
        } else {
          acc.push({
            date: dateStr,
            score: Number(s.score),
            type: s.test_type,
            count: 1,
          });
        }
        return acc;
      }, []);

    const history = aggregatedHistory;

    const distribution = moduleStats
      .map((m) => ({ name: m.type.charAt(0).toUpperCase() + m.type.slice(1), value: m.count }))
      .filter((d) => d.value > 0);

    const moduleHistory = {};
    MODULES.forEach((mType) => {
      moduleHistory[mType] = scoredSessions
        .filter((s) => s.test_type === mType)
        .slice()
        .reverse()
        .reduce((acc, s) => {
          const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          const existing = acc.find((item) => item.date === dateStr);
          if (existing) {
            const newCount = existing.count + 1;
            existing.score = Number(
              ((existing.score * existing.count + Number(s.score)) / newCount).toFixed(1)
            );
            existing.count = newCount;
          } else {
            acc.push({
              date: dateStr,
              score: Number(s.score),
              count: 1,
            });
          }
          return acc;
        }, []);
    });

    // Forecast - using linear regression from utils
    const forecast = calculateScoreForecast(scoredSessions, stats.avgScore, stats.targetScore);

    return { history, pie: distribution, moduleHistory, forecast };
  }, [filteredSessions, moduleStats, stats.avgScore, stats.targetScore]);

  return {
    user: authUser,
    isLoading,
    rawSessions,
    stats: {
      ...stats,
      moduleStats,
      ...advancedMetrics, // flattens: typeAccuracy, sectionPerformance, efficiency, enhancedMetrics
      insights,
    },
    chartData,
  };
}
