import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildResultRecommendations } from './resultRecommendations';

const STALE_TIME = 5 * 60 * 1000;
const EMPTY_LIST = Object.freeze([]);

export async function fetchRecommendationSessions(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('test_sessions')
    .select(
      'id, test_type, module, score, band_score, completed_at, evaluated_at, is_completed, evaluation_status, evaluation_version, content_data, passage:passages(title, cambridge_title, test_format)'
    )
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(12);
  if (error) throw error;
  return data || [];
}

export function useResultRecommendations({
  user,
  grammarSkills = EMPTY_LIST,
  completedGrammarSlugs = EMPTY_LIST,
  completedVocabularySlugs = EMPTY_LIST,
  grammarGuides = EMPTY_LIST,
  vocabularyKits = EMPTY_LIST,
} = {}) {
  const userId = user?.id;
  const query = useQuery({
    queryKey: ['resultRecommendations', 'sessions', userId],
    queryFn: () => fetchRecommendationSessions(userId),
    enabled: Boolean(userId),
    staleTime: STALE_TIME,
    retry: 1,
  });

  const model = useMemo(
    () =>
      buildResultRecommendations({
        sessions: query.data || [],
        targetBand: user?.target_band_score,
        grammarSkills,
        completedGrammarSlugs,
        completedVocabularySlugs,
        grammarGuides,
        vocabularyKits,
      }),
    [
      completedGrammarSlugs,
      completedVocabularySlugs,
      grammarGuides,
      grammarSkills,
      query.data,
      user?.target_band_score,
      vocabularyKits,
    ]
  );

  return {
    ...model,
    isLoading: Boolean(userId) && query.isLoading,
    error: query.error || null,
  };
}
