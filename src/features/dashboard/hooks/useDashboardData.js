import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LearningPath } from '@/features/learning/services/LearningPath';
import { Resource } from '@/features/learning/services/Resource';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { formatBand } from '@/lib/format';
import {
  getTodaysFocus,
  createTodaysFocus,
  getLearningPathProgress,
} from '@/services/adaptiveLearningService';

async function fetchDashboardStats(userId) {
  if (!userId) return null;

  const [
    statsResult,
    recentSessionsResult,
    cambridgeResult,
    vocabCountResult,
    masteredVocabResult,
    dueVocabResult,
    skillProficiencyResult,
  ] = await Promise.all([
    supabase.rpc('get_dashboard_stats'),
    supabase.rpc('get_recent_sessions', { p_limit: 8 }),
    supabase.rpc('get_cambridge_tests', { p_limit: 4 }),
    supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('mastery_level', 4),
    // Words the spaced-repetition scheduler wants reviewed now. Same predicate as
    // the get_due_vocabulary RPC, but a head-count so we never ship 20 rows the
    // dashboard would only measure.
    supabase
      .from('vocabulary_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(`next_review_date.is.null,next_review_date.lte.${new Date().toISOString()}`),
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

  if (statsResult.error) {
    console.error('get_dashboard_stats error:', statsResult.error.message);
  }
  if (recentSessionsResult.error) {
    console.error('get_recent_sessions error:', recentSessionsResult.error.message);
  }

  const totalWords = vocabCountResult.count || 0;
  const masteredWords = masteredVocabResult.count || 0;
  const skillProficiency = skillProficiencyResult?.data || [];

  return {
    serverStats: statsResult.data || {},
    recentSessions: recentSessionsResult.data || [],
    cambridgeTests: cambridgeResult.data || [],
    vocabStats: {
      totalWords,
      masteredWords,
      dueWords: dueVocabResult.count || 0,
      masteryPercentage: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
    },
    skillProficiency,
    // Weakest skill is the head of the same ranked list — one query, not two.
    weakestSkill: skillProficiency[0] || null,
  };
}

/**
 * Fetch user's AI learning path
 */
async function fetchAiPath(userId) {
  if (!userId) return null;

  const paths = await LearningPath.list({ user_id: userId }, '-created_at', 1);
  const latest = paths?.[0];

  let data = latest?.path_data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }

  return data && typeof data === 'object' ? data : null;
}

/**
 * Fetch AI focus and progress data for the AILearningPathCard
 */
async function fetchAiFocusAndProgress(userId) {
  if (!userId) return null;

  const [focusData, progressData] = await Promise.all([
    getTodaysFocus(userId).catch(() => null),
    getLearningPathProgress(userId).catch(() => null),
  ]);

  // If no focus exists, create it
  let finalFocus = focusData;
  if (!finalFocus) {
    finalFocus = await createTodaysFocus(userId).catch(() => null);
  }

  return { focus: finalFocus, progress: progressData };
}

/**
 * Hook for fetching dashboard data with caching
 * Uses React Query for automatic caching and background refetching
 */
export default function useDashboardData(authUser, authLoading) {
  const userId = authUser?.id;

  // authUser already contains profile data merged by AuthContext
  const user = authUser;

  // Fetch dashboard stats (main data)
  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats(userId || 'anonymous'),
    queryFn: () => fetchDashboardStats(userId),
    enabled: !authLoading && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
  });

  // Fetch AI learning path (for Pro/Premium users)
  const isPremium = useMemo(() => {
    const tier = (user?.subscription_tier || '').toLowerCase();
    return tier === 'pro' || tier === 'premium';
  }, [user?.subscription_tier]);

  const { data: aiPath, isLoading: aiLoading } = useQuery({
    queryKey: queryKeys.learningPath.latest(userId || 'anonymous'),
    queryFn: () => fetchAiPath(userId),
    enabled: !authLoading && !!userId && isPremium,
    staleTime: 30 * 60 * 1000,
  });

  // Fetch AI focus & progress (for AILearningPathCard – avoids duplicate fetch)
  const { data: aiFocusProgress, isLoading: aiFocusLoading } = useQuery({
    queryKey: ['dashboard', 'aiFocusProgress', userId || 'anonymous'],
    queryFn: () => fetchAiFocusAndProgress(userId),
    enabled: !authLoading && !!userId && isPremium,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top study resources
  const { data: studyResources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['dashboard', 'studyResources'],
    queryFn: () =>
      Resource.list({ is_published: true }, '-view_count', 50, 1).then((res) => res.data || []),
    enabled: !authLoading && !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes is fine for resources
  });

  // Compute derived data from server response
  const computedData = useMemo(() => {
    if (!dashboardData?.serverStats) {
      return {
        weeklyProgress: [],
        radarData: [],
        stats: {
          totalTests: 0,
          avgScore: '0.0',
          targetScore: Number(user?.target_band_score || authUser?.target_band_score || 7.0),
          todayMinutes: 0,
          todayTests: 0,
          streak: 0,
          moduleAverages: {},
        },
        recentTests: [],
        cambridgeTests: [],
        weakestSkill: null,
        skillProficiency: [],
        vocabStats: { totalWords: 0, masteredWords: 0, dueWords: 0, masteryPercentage: 0 },
      };
    }

    const serverStats = dashboardData.serverStats;
    const types = ['reading', 'writing', 'listening', 'speaking'];
    const moduleAverages = serverStats.moduleAverages || {};

    const radarData = types.map((type) => ({
      subject: type.charAt(0).toUpperCase() + type.slice(1),
      A: Number(moduleAverages[type] || 0),
      fullMark: 9,
    }));

    const recentTests = (dashboardData.recentSessions || []).map((session) => ({
      ...session,
      passage: session.passage_title
        ? { id: session.passage_id, title: session.passage_title }
        : null,
    }));

    return {
      weeklyProgress: serverStats.weeklyProgress || [],
      radarData,
      stats: {
        totalTests: serverStats.totalTests || 0,
        avgScore: formatBand(serverStats.avgScore || 0),
        targetScore: Number(user?.target_band_score || authUser?.target_band_score || 7.0),
        todayMinutes: serverStats.todayMinutes || 0,
        todayTests: serverStats.todayTests || 0,
        streak: serverStats.streak || 0,
        moduleAverages,
        dailyActivity: serverStats.dailyActivity || {},
      },
      recentTests,
      cambridgeTests: dashboardData.cambridgeTests || [],
      weakestSkill: dashboardData.weakestSkill || null,
      skillProficiency: dashboardData.skillProficiency || [],
      vocabStats: dashboardData.vocabStats || {
        totalWords: 0,
        masteredWords: 0,
        dueWords: 0,
        masteryPercentage: 0,
      },
    };
  }, [dashboardData, user?.target_band_score, authUser?.target_band_score]);

  // Compute AI tasks for today
  const aiTasks = useMemo(() => {
    if (!aiPath?.weekly_schedule) return [];

    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const tasks = aiPath.weekly_schedule[dayNames[dayIndex]] || [];

    return Array.isArray(tasks) ? tasks.slice(0, 3) : [];
  }, [aiPath]);

  // Determine loading state
  const isLoading = authLoading || statsLoading;

  return {
    user: user || null,
    isLoading,
    recentTests: computedData.recentTests,
    weeklyProgress: computedData.weeklyProgress,
    aiLoading,
    aiPath: aiPath || null,
    aiTasks,
    aiFocus: aiFocusProgress?.focus || null,
    aiProgress: aiFocusProgress?.progress || null,
    aiFocusLoading,
    radarData: computedData.radarData,
    stats: computedData.stats,
    cambridgeTests: computedData.cambridgeTests,
    weakestSkill: computedData.weakestSkill,
    skillProficiency: computedData.skillProficiency,
    vocabStats: computedData.vocabStats,
    studyResources: studyResources || [],
    resourcesLoading,
  };
}
