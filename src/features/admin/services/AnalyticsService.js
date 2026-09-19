import { supabase } from '@/lib/supabase';
import { readAdminRpc } from './adminReadRpc';

const getOverviewSnapshot = async (days) => {
  // Mark these reads as GET requests. Besides documenting their idempotency,
  // this enables Supabase's built-in retry support for transient fetch errors.
  const [overviewResult, activeUsersResult, actionResult] = await Promise.all([
    readAdminRpc(supabase, 'get_admin_overview_with_signup_sources', { p_days: days }),
    readAdminRpc(supabase, 'get_admin_active_users', { p_days: days }).catch((error) => {
      // Keep mixed-version local/preview environments usable while the new
      // migration rolls out. The UI deliberately hides legacy sub-metrics and
      // comparisons rather than relabeling rolling data as calendar data.
      if (error?.code === 'PGRST202') return null;
      throw error;
    }),
    readAdminRpc(supabase, 'get_admin_overview_actions'),
  ]);

  const activeUsers = activeUsersResult || {
    value: overviewResult?.kpis?.active?.value ?? overviewResult?.kpis?.active?.wau ?? 0,
    comparisonReady: false,
    comparisonBasis: 'legacy_latest_only',
  };

  return {
    ...overviewResult,
    kpis: {
      ...overviewResult?.kpis,
      active: activeUsers,
    },
    actions: actionResult || [],
  };
};

export const AnalyticsService = {
  /**
   * Admin landing-page snapshot: KPIs with prior-period deltas, the activation
   * funnel, the action queue, daily trend and module engagement — one round
   * trip, aggregated in Postgres rather than by pulling every row to the client.
   */
  async getOverview(days = 7) {
    try {
      return await getOverviewSnapshot(days);
    } catch (error) {
      console.error('Error fetching admin overview:', error);
      throw error;
    }
  },

  /** Range-aware acquisition, activation, and practice metrics for admins. */
  async getUserIntelligence(dateRange = '30d') {
    const { data, error } = await supabase.rpc('get_admin_analytics_intelligence', {
      p_range: dateRange,
    });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }

    return data;
  },

  /** Range-aware settled revenue and renewal-risk metrics for admins. */
  async getRevenueIntelligence(dateRange = '30d') {
    const { data, error } = await supabase.rpc('get_revenue_intelligence', {
      p_range: dateRange,
    });

    if (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }

    return data;
  },
};
