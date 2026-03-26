import { supabase } from '@/lib/supabase';

export const SystemHealth = {
  /**
   * Check connection latency to Supabase
   * @returns {Promise<number>} latency in ms
   */
  async checkLatency() {
    const start = performance.now();
    try {
      await supabase.from('users').select('count', { count: 'exact', head: true });
      return Math.round(performance.now() - start);
    } catch (error) {
      console.error('Latency check failed:', error);
      return -1;
    }
  },

  /**
   * Fetch system statistics (DB Size, Error Counts) from RPC
   * @returns {Promise<Object>} stats object
   */
  async getStats() {
    try {
      const { data, error } = await supabase.rpc('get_system_stats');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      return null;
    }
  },

  /**
   * Log a system event or error
   * @param {string} level - 'info' | 'warning' | 'error' | 'critical'
   * @param {string} component - Source component
   * @param {string} message - Error message
   * @param {Object} metadata - Additional data
   */
  async log(level, component, message, metadata = {}) {
    try {
      // Don't await this to avoid blocking UI
      supabase
        .from('system_health_logs')
        .insert({
          level,
          component,
          message,
          metadata,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to log to system_health_logs:', error);
        });
    } catch (error) {
      // Silently fail logging to avoid infinite loops
      console.error('Logging system error failed:', error);
    }
  },

  /**
   * Get error history trend
   * @returns {Promise<Array>} List of recent errors
   */
  async getErrorHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('system_health_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch error history:', error);
      return [];
    }
  },
  /**
   * Check AI Service health by probing an edge function
   * @returns {Promise<Object>} health status
   */
  async checkAIServiceHealth() {
    const start = performance.now();
    try {
      // Use the lightest edge function or a simple probe
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generateDetailedFeedback`,
        {
          method: 'OPTIONS', // CORS Preflight - fastest way to check if up
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        }
      );
      return {
        status: response.ok || response.status === 204 ? 'online' : 'degraded',
        latency: Math.round(performance.now() - start),
      };
    } catch (error) {
      return { status: 'offline', latency: -1 };
    }
  },

  /**
   * Check Payment Service (Stripe) integration status
   * Simply checks if server-side settings are responsive
   */
  async checkPaymentServiceHealth() {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      if (error) throw error;
      return { status: 'online' };
    } catch (error) {
      return { status: 'degraded' };
    }
  },
};
