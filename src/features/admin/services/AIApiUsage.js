import { supabase } from '@/lib/supabase';
import { User } from '@/features/auth/services/User';

const asNumber = (value) => Number(value) || 0;

const normalizeDailyStats = (data) =>
  (data || []).map((row) => ({
    date: row.date,
    total: asNumber(row.total),
    completed: asNumber(row.completed ?? row.total),
    pending: asNumber(row.pending),
    failed: asNumber(row.failed),
    cached: asNumber(row.cached),
    tokens: asNumber(row.tokens),
  }));

const normalizeEndpointStats = (data) =>
  (data || []).map((row) => {
    const total = asNumber(row.total);
    const completed = asNumber(row.completed ?? total);
    const cached = asNumber(row.cached);

    return {
      endpoint: row.endpoint || 'Unknown endpoint',
      total,
      completed,
      pending: asNumber(row.pending),
      failed: asNumber(row.failed),
      cached,
      cacheHitRate: completed > 0 ? Number(row.cacheHitRate ?? (cached / completed) * 100) || 0 : 0,
    };
  });

export const AIApiUsage = {
  async getCoachBudgetStatus() {
    const { data, error } = await supabase.rpc('get_ai_coach_budget_status');
    if (error) throw error;
    return data;
  },

  // Get aggregated usage stats paginated via RPC
  async getUserStatsPaginated({
    page = 1,
    pageSize = 20,
    sortField = 'totalCalls',
    sortDirection = 'desc',
  } = {}) {
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
    const { data, error } = await supabase.rpc('get_ai_usage_aggs');
    if (error) throw error;

    return {
      totalRequests: asNumber(data.totalRequests ?? data.totalApiCalls),
      completedCalls: asNumber(data.completedCalls ?? data.totalApiCalls),
      pendingCalls: asNumber(data.pendingCalls),
      failedCalls: asNumber(data.failedCalls),
      totalCachedCalls: asNumber(data.totalCachedCalls),
      totalTokens: asNumber(data.totalTokens),
      uniqueUsers: asNumber(data.uniqueUsers),
      totalUsers: asNumber(data.totalUsers),
      trackedProviderCost: asNumber(data.trackedProviderCost),
      pricedCompletedCalls: asNumber(data.pricedCompletedCalls),
      unpricedCompletedCalls: Object.hasOwn(data, 'trackedProviderCost')
        ? asNumber(data.unpricedCompletedCalls)
        : asNumber(data.completedCalls ?? data.totalApiCalls),
      costTelemetryAvailable: Object.hasOwn(data, 'trackedProviderCost'),
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
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - Math.max(days - 1, 0));

    const { data, error } = await supabase.rpc('get_daily_api_usage_stats', {
      p_start_date: startDate.toISOString(),
    });

    if (error) throw error;
    return normalizeDailyStats(data);
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
  async getEndpointStats(days) {
    const startDate = Number.isFinite(days)
      ? (() => {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - Math.max(days - 1, 0));
          return date.toISOString();
        })()
      : null;
    const { data, error } = await supabase.rpc('get_ai_usage_endpoint_stats', {
      p_start_date: startDate,
    });

    if (error) throw error;
    return normalizeEndpointStats(data);
  },
};
