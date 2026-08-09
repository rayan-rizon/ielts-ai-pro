import { supabase } from '@/lib/supabase';

export const AnalyticsService = {
  /**
   * Admin landing-page snapshot: KPIs with prior-period deltas, the activation
   * funnel, the action queue, daily trend and module engagement — one round
   * trip, aggregated in Postgres rather than by pulling every row to the client.
   */
  async getOverview(days = 7) {
    const [overviewResult, actionResult] = await Promise.all([
      supabase.rpc('get_admin_overview_with_signup_sources', { p_days: days }),
      supabase.rpc('get_admin_overview_actions'),
    ]);
    if (overviewResult.error || actionResult.error) {
      const error = overviewResult.error || actionResult.error;
      console.error('Error fetching admin overview:', error);
      throw error;
    }
    return { ...overviewResult.data, actions: actionResult.data || [] };
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
