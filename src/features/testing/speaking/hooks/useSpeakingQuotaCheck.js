import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';

export default function useSpeakingQuotaCheck({ authUser, setShowUpgradeDialog }) {
  return useCallback(async () => {
    if (!authUser?.id) return true;

    try {
      let tier = (authUser.subscription_tier || 'free').toLowerCase();
      if (authUser.role === 'admin') tier = 'admin';

      const { data: quota, error: quotaError } = await supabase.rpc('check_user_rate_limit', {
        p_user_id: authUser.id,
        p_tier: tier,
        p_feature_type: 'speaking',
      });

      if (!quotaError) {
        const result = quota?.[0] || quota;
        if (result && !result.allowed) {
          setShowUpgradeDialog(true);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('Quota check failed:', error);
      return true;
    }
  }, [authUser, setShowUpgradeDialog]);
}
