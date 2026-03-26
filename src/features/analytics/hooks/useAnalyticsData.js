import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TestSession, VocabularyItem } from '@/entities';
import { formatBand, calculateImprovement, calculateScoreForecast } from '../utils';

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

    // Avg Score
    const avgScoreNum =
      totalTests > 0
        ? filteredSessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / totalTests
        : 0;

    // Study Hours
    const calculateHours = (sessions) => {
      const totalSeconds = (sessions || []).reduce((sum, s) => {
        let duration = (Number(s.duration_minutes) || 0) * 60;
        if (duration === 0 && s.created_at && s.completed_at) {
          const start = new Date(s.created_at);
          const end = new Date(s.completed_at);
          const diff = (end - start) / 1000;
          if (diff > 0 && diff < 14400) duration = diff;
        }
        if (duration === 0) duration = 1200;
        return sum + duration;
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
    const improvement = calculateImprovement(filteredSessions);

    return {
      avgScore: formatBand(avgScoreNum),
      targetScore: authUser?.target_band_score || 7.0,
      totalTests,
      studyHours,
      studyHoursTrend,
      vocabCount,
      improvement: improvement > 0 ? `+${formatBand(improvement)}` : formatBand(improvement),
    };
  }, [filteredSessions, previousSessions, authUser, vocabCount]); // Depend on authUser for target score

  // 4. Module Stats (Radar Data, Specifics)
  const moduleStats = useMemo(() => {
    const modules = ['reading', 'writing', 'listening', 'speaking'];
    return modules.map((type) => {
      const sessions = filteredSessions.filter((s) => (s.test_type || '').toLowerCase() === type);
      const currentAvg =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / sessions.length
          : 0;

      const recentScores = sessions.slice(0, 5).map((s) => Number(s.score) || 0);

      return {
        type,
        avg: currentAvg,
        count: sessions.length,
        lastScore: sessions[0]?.score || 0,
        highest: sessions.length > 0 ? Math.max(...sessions.map((s) => Number(s.score) || 0)) : 0,
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
        detailRetention: { sum: 0, count: 0 },
        paraphrasingRecognition: { sum: 0, count: 0 },
        logicalReasoning: { sum: 0, count: 0 },
        scanningEfficiency: { sum: 0, count: 0 },
        globalComprehension: { sum: 0, count: 0 },
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
      if (type && s.duration_minutes > 0) {
        moduleEfficiency[type] += s.duration_minutes;
        moduleEfficiencyCount[type] += 1;
      }

      // Enhanced Metrics
      if (content.timeMetrics) {
        const rushed = content.timeMetrics.rushedQuestions || 0;
        const overanalyzed = content.timeMetrics.overanalyzedQuestions || 0;

        enhancedMetricsAgg.totalRushedQuestions += rushed;
        enhancedMetricsAgg.totalOveranalyzedQuestions += overanalyzed;
        enhancedMetricsAgg.totalTimeSpent += content.timeMetrics.totalTimeSpent || 0;
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
        const nearMisses = content.errorPatterns.nearMissCount || 0;
        const unanswered = content.errorPatterns.unansweredCount || 0;

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
          if (score >= 0 && enhancedMetricsAgg.skillGapsTotals[skill]) {
            enhancedMetricsAgg.skillGapsTotals[skill].sum += score;
            enhancedMetricsAgg.skillGapsTotals[skill].count += 1;
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

    const modules = ['reading', 'writing', 'listening', 'speaking'];
    const efficiency = {};
    modules.forEach((m) => {
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
        rushed: s.content_data?.timeMetrics?.rushedQuestions || 0,
        overanalyzed: s.content_data?.timeMetrics?.overanalyzedQuestions || 0,
        accuracy: Math.round(((s.content_data?.correct || 0) / (s.content_data?.total || 1)) * 100),
        score: Number(s.score) || 0,
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
          name: 'Near Misses',
          value: enhancedMetricsAgg.totalNearMisses,
          color: 'hsl(var(--primary))',
        },
        {
          name: 'Rushed',
          value: enhancedMetricsAgg.totalRushedQuestions,
          color: 'hsl(var(--rose-500))',
        },
        {
          name: 'Overanalyzed',
          value: enhancedMetricsAgg.totalOveranalyzedQuestions,
          color: 'hsl(var(--amber-500))',
        },
        {
          name: 'Unanswered',
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

    return { typeAccuracy, sectionPerformance, efficiency, enhancedMetrics };
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
    const rushedCount = errorAuditData.find((d) => d.name === 'Rushed')?.value || 0;
    if (topTroubleTypes.includes('Vocabulary') && rushedCount > 5) {
      correlations.push({
        id: 'rushed-vocab',
        title: 'Speed Impact',
        text: 'Your rushed pace is causing vocabulary-related slips. Slow down for better precision.',
        impact: 'High',
      });
    }

    // Pattern 2: Overanalysis vs Time
    const overanalyzedCount = errorAuditData.find((d) => d.name === 'Overanalyzed')?.value || 0;
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
  }, [moduleStats, stats.avgScore, stats.improvement, advancedMetrics, rawSessions]);

  // 7. Chart Data
  const chartData = useMemo(() => {
    // Aggregated history (group by date to avoid congestion)
    const aggregatedHistory = filteredSessions
      .slice()
      .reverse()
      .reduce((acc, s) => {
        const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        const existing = acc.find((item) => item.date === dateStr);
        if (existing) {
          // If multiple tests in one day, take the average
          existing.score = Number(((existing.score + (Number(s.score) || 0)) / 2).toFixed(1));
          existing.count += 1;
        } else {
          acc.push({
            date: dateStr,
            score: Number(s.score) || 0,
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
    const modules = ['reading', 'writing', 'listening', 'speaking'];
    modules.forEach((mType) => {
      moduleHistory[mType] = filteredSessions
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
            existing.score = Number(((existing.score + (Number(s.score) || 0)) / 2).toFixed(1));
          } else {
            acc.push({
              date: dateStr,
              score: Number(s.score) || 0,
            });
          }
          return acc;
        }, []);
    });

    // Forecast - using linear regression from utils
    const forecast = calculateScoreForecast(filteredSessions, stats.avgScore, stats.targetScore);

    return { history, pie: distribution, moduleHistory, forecast };
  }, [filteredSessions, moduleStats, stats.avgScore, stats.targetScore, stats.improvement]);

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
