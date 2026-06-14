import { supabase } from '@/lib/supabase';
import { User } from '@/features/auth/services/User';

// Approximate blended cost per 1K total tokens.
// Total-token telemetry cannot separate input, output, audio, and thinking tokens,
// so dashboard values are estimates rather than invoice-equivalent amounts.
const MODEL_PRICING = {
  'gemini-2.5-flash': 0.001, // Conservative text blend: $0.30 input / $2.50 output per 1M
  'gemini-2.5-flash-lite': 0.0002, // Conservative text blend: $0.10 input / $0.40 output per 1M
  'gemini-2.0-flash': 0.0002,
  'gemini-1.5-flash': 0.0002, // Legacy model
  'gpt-4o': 0.01, // ~$10.00 per 1M tokens (blended)
  'gpt-4o-mini': 0.0003, // ~$0.30 per 1M tokens (blended)
  'claude-3-5-sonnet': 0.015, // ~$15.00 per 1M tokens (blended)
  default: 0.0002,
};

export const AIApiUsage = {
  // Get aggregated usage stats paginated via RPC
  async getUserStatsPaginated({
    page = 1,
    pageSize = 20,
    sortField = 'totalCalls',
    sortDirection = 'desc',
  } = {}) {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) throw new Error('Admin access required');

    const { data, error } = await supabase.rpc('get_ai_usage_stats_paginated', {
      p_page: page,
      p_page_size: pageSize,
      p_sort_field: sortField,
      p_sort_dir: sortDirection,
    });

    if (error) throw error;

    // Transform RPC result to match UI expectations if needed
    // The RPC returns { data: [...], total: N, ... }
    return data;
  },

  // Get top-level aggregates via RPC
  async getUsageAggregates() {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) throw new Error('Admin access required');

    const { data, error } = await supabase.rpc('get_ai_usage_aggs');
    if (error) throw error;

    return {
      totalApiCalls: data.totalApiCalls,
      totalCachedCalls: data.totalCachedCalls,
      totalTokens: data.totalTokens,
      uniqueUsers: data.uniqueUsers,
      totalCost: (data.totalTokens / 1000) * MODEL_PRICING['gemini-2.5-flash'],
    };
  },

  // Get all usage with pagination
  async list({ page = 1, pageSize = 20, orderBy = '-created_at', filters = {} } = {}) {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    let query = supabase.from('ai_api_usage').select(
      `
        *,
        users:user_id (
          id,
          email,
          full_name,
          subscription_tier
        )
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.endpoint) {
      query = query.eq('endpoint', filters.endpoint);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.cached !== undefined) {
      query = query.eq('cached', filters.cached);
    }

    // Apply sorting
    const isAsc = !orderBy.startsWith('-');
    const column = orderBy.replace('-', '');
    query = query.order(column, { ascending: isAsc });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, count };
  },

  // Get usage stats for a specific user
  async getByUser(userId) {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase
      .from('ai_api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get aggregated daily stats
  async getDailyStats(days = 30) {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase.rpc('get_daily_api_usage_stats', {
      p_start_date: startDate.toISOString(),
    });

    // If RPC doesn't exist, fallback to raw query
    if (error?.code === 'PGRST116' || error?.message?.includes('function')) {
      const { data: rawData, error: rawError } = await supabase
        .from('ai_api_usage')
        .select('created_at, endpoint, cached')
        .gte('created_at', startDate.toISOString());

      if (rawError) throw rawError;

      // Aggregate client-side
      const dailyStats = {};
      rawData?.forEach((row) => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { date, total: 0, cached: 0, endpoints: {} };
        }
        dailyStats[date].total++;
        if (row.cached) dailyStats[date].cached++;
        dailyStats[date].endpoints[row.endpoint] =
          (dailyStats[date].endpoints[row.endpoint] || 0) + 1;
      });

      return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    }

    if (error) throw error;
    return data;
  },

  // Get usage summary by user
  async getUserSummary() {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase.from('ai_api_usage').select(`
        user_id,
        users:user_id (
          id,
          email,
          full_name,
          subscription_tier
        )
      `);

    if (error) throw error;

    // Aggregate by user
    const userStats = {};
    data?.forEach((row) => {
      if (!userStats[row.user_id]) {
        userStats[row.user_id] = {
          user: row.users,
          totalCalls: 0,
          todayCalls: 0,
          thisMonthCalls: 0,
        };
      }
      userStats[row.user_id].totalCalls++;
    });

    return Object.values(userStats);
  },

  // Get endpoint breakdown
  async getEndpointStats() {
    const isUserAdmin = await User.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase.from('ai_api_usage').select('endpoint, cached');

    if (error) throw error;

    const endpointStats = {};
    data?.forEach((row) => {
      if (!endpointStats[row.endpoint]) {
        endpointStats[row.endpoint] = { total: 0, cached: 0 };
      }
      endpointStats[row.endpoint].total++;
      if (row.cached) endpointStats[row.endpoint].cached++;
    });

    return Object.entries(endpointStats).map(([endpoint, stats]) => ({
      endpoint,
      ...stats,
      cacheHitRate: stats.total > 0 ? ((stats.cached / stats.total) * 100).toFixed(1) : 0,
    }));
  },
};
