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
  communications: 'Communications',
  platform: 'Platform',
};

const VALID_STATUSES = new Set(Object.keys(STATUS_SEVERITY));

const normalizeHours = (hours) => Math.min(Math.max(Number(hours) || 24, 1), 24 * 90);

const assertHealthPayload = (data) => {
  if (!data || !Array.isArray(data.services)) {
    throw new Error('Platform health returned an invalid payload');
  }
  for (const service of data.services) {
    if (!service?.key || !service?.label || !VALID_STATUSES.has(service.status)) {
      throw new Error('Platform health returned an invalid service contract');
    }
  }
};

const normalizeProviderHealth = (data) => {
  const service = data?.service;
  if (!service?.key || !service?.label || !VALID_STATUSES.has(service.status)) {
    throw new Error('AI provider health returned an invalid service contract');
  }
  return service;
};

export const PlatformHealth = {
  /**
   * @param {number} hours lookback window
   * @returns {Promise<{generatedAt: string, windowHours: number, services: Array, activity: Object, summary: Object}>}
   */
  async get(hours = 24) {
    const normalizedHours = normalizeHours(hours);
    const loadProviderHealth = async () => {
      try {
        return await supabase.rpc('get_ai_provider_health', { p_hours: normalizedHours });
      } catch (providerError) {
        return { data: null, error: providerError };
      }
    };
    const [{ data, error }, providerResult] = await Promise.all([
      supabase.rpc('get_platform_health', { p_hours: normalizedHours }),
      loadProviderHealth(),
    ]);
    if (error) throw error;
    assertHealthPayload(data);

    const services = [...(data?.services || [])].sort(
      (a, b) =>
        (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99) ||
        a.label.localeCompare(b.label)
    );

    let providerService;
    if (providerResult?.error) {
      providerService = {
        key: 'ai_text_providers',
        label: 'Text AI Providers',
        category: 'ai',
        provider: 'Provider telemetry unavailable',
        status: 'attention',
        source: 'get_ai_provider_health RPC',
        metrics: { attempts: 0, errors: 0 },
        impact:
          'Provider routing telemetry could not be loaded; verify the latest health migration and admin RPC access.',
      };
    } else {
      providerService = normalizeProviderHealth(providerResult?.data);
    }

    const allServices = [...services, providerService].sort(
      (a, b) =>
        (STATUS_SEVERITY[a.status] ?? 99) - (STATUS_SEVERITY[b.status] ?? 99) ||
        a.label.localeCompare(b.label)
    );
    return { ...data, services: allServices };
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
      p_hours: normalizeHours(hours),
      p_limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
    });
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Platform incidents returned an invalid payload');
    return data;
  },
};
