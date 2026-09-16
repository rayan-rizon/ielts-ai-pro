import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const NO_PAYMENTS_SEEN_AT = '1970-01-01T00:00:00.000Z';
const REFRESH_INTERVAL_MS = 60_000;
const EMPTY_COUNTS = { pendingCount: 0, stripePaymentCount: 0, stripeFailureCount: 0 };

/**
 * The "seen at" marker belongs to the admin, not to the browser: dismissing an
 * alert on a laptop has to dismiss it on the phone too. It lives in the
 * database behind two SECURITY DEFINER functions keyed on auth.uid().
 */
async function fetchSeenAt() {
  const { data, error } = await supabase.rpc('get_admin_payment_alert_seen_at');
  if (error || !data) return null;
  return data;
}

async function markSeen() {
  const { data, error } = await supabase.rpc('mark_admin_payment_alerts_seen');
  if (error || !data) return null;
  return data;
}

/**
 * Fallback baseline for a database where the marker migration has not been
 * applied yet: treat everything that already exists as seen for this session
 * rather than flashing a badge for historical payments.
 */
async function fetchLatestPaymentAt() {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('created_at')
    .not('created_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return null;
  return data?.[0]?.created_at || NO_PAYMENTS_SEEN_AT;
}

async function countPendingApprovals(seenAt) {
  const { count, error } = await supabase
    .from('payment_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gt('created_at', seenAt);

  if (error) return null;
  return count || 0;
}

async function countNewStripePayments(seenAt) {
  const { count, error } = await supabase
    .from('payment_requests')
    .select('*', { count: 'exact', head: true })
    .eq('payment_method', 'stripe')
    .eq('status', 'approved')
    .gt('created_at', seenAt);

  if (error) return null;
  return count || 0;
}

async function countNewStripeFailures(seenAt) {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('payment_failed_at', 'is', null)
    .gt('payment_failed_at', seenAt);

  if (error) return null;
  return count || 0;
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

export function useAdminPaymentAlerts({ isOnPaymentsTab }) {
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  useEffect(() => {
    let mounted = true;
    let sessionBaseline = null;

    /**
     * Re-read the marker on every pass so a dismissal made in another browser
     * clears this one too, without needing its own realtime channel.
     */
    const resolveSeenAt = async () => {
      const seenAt = isOnPaymentsTab ? await markSeen() : await fetchSeenAt();
      if (seenAt) return seenAt;

      if (!sessionBaseline) {
        sessionBaseline = await fetchLatestPaymentAt();
      }
      return sessionBaseline;
    };

    const refresh = async () => {
      const seenAt = await resolveSeenAt();
      if (!mounted) return;

      // Opening the Payments tab is the dismissal: nothing is new any more.
      if (isOnPaymentsTab || !seenAt) {
        setCounts(EMPTY_COUNTS);
        return;
      }

      const [pendingCount, stripePaymentCount, stripeFailureCount] = await Promise.all([
        countPendingApprovals(seenAt),
        countNewStripePayments(seenAt),
        countNewStripeFailures(seenAt),
      ]);

      if (!mounted) return;

      // A failed query keeps the previous number rather than inventing a zero.
      setCounts((previous) => ({
        pendingCount: pendingCount ?? previous.pendingCount,
        stripePaymentCount: stripePaymentCount ?? previous.stripePaymentCount,
        stripeFailureCount: stripeFailureCount ?? previous.stripeFailureCount,
      }));
    };

    if (isOnPaymentsTab) setCounts(EMPTY_COUNTS);

    refresh();
    const refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const channel = subscribeToPaymentChanges(supabase, refresh);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOnPaymentsTab]);

  return counts;
}
