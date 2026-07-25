import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import {
  filterSessionsByTimeframe,
  getPreviousSessions,
  computeStats,
  computeModuleStats,
  computeAdvancedMetrics,
  computeInsights,
  computeChartData,
} from './analyticsCalculations';

export default function useAnalyticsData(selectedTimeframe) {
  const { user: authUser, loading: authLoading } = useAuth();
  const userId = authUser?.id;

  const { data: rawSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['analytics', 'sessions', userId],
    queryFn: () =>
      TestSession.list(
        { user_id: userId },
        '-completed_at',
        1000,
        'id, passage_id, created_at, completed_at, score, duration_minutes, test_type, test_mode, is_completed, content_data, passage:passages(title, cambridge_title, test_format)'
      ),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: vocabCount = 0, isLoading: vocabLoading } = useQuery({
    queryKey: ['vocabulary', 'count', userId],
    queryFn: () => VocabularyItem.count({ user_id: userId }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || (!!userId && (sessionsLoading || vocabLoading));

  const filteredSessions = useMemo(
    () => filterSessionsByTimeframe(rawSessions, selectedTimeframe),
    [rawSessions, selectedTimeframe]
  );

  const previousSessions = useMemo(
    () => getPreviousSessions(rawSessions, selectedTimeframe),
    [rawSessions, selectedTimeframe]
  );

  const stats = useMemo(
    () => computeStats(filteredSessions, previousSessions, authUser, vocabCount),
    [filteredSessions, previousSessions, authUser, vocabCount]
  );

  const moduleStats = useMemo(() => computeModuleStats(filteredSessions), [filteredSessions]);

  const advancedMetrics = useMemo(
    () => computeAdvancedMetrics(filteredSessions),
    [filteredSessions]
  );

  const insights = useMemo(
    () => computeInsights(moduleStats, advancedMetrics, stats.avgScore, stats.improvement),
    [moduleStats, advancedMetrics, stats.avgScore, stats.improvement]
  );

  const chartData = useMemo(
    () => computeChartData(filteredSessions, moduleStats, stats.avgScore, stats.targetScore),
    [filteredSessions, moduleStats, stats.avgScore, stats.targetScore]
  );

  return {
    user: authUser,
    isLoading,
    rawSessions,
    stats: {
      ...stats,
      moduleStats,
      ...advancedMetrics,
      insights,
    },
    chartData,
  };
}
