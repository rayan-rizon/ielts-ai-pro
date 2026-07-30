import { supabase } from '@/lib/supabase';

export const AnalyticsService = {
  /**
   * Admin landing-page snapshot: KPIs with prior-period deltas, the activation
   * funnel, the action queue, daily trend and module engagement — one round
   * trip, aggregated in Postgres rather than by pulling every row to the client.
   */
  async getOverview(days = 7) {
    const { data, error } = await supabase.rpc('get_admin_overview', { p_days: days });
    if (error) {
      console.error('Error fetching admin overview:', error);
      throw error;
    }
    return data;
  },

  /**
   * Get aggregated stats for the admin dashboard.
   * Calls the 'get_admin_dashboard_stats' RPC.
   */
  async getDashboardStats(dateRange = '30d') {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
      p_date_range: dateRange,
    });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get revenue analytics from actual billing data.
   * Calls the 'get_revenue_analytics' RPC.
   */
  async getRevenueAnalytics() {
    const { data, error } = await supabase.rpc('get_revenue_analytics');

    if (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }

    return data;
  },
};
