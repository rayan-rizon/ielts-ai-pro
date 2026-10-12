import { useQuery } from '@tanstack/react-query';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import { supabase } from '@/lib/supabase';
import { buildLearningPathAnalytics } from './learningPathAnalytics';

const STALE_TIME = 5 * 60 * 1000;
export const ANALYTICS_SESSION_PAGE_SIZE = 500;
const SESSION_LOOKBACK_DAYS = { '7d': 14, '30d': 60, '90d': 180, all: null };
const enabledFor = (userId) => Boolean(userId);

export const getSessionFetchCutoff = (selectedTimeframe, now = Date.now()) => {
  const lookbackDays = Object.prototype.hasOwnProperty.call(
    SESSION_LOOKBACK_DAYS,
    selectedTimeframe
  )
    ? SESSION_LOOKBACK_DAYS[selectedTimeframe]
    : SESSION_LOOKBACK_DAYS['30d'];
  return lookbackDays == null
    ? null
    : new Date(now - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
};

export const fetchSessions = async (userId, selectedTimeframe = '30d', now = Date.now()) => {
  const sessions = [];
  const cutoff = getSessionFetchCutoff(selectedTimeframe, now);

  let cursor = null;
  for (;;) {
    const { data, error } = await supabase.rpc('get_learner_analytics_page', {
      p_user_id: userId,
      p_cutoff: cutoff,
      p_before_date: cursor?.cursor_date ?? null,
      p_before_id: cursor?.id ?? null,
      p_limit: ANALYTICS_SESSION_PAGE_SIZE,
    });
    if (error) throw error;
    const page = data ?? [];
    sessions.push(...page);
    if (page.length < ANALYTICS_SESSION_PAGE_SIZE) break;
    const next = page.at(-1);
    if (!next?.id || !next?.cursor_date || next.id === cursor?.id) {
      throw new Error('Analytics history returned an invalid cursor.');
    }
    cursor = next;
  }

  return sessions;
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

export const fetchGrammarAttempts = async (userId, selectedTimeframe = '30d', now = Date.now()) => {
  const days = { '7d': 7, '30d': 30, '90d': 90, all: null }[selectedTimeframe];
  const cutoff = days == null ? null : new Date(now - days * 86400000).toISOString();
  const { data, error } = await supabase.rpc('get_learner_grammar_summary', {
    p_user_id: userId,
    p_cutoff: cutoff,
  });
  if (error) throw error;
  return data;
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

const useSessionsQuery = (userId, selectedTimeframe) =>
  useQuery({
    queryKey: ['analytics', 'sessions', userId, selectedTimeframe],
    queryFn: () => fetchSessions(userId, selectedTimeframe),
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

const useGrammarQuery = (userId, includeAdvancedInsights, selectedTimeframe) =>
  useQuery({
    queryKey: ['analytics', 'grammarAttempts', userId, selectedTimeframe],
    queryFn: () => fetchGrammarAttempts(userId, selectedTimeframe),
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

export function useAnalyticsQueries(
  userId,
  includeAdvancedInsights = false,
  selectedTimeframe = '30d'
) {
  const sessions = useSessionsQuery(userId, selectedTimeframe);
  const vocabulary = useVocabularyQuery(userId);
  const learningPath = useLearningPathEvidenceQuery(userId, includeAdvancedInsights);
  const grammar = useGrammarQuery(userId, includeAdvancedInsights, selectedTimeframe);
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
