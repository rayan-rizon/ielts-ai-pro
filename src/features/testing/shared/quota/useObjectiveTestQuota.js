import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { summariseObjectiveQuota } from './objectiveQuota';

export const OBJECTIVE_QUOTA_QUERY_KEY = 'objective-test-quotas';

/** Shared by the usage stats, the library strip, the start gate and the paywall. */
export const objectiveQuotaQuery = (userId) => ({
  queryKey: [OBJECTIVE_QUOTA_QUERY_KEY, userId],
  enabled: !!userId,
  staleTime: 30 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase.rpc('get_objective_test_quotas');
    if (error) throw error;
    return data;
  },
});

/**
 * The signed-in learner's free-start allowance for one test type.
 * Never blocks on loading or on a failed read: the server still enforces the
 * limit when a test starts, so an unknown allowance behaves like no allowance.
 */
export function useObjectiveTestQuota(type) {
  const { data: user } = useUserProfile();
  const query = useQuery(objectiveQuotaQuery(user?.id));
  const raw = query.data?.[type];
  const summary = useMemo(() => summariseObjectiveQuota(raw), [raw]);
  return { ...summary, isLoading: query.isLoading, raw };
}

/**
 * Lets a locked card in the library open the paywall that the page renders
 * once, instead of every card owning its own dialog.
 */
export const useQuotaPaywallStore = create((set) => ({
  open: null,
  openPaywall: (testType, testTitle = '') => set({ open: { testType, testTitle } }),
  closePaywall: () => set({ open: null }),
}));

/**
 * Library cards: whether a *new* start (a fresh test or a retake) is blocked,
 * and a handler that opens the paywall instead. Resuming and viewing results
 * never consume an allowance, so those buttons ignore this.
 */
export function useQuotaLock(testType) {
  const { exhausted } = useObjectiveTestQuota(testType);
  const openPaywall = useQuotaPaywallStore((state) => state.openPaywall);
  return {
    locked: exhausted,
    open: (testTitle) => openPaywall(testType, testTitle),
  };
}
