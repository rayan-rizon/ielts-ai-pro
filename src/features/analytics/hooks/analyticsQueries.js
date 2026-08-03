import { useQuery } from '@tanstack/react-query';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { supabase } from '@/lib/supabase';
import { buildLearningPathAnalytics } from './learningPathAnalytics';

const STALE_TIME = 5 * 60 * 1000;
const enabledFor = (userId) => Boolean(userId);

const fetchSessions = async (userId) => {
  const { data, error } = await supabase
    .from('test_sessions')
    .select(
      'id, passage_id, created_at, completed_at, score, duration_minutes, actual_duration_seconds, test_type, test_mode, is_completed, evaluation_status, evaluation_version, evaluated_at, content_data, passage:passages(title, cambridge_title, test_format)'
    )
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
};

const fetchLearningPathEvidence = async (userId) => {
  const { data, error } = await supabase
    .from('learning_paths')
    .select('path_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return buildLearningPathAnalytics(data?.path_data);
};

const fetchGrammarAttempts = async (userId) => {
  const { data, error } = await supabase
    .from('grammar_attempts')
    .select('id, mode, correct_count, total_questions, completed_at')
    .eq('user_id', userId)
    .eq('completion_state', 'completed')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

const fetchSkillProficiency = async (userId) => {
  const { data, error } = await supabase
    .from('skill_proficiency')
    .select('skill_code, module, mastery_probability, practice_count, correct_count, streak_count')
    .eq('user_id', userId)
    .order('mastery_probability', { ascending: true })
    .limit(60);
  if (error) throw error;
  return data ?? [];
};

const useSessionsQuery = (userId) =>
  useQuery({
    queryKey: ['analytics', 'sessions', userId],
    queryFn: () => fetchSessions(userId),
    enabled: enabledFor(userId),
    staleTime: STALE_TIME,
  });

const useVocabularyQuery = (userId) =>
  useQuery({
    queryKey: ['vocabulary', 'count', userId],
    queryFn: () => VocabularyItem.count({ user_id: userId }),
    enabled: enabledFor(userId),
    staleTime: STALE_TIME,
  });

const useLearningPathEvidenceQuery = (userId, includeAdvancedInsights) =>
  useQuery({
    queryKey: ['learningPath', 'analyticsEvidence', userId],
    queryFn: () => fetchLearningPathEvidence(userId),
    enabled: enabledFor(userId) && includeAdvancedInsights,
    staleTime: STALE_TIME,
  });

const useGrammarQuery = (userId, includeAdvancedInsights) =>
  useQuery({
    queryKey: ['analytics', 'grammarAttempts', userId],
    queryFn: () => fetchGrammarAttempts(userId),
    enabled: enabledFor(userId) && includeAdvancedInsights,
    staleTime: STALE_TIME,
  });

const useSkillQuery = (userId, includeAdvancedInsights) =>
  useQuery({
    queryKey: ['analytics', 'skillProficiency', userId],
    queryFn: () => fetchSkillProficiency(userId),
    enabled: enabledFor(userId) && includeAdvancedInsights,
    staleTime: STALE_TIME,
  });

const firstError = (queries) => queries.find((query) => query.error)?.error ?? null;

export function useAnalyticsQueries(userId, includeAdvancedInsights = false) {
  const sessions = useSessionsQuery(userId);
  const vocabulary = useVocabularyQuery(userId);
  const learningPath = useLearningPathEvidenceQuery(userId, includeAdvancedInsights);
  const grammar = useGrammarQuery(userId, includeAdvancedInsights);
  const skills = useSkillQuery(userId, includeAdvancedInsights);
  const core = [sessions, vocabulary];
  const advanced = includeAdvancedInsights ? [learningPath, grammar, skills] : [];
  const active = [...core, ...advanced];

  return {
    rawSessions: sessions.data ?? [],
    vocabCount: vocabulary.data ?? 0,
    learningPathEvidence: includeAdvancedInsights ? (learningPath.data ?? null) : null,
    grammarAttempts: includeAdvancedInsights ? (grammar.data ?? []) : [],
    skillProficiency: includeAdvancedInsights ? (skills.data ?? []) : [],
    isLoading: active.some((query) => query.isLoading),
    error: firstError(active),
    learningPathLoading: learningPath.isLoading,
    retry: () => Promise.all(active.map((query) => query.refetch())),
  };
}
