import { supabase } from '@/lib/supabase';

/**
 * Per-service platform status.
 *
 * Everything here comes from get_platform_health / get_platform_health_incidents,
 * which derive status from real telemetry (ai_api_usage.request_metadata,
 * payment_requests, stripe_events, passages) rather than from a probe that only
 * proves the network is up.
 */

export const HEALTH_WINDOWS = [
  { label: 'Last 24 hours', hours: 24 },
  { label: 'Last 7 days', hours: 168 },
  { label: 'Last 30 days', hours: 720 },
];

/** Worst-first, so a broken service can never be sorted below a healthy one. */
export const STATUS_SEVERITY = {
  down: 0,
  unconfigured: 1,
  degraded: 2,
  attention: 3,
  operational: 4,
  idle: 5,
};

export const STATUS_LABEL = {
  down: 'Down',
  unconfigured: 'Not configured',
  degraded: 'Degraded',
  attention: 'Needs action',
  operational: 'Operational',
  idle: 'No traffic',
};

export const isFailing = (status) => status === 'down' || status === 'unconfigured';
export const needsAttention = (status) => STATUS_SEVERITY[status] <= STATUS_SEVERITY.attention;

export const CATEGORY_LABEL = {
  ai: 'AI & Speech',
  payments: 'Payments',
  content: 'Test Content',
  platform: 'Platform',
};

export const PlatformHealth = {
  /**
   * @param {number} hours lookback window
   * @returns {Promise<{generatedAt: string, windowHours: number, services: Array, activity: Object, summary: Object}>}
   */
  async get(hours = 24) {
    const { data, error } = await supabase.rpc('get_platform_health', { p_hours: hours });
    if (error) throw error;

    const services = [...(data?.services || [])].sort(
      (a, b) =>
        (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99) ||
        a.label.localeCompare(b.label)
    );

    return { ...data, services };
  },

  /**
   * Release AI quota held by reservations that never finalised.
   *
   * Quota is counted as "rows in ai_api_usage today", so a stranded reservation
   * permanently costs the learner a request. Removing the phantom row is what
   * actually gives the quota back. Always preview first.
   *
   * @param {{ dryRun?: boolean, olderThanMinutes?: number }} opts
   */
  async releaseStuckReservations({ dryRun = true, olderThanMinutes = 60 } = {}) {
    const { data, error } = await supabase.rpc('resolve_stuck_ai_reservations', {
      p_older_than_minutes: olderThanMinutes,
      p_dry_run: dryRun,
    });
    if (error) throw error;
    return data;
  },

  /**
   * The actual provider error strings behind a degraded service.
   */
  async incidents(hours = 24, limit = 50) {
    const { data, error } = await supabase.rpc('get_platform_health_incidents', {
      p_hours: hours,
      p_limit: limit,
    });
    if (error) throw error;
    return data || [];
  },
};
