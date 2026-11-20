import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getWritingQuotaUsage } from '@/lib/tierLimitsUtils';

const UNLIMITED_WRITING_PARTS = 2147483647;
const LIBRARY_LIMIT_COLUMNS = {
  writing: 'writing_monthly_limit',
  speaking: 'speaking_monthly_limit',
};

function describeProductiveQuota(skill, status) {
  const { monthly_used: used, monthly_remaining: remaining, daily_remaining: daily } = status;
  const convert = skill === 'writing' ? getWritingQuotaUsage : Number;
  const total = used + remaining;
  const unlimited = skill === 'writing' && total === UNLIMITED_WRITING_PARTS;
  return {
    used: convert(used),
    remaining: unlimited ? Infinity : convert(remaining),
    limit: remaining > 0 && !unlimited ? convert(total) : null,
    blocked: status.allowed === false,
    dailyReached: daily <= 0,
  };
}

async function fetchProductiveUsage(skill, user) {
  if (!user?.id) return null;
  const { data, error } = await supabase.rpc('check_user_rate_limit', {
    p_user_id: user.id,
    p_tier: user.subscription_tier || 'free',
    p_feature_type: skill,
  });
  if (error) throw error;
  const status = Array.isArray(data) ? data[0] : data;
  return status ? describeProductiveQuota(skill, status) : null;
}

async function fetchFreeLibraryLimit(skill, user) {
  const { data, error } = await supabase.rpc('get_tier_rate_limits', { p_tier: 'free' });
  if (error) throw error;
  const limits = Array.isArray(data) ? data[0] : data;
  const configuredLimit = Number(limits?.[LIBRARY_LIMIT_COLUMNS[skill]]);
  if (!Number.isFinite(configuredLimit)) return null;
  return addReferralBonus(configuredLimit, skill, user);
}

function addReferralBonus(configuredLimit, skill, user) {
  if (configuredLimit < 0) return Infinity;
  const bonusExpiry = Date.parse(user?.referral_bonus_expires_at || '');
  const bonusKey = skill === 'writing' ? 'bonus_writing_credits' : 'bonus_speaking_credits';
  const bonus = bonusExpiry > Date.now() ? Number(user?.[bonusKey]) || 0 : 0;
  return Math.max(0, configuredLimit + bonus);
}

export function useProductiveAllowanceQueries(skill, user) {
  return useQuery({
    queryKey: [
      'productive-library-allowance',
      skill,
      user?.id,
      user?.referral_bonus_expires_at,
      user?.bonus_writing_credits,
      user?.bonus_speaking_credits,
    ],
    staleTime: 0,
    queryFn: async () => {
      const [usage, libraryLimit] = await Promise.all([
        fetchProductiveUsage(skill, user),
        fetchFreeLibraryLimit(skill, user),
      ]);
      return { usage, libraryLimit };
    },
  });
}

export { describeProductiveQuota };
