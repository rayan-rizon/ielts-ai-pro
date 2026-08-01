import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Resource } from '@/features/learning/services/Resource';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { buildDashboardViewModel, isPremiumTier, normalizeTargetScore } from './dashboardDataUtils';
import { getTodaysFocus, createTodaysFocus } from '@/services/adaptiveLearningService';

export { normalizeTargetScore };

const dataOr = (result, fallback) => result.data ?? fallback;
const firstOrNull = (items) => items[0] ?? null;

const assertDashboardQueriesSucceeded = (queryResults) => {
  const failedQuery = queryResults.find(([, result]) => result?.error);
  if (!failedQuery) return;
  const [label, result] = failedQuery;
  throw new Error(`Could not load ${label}: ${result.error.message}`);
};

async function fetchDashboardStats(userId) {
  if (!userId) return null;

  const [statsResult, recentSessionsResult, cambridgeResult, skillProficiencyResult] =
    await Promise.all([
      supabase.rpc('get_dashboard_stats'),
      supabase.rpc('get_recent_sessions', { p_limit: 8 }),
      supabase.rpc('get_cambridge_tests', { p_limit: 4 }),
      // Every tracked question type, weakest first — the dashboard shows a ranked
      // breakdown, not just the single worst skill.
      supabase
        .from('skill_proficiency')
        .select(
          'skill_code, module, mastery_probability, practice_count, correct_count, streak_count'
        )
        .eq('user_id', userId)
        .order('mastery_probability', { ascending: true })
        .limit(24),
    ]);

  assertDashboardQueriesSucceeded([
    ['dashboard statistics', statsResult],
    ['recent sessions', recentSessionsResult],
    ['Cambridge tests', cambridgeResult],
    ['skill proficiency', skillProficiencyResult],
  ]);

  const skillProficiency = dataOr(skillProficiencyResult, []);

  return {
    serverStats: dataOr(statsResult, {}),
    recentSessions: dataOr(recentSessionsResult, []),
    cambridgeTests: dataOr(cambridgeResult, []),
    skillProficiency,
    // Weakest skill is the head of the same ranked list — one query, not two.
    weakestSkill: firstOrNull(skillProficiency),
  };
}

async function fetchAiFocus(userId) {
  if (!userId) return null;
  const focus = await getTodaysFocus(userId).catch(() => null);
  return focus || createTodaysFocus(userId).catch(() => null);
}

async function fetchStudyResources() {
  const [videos, guides] = await Promise.all([
    Resource.list({ is_published: true, content_type: 'video' }, '-view_count', 3, 1),
    // 6, not 4 — a 2-column grid of 4 leaves 2 rows against the video column's
    // 3, trailing off into empty space below. 6 fills a matching 3 rows.
    Resource.list({ is_published: true, content_type: 'pdf' }, '-view_count', 6, 1),
  ]);
  return [...(videos.data || []), ...(guides.data || [])];
}

const queryUserKey = (userId) => userId || 'anonymous';
const valueOrNull = (value) => value ?? null;
const valueOrEmpty = (value) => value ?? [];
const getTargetScore = (user) => user?.target_band_score;

const useDashboardStatsQuery = (userId, enabled) =>
  useQuery({
    queryKey: queryKeys.dashboard.stats(queryUserKey(userId)),
    queryFn: () => fetchDashboardStats(userId),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

const useAiFocusQuery = (userId, enabled) =>
  useQuery({
    queryKey: ['dashboard', 'aiFocus', queryUserKey(userId)],
    queryFn: () => fetchAiFocus(userId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

const useStudyResourcesQuery = (enabled) =>
  useQuery({
    queryKey: ['dashboard', 'studyResources'],
    queryFn: fetchStudyResources,
    enabled,
    staleTime: 15 * 60 * 1000,
  });

const createDashboardHookResult = ({
  user,
  authLoading,
  statsQuery,
  computedData,
  aiFocusQuery,
  resourcesQuery,
}) => ({
  user: valueOrNull(user),
  isLoading: authLoading || statsQuery.isLoading,
  recentTests: computedData.recentTests,
  weeklyProgress: computedData.weeklyProgress,
  aiFocus: valueOrNull(aiFocusQuery.data),
  stats: computedData.stats,
  cambridgeTests: computedData.cambridgeTests,
  weakestSkill: computedData.weakestSkill,
  skillProficiency: computedData.skillProficiency,
  studyResources: valueOrEmpty(resourcesQuery.data),
  resourcesLoading: resourcesQuery.isLoading,
  hasError: statsQuery.isError,
  retry: statsQuery.refetch,
});

/**
 * Hook for fetching dashboard data with caching
 * Uses React Query for automatic caching and background refetching
 */
export default function useDashboardData(authUser, authLoading) {
  const userId = authUser?.id;
  const user = authUser;
  const enabled = !authLoading && Boolean(userId);
  const isPremium = isPremiumTier(user?.subscription_tier);
  const premiumEnabled = enabled && isPremium;
  const statsQuery = useDashboardStatsQuery(userId, enabled);
  const aiFocusQuery = useAiFocusQuery(userId, premiumEnabled);
  const resourcesQuery = useStudyResourcesQuery(enabled);
  const targetScore = getTargetScore(user);

  const computedData = useMemo(() => {
    return buildDashboardViewModel(statsQuery.data, targetScore);
  }, [statsQuery.data, targetScore]);
  return createDashboardHookResult({
    user,
    authLoading,
    statsQuery,
    computedData,
    aiFocusQuery,
    resourcesQuery,
  });
}
