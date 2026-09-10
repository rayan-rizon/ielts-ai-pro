import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { getWritingQuotaUsage } from '@/lib/tierLimitsUtils';

// Conservative fallback limits used only if the DB call fails
const FALLBACK_LIMITS = {
  free: { writing: 1, speaking: 0, vocabulary: 20 },
  pro: { writing: 100, speaking: 50, vocabulary: 300 },
  premium: { writing: 200, speaking: 100, vocabulary: Infinity },
  admin: { writing: 500, speaking: 1000, vocabulary: Infinity },
};

/**
 * Fetch tier limits from the database via get_tier_rate_limits RPC.
 * Cached separately so multiple hooks/components can share the result.
 */
function useTierLimits(tier) {
  return useQuery({
    queryKey: ['tier-rate-limits', tier],
    staleTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tier_rate_limits', {
        p_tier: tier,
      });

      if (error || !data || data.length === 0) {
        console.warn('Failed to fetch tier limits, using fallback:', error);
        return FALLBACK_LIMITS[tier] || FALLBACK_LIMITS.free;
      }

      const row = data[0] || data;
      return {
        writing: row.writing_monthly_limit ?? FALLBACK_LIMITS[tier]?.writing ?? 5,
        speaking: row.speaking_monthly_limit ?? FALLBACK_LIMITS[tier]?.speaking ?? 0,
        vocabulary: FALLBACK_LIMITS[tier]?.vocabulary ?? 20,
      };
    },
  });
}

/**
 * Hook to fetch user's usage statistics
 * Returns writing/speaking AI usage, vocabulary stats, and test completion counts
 */
export function useUserUsageStats() {
  const { data: user } = useUserProfile();
  // Admin role always gets admin-tier limits regardless of subscription_tier
  const rawTier = (user?.subscription_tier || 'free').toLowerCase();
  const tier = user?.role === 'admin' ? 'admin' : rawTier;

  const { data: dbLimits, isLoading: isLoadingLimits } = useTierLimits(tier);
  const baseLimits =
    dbLimits || FALLBACK_LIMITS[tier] || FALLBACK_LIMITS[rawTier] || FALLBACK_LIMITS.free;

  // Calculate effective limits including referral bonuses
  const bonusActive =
    user?.referral_bonus_expires_at && new Date(user.referral_bonus_expires_at) > new Date();
  const limits = {
    writing: baseLimits.writing + (bonusActive ? user.bonus_writing_credits || 0 : 0),
    speaking: baseLimits.speaking + (bonusActive ? user.bonus_speaking_credits || 0 : 0),
    vocabulary: baseLimits.vocabulary,
    writingBonus: bonusActive ? user.bonus_writing_credits || 0 : 0,
    speakingBonus: bonusActive ? user.bonus_speaking_credits || 0 : 0,
  };

  const query = useQuery({
    queryKey: ['user-usage-counts', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      // Fetch AI usage stats (Writing & Speaking)
      const { data: aiUsage, error: aiError } = await supabase
        .from('ai_api_usage')
        .select('endpoint, cached, request_metadata')
        .eq('user_id', user.id)
        .gte(
          'created_at',
          new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString()
        );

      if (aiError) throw aiError;

      // Fetch Vocabulary stats
      const { count: totalVocab, error: vocabError } = await supabase
        .from('vocabulary_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (vocabError) throw vocabError;

      const { count: masteredVocab } = await supabase
        .from('vocabulary_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('mastery_level', 4);

      // Fetch Test counts
      const { data: testSessions, error: testError } = await supabase
        .from('test_sessions')
        .select('test_type')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (testError) throw testError;

      // Process counts
      const completedUsage = (aiUsage || []).filter(
        (row) => row.request_metadata?.reservationStatus !== 'failed'
      );
      const writingPartReviews = completedUsage.filter(
        (row) => row.endpoint === 'generateDetailedFeedback'
      ).length;
      const writingUsed = getWritingQuotaUsage(writingPartReviews);
      // Must match the DB RPC (check_user_rate_limit) which counts 'processSpeakingSession_start'
      // This counts test STARTS (not report generation) — so abandoned tests still count toward quota
      const speakingUsed =
        completedUsage.filter(
          (row) => row.endpoint === 'processSpeakingSession_start' && row.cached === false
        ).length || 0;

      const testCounts = (testSessions || []).reduce(
        (acc, curr) => {
          const type = curr.test_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {
          reading: 0,
          listening: 0,
          writing: 0,
          speaking: 0,
        }
      );

      return {
        writingUsed,
        speakingUsed,
        totalVocabulary: totalVocab || 0,
        masteredWords: masteredVocab || 0,
        testCounts,
      };
    },
  });

  // Compute final stats by combining usage counts with current limits
  // This part is reactive to dbLimits/limits changes
  const stats = query.data
    ? {
        ai: {
          writing: {
            used: query.data.writingUsed,
            limit: limits.writing,
            bonus: limits.writingBonus,
          },
          speaking: {
            used: query.data.speakingUsed,
            limit: limits.speaking,
            bonus: limits.speakingBonus,
          },
        },
        vocabulary: {
          total: query.data.totalVocabulary,
          mastered: query.data.masteredWords,
          limit: limits.vocabulary,
        },
        tests: query.data.testCounts,
        tier,
      }
    : null;

  return {
    ...query,
    data: stats,
    isLoading: query.isLoading || isLoadingLimits,
  };
}
