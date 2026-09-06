import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function getInitialStripeSeenAt(stripeSeenKey) {
  try {
    const storedSeenAt = window.localStorage.getItem(stripeSeenKey);
    if (storedSeenAt) {
      return storedSeenAt;
    }
    const initialSeenAt = new Date().toISOString();
    window.localStorage.setItem(stripeSeenKey, initialSeenAt);
    return initialSeenAt;
  } catch {
    return new Date().toISOString();
  }
}

function subscribeToPaymentChanges(supabaseClient, onUpdate) {
  const hasWebSocketSupport = typeof window !== 'undefined' && Boolean(window.WebSocket);
  if (!hasWebSocketSupport) {
    console.info('WebSockets not available or disabled (AdminSidebar)');
    return null;
  }

  try {
    return supabaseClient
      .channel('payment_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, onUpdate)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime subscription error in AdminSidebar: Connection failed');
        }
      });
  } catch (err) {
    console.warn('Failed to initialize Realtime subscription in AdminSidebar:', err.message);
    return null;
  }
}

export function useAdminPaymentAlerts({ isOnPaymentsTab, stripeSeenKey }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [stripePaymentCount, setStripePaymentCount] = useState(0);
  const [stripeFailureCount, setStripeFailureCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const stripeSeenAt = getInitialStripeSeenAt(stripeSeenKey);

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const shouldSkip = !mounted || Boolean(error);
      if (shouldSkip) return;
      if (isOnPaymentsTab) return;

      setPendingCount(count || 0);
    };

    const fetchStripePaymentCount = async () => {
      if (!mounted) return;

      if (isOnPaymentsTab) {
        setStripePaymentCount(0);
        return;
      }

      const { count, error } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('payment_method', 'stripe')
        .eq('status', 'approved')
        .gt('created_at', stripeSeenAt);

      if (!mounted) return;
      if (error) return;

      setStripePaymentCount(count || 0);
    };

    const fetchStripeFailureCount = async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('payment_failed_at', 'is', null);

      if (!mounted) return;
      if (error) return;

      setStripeFailureCount(count || 0);
    };

    const refreshAllCounts = () => {
      fetchPendingCount();
      fetchStripePaymentCount();
      fetchStripeFailureCount();
    };

    refreshAllCounts();
    const stripeFailureRefresh = window.setInterval(fetchStripeFailureCount, 60_000);
    const channel = subscribeToPaymentChanges(supabase, refreshAllCounts);

    return () => {
      mounted = false;
      window.clearInterval(stripeFailureRefresh);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOnPaymentsTab, stripeSeenKey]);

  useEffect(() => {
    if (!isOnPaymentsTab) return;

    setPendingCount(0);
    setStripePaymentCount(0);
    try {
      window.localStorage.setItem(stripeSeenKey, new Date().toISOString());
    } catch {
      // Storage can be unavailable in private mode.
    }
  }, [isOnPaymentsTab, stripeSeenKey]);

  return {
    pendingCount,
    stripePaymentCount,
    stripeFailureCount,
  };
}
