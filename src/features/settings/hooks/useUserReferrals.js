import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { queryKeys } from '@/lib/queryClient';

/**
 * Hook to fetch user's referral stats and manage referral actions
 */
export function useUserReferrals() {
  const { data: user } = useUserProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-referral-stats', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('get_user_referral_stats', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
  });

  const claimRewardsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('claim_referral_rewards', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-referral-stats'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });

  return {
    ...query,
    claimRewards: claimRewardsMutation.mutate,
    isClaiming: claimRewardsMutation.isPending,
    claimError: claimRewardsMutation.error,
  };
}

/**
 * Hook to fetch all available referral tiers
 */
export function useReferralTiers() {
  return useQuery({
    queryKey: ['referral-tiers'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_reward_tiers')
        .select('*')
        .eq('is_active', true)
        .order('referrals_required', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
