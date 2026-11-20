import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getWritingQuotaUsage } from '@/lib/tierLimitsUtils';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';

const UNLIMITED_WRITING_PARTS = 2147483647;

export function describeProductiveQuota(skill, status) {
  const { monthly_used: used, monthly_remaining: remaining, daily_remaining: daily } = status;
  const convert = skill === 'writing' ? getWritingQuotaUsage : Number;
  const total = used + remaining;
  const unlimited = skill === 'writing' && total === UNLIMITED_WRITING_PARTS;
  return {
    used: convert(used),
    remaining: unlimited ? Infinity : convert(remaining),
    // The RPC clamps remaining to zero. After a downgrade, used can exceed the
    // new allowance, so it cannot be used as the denominator at that point.
    limit: remaining > 0 && !unlimited ? convert(total) : null,
    blocked: status.allowed === false,
    dailyReached: daily <= 0,
  };
}

export function useProductiveAllowance(skill, user, isAdmin) {
  const userId = user?.id;
  const { data } = useQuery({
    queryKey: ['productive-library-allowance', skill, userId],
    enabled: Boolean(userId),
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_user_rate_limit', {
        p_user_id: userId,
        p_tier: user.subscription_tier || 'free',
        p_feature_type: skill,
      });
      if (error) throw error;
      const status = Array.isArray(data) ? data[0] : data;
      return status ? describeProductiveQuota(skill, status) : null;
    },
  });
  return { usage: data, canUpgrade: !isAdmin && !hasPaidAccess(user) };
}

export function markAllowanceUpgrade(tests, allowance) {
  if (!allowance.canUpgrade || !allowance.usage?.blocked) return tests;
  return tests.map((test) => ({ ...test, upgradeForAllowance: true }));
}
