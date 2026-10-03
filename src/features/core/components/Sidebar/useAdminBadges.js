import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createAdminBadgeController, EMPTY_BADGE_COUNTS } from './adminBadgeController';

export function useAdminBadges({ adminId, isOnPaymentsTab }) {
  const [state, setState] = useState({ adminId, counts: EMPTY_BADGE_COUNTS });
  const controller = useRef(null);
  const paymentsOpen = useRef(isOnPaymentsTab);
  paymentsOpen.current = isOnPaymentsTab;

  useEffect(() => {
    if (!adminId) return;
    const instance = createAdminBadgeController({
      client: supabase,
      onChange: (counts) => setState({ adminId, counts }),
    });
    controller.current = instance;
    instance.setPaymentsOpen(paymentsOpen.current);
    instance.start();
    return () => {
      instance.stop();
      controller.current = null;
    };
  }, [adminId]);

  useEffect(() => {
    controller.current?.setPaymentsOpen(isOnPaymentsTab);
  }, [isOnPaymentsTab]);

  // Never display one administrator's cached counts for another account.
  return state.adminId === adminId ? state.counts : EMPTY_BADGE_COUNTS;
}
