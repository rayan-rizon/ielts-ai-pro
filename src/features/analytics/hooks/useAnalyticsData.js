import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { supabase } from '@/lib/supabase';
import { buildLearningPathAnalytics } from './learningPathAnalytics';
import {
  filterSessionsByTimeframe,
  getPreviousSessions,
  computeStats,
  computeModuleStats,
  computeAdvancedMetrics,
  computeInsights,
  computeChartData,
  computeExamReadiness,
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
        'id, passage_id, created_at, completed_at, score, duration_minutes, actual_duration_seconds, test_type, test_mode, is_completed, evaluation_status, evaluation_version, evaluated_at, content_data, passage:passages(title, cambridge_title, test_format)'
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

  const { data: learningPathEvidence = null, isLoading: learningPathLoading } = useQuery({
    queryKey: ['learningPath', 'analyticsEvidence', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('path_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return buildLearningPathAnalytics(data?.path_data);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: grammarAttempts = [], isLoading: grammarLoading } = useQuery({
    queryKey: ['analytics', 'grammarAttempts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_attempts')
        .select('id, mode, correct_count, total_questions, completed_at')
        .eq('user_id', userId)
        .eq('completion_state', 'completed')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Per-skill mastery the adaptive engine already maintains (2,400+ rows in
   * production across six modules, including Grammar and Vocabulary, which no
   * test session covers). The dashboard reads this; Analytics — the page whose
   * whole job is diagnosis — did not.
   */
  const { data: skillProficiency = [] } = useQuery({
    queryKey: ['analytics', 'skillProficiency', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_proficiency')
        .select(
          'skill_code, module, mastery_probability, practice_count, correct_count, streak_count'
        )
        .eq('user_id', userId)
        .order('mastery_probability', { ascending: true })
        .limit(60);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    authLoading || (!!userId && (sessionsLoading || vocabLoading || grammarLoading));

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
    () => computeChartData(filteredSessions, moduleStats),
    [filteredSessions, moduleStats]
  );

  const grammarEvidence = useMemo(() => {
    const days =
      selectedTimeframe === '7d'
        ? 7
        : selectedTimeframe === '90d'
          ? 90
          : selectedTimeframe === 'all'
            ? null
            : 30;
    const cutoff = days == null ? null : Date.now() - days * 24 * 60 * 60 * 1000;
    const completed = grammarAttempts.filter((attempt) => {
      const timestamp = new Date(attempt.completed_at).getTime();
      return cutoff == null || timestamp >= cutoff;
    });
    const correct = completed.reduce((sum, attempt) => sum + Number(attempt.correct_count || 0), 0);
    const total = completed.reduce((sum, attempt) => sum + Number(attempt.total_questions || 0), 0);
    return {
      completedAttempts: completed.length,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
      transferAttempts: completed.filter((attempt) => attempt.mode === 'transfer').length,
    };
  }, [grammarAttempts, selectedTimeframe]);

  const readiness = useMemo(() => computeExamReadiness(stats, moduleStats), [stats, moduleStats]);

  return {
    user: authUser,
    isLoading,
    rawSessions,
    stats: {
      ...stats,
      moduleStats,
      ...advancedMetrics,
      readiness,
      skillProficiency,
      grammarEvidence,
      evidenceSummary: learningPathEvidence,
      insights: {
        ...insights,
        aiSuggestions: learningPathEvidence?.aiSuggestions || null,
      },
    },
    chartData,
    learningPathLoading,
  };
}
