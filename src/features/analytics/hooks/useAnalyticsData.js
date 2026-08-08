import { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAnalyticsQueries } from './analyticsQueries';
import { buildAnalyticsViewModel } from './analyticsDataModel';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';

export default function useAnalyticsData(selectedTimeframe) {
  const { user: authUser, loading: authLoading } = useAuth();
  const userId = authUser?.id;
  const hasAdvancedAccess = hasPaidAccess(authUser);
  const effectiveTimeframe =
    hasAdvancedAccess || selectedTimeframe === '7d' ? selectedTimeframe : '30d';
  const queries = useAnalyticsQueries(userId, hasAdvancedAccess, effectiveTimeframe);
  const viewModel = useMemo(
    () =>
      buildAnalyticsViewModel({
        rawSessions: queries.rawSessions,
        selectedTimeframe: effectiveTimeframe,
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
      effectiveTimeframe,
      authUser,
    ]
  );

  return {
    user: authUser,
    hasAdvancedAccess,
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
