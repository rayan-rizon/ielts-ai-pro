import { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAnalyticsQueries } from './analyticsQueries';
import { buildAnalyticsViewModel } from './analyticsDataModel';

export default function useAnalyticsData(selectedTimeframe) {
  const { user: authUser, loading: authLoading } = useAuth();
  const userId = authUser?.id;
  const queries = useAnalyticsQueries(userId);
  const viewModel = useMemo(
    () =>
      buildAnalyticsViewModel({
        rawSessions: queries.rawSessions,
        selectedTimeframe,
        authUser,
        vocabCount: queries.vocabCount,
        grammarAttempts: queries.grammarAttempts,
        skillProficiency: queries.skillProficiency,
        learningPathEvidence: queries.learningPathEvidence,
      }),
    [
      queries.rawSessions,
      queries.vocabCount,
      queries.grammarAttempts,
      queries.skillProficiency,
      queries.learningPathEvidence,
      selectedTimeframe,
      authUser,
    ]
  );

  return {
    user: authUser,
    isLoading: authLoading || (Boolean(userId) && queries.isLoading),
    rawSessions: queries.rawSessions,
    stats: viewModel.stats,
    chartData: viewModel.chartData,
    learningPathLoading: queries.learningPathLoading,
    hasError: Boolean(queries.error),
    errorMessage: queries.error?.message ?? null,
    retry: queries.retry,
  };
}
