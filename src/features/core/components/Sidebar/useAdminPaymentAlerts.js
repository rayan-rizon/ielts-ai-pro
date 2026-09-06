import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const NO_STRIPE_PAYMENTS_SEEN_AT = '1970-01-01T00:00:00.000Z';

function getStoredStripeSeenAt(stripeSeenKey) {
  try {
    return window.localStorage.getItem(stripeSeenKey);
  } catch {
    return null;
  }
}

function storeStripeSeenAt(stripeSeenKey, seenAt) {
  try {
    window.localStorage.setItem(stripeSeenKey, seenAt);
  } catch {
    // Storage can be unavailable in private mode. Keep the in-memory baseline.
  }
}

async function fetchLatestStripePaymentAt() {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('created_at')
    .eq('payment_method', 'stripe')
    .eq('status', 'approved')
    .not('created_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return null;
  return data?.[0]?.created_at || NO_STRIPE_PAYMENTS_SEEN_AT;
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
    let stripeSeenAt = getStoredStripeSeenAt(stripeSeenKey);

    const syncStripeSeenToLatest = async () => {
      const latestStripePaymentAt = await fetchLatestStripePaymentAt();
      if (!mounted || !latestStripePaymentAt) return null;

      stripeSeenAt = latestStripePaymentAt;
      storeStripeSeenAt(stripeSeenKey, latestStripePaymentAt);
      return latestStripePaymentAt;
    };

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

      if (isOnPaymentsTab || !stripeSeenAt) {
        await syncStripeSeenToLatest();
        if (!mounted) return;
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
  }, [isOnPaymentsTab]);

  return {
    pendingCount,
    stripePaymentCount,
    stripeFailureCount,
  };
}
