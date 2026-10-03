import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from },
}));

vi.mock('@/features/auth/services/User', () => ({
  User: { isAdmin: mocks.isAdmin },
}));

import { AIApiUsage } from '@/features/admin/services/AIApiUsage';

describe('AIApiUsage analytics reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdmin.mockResolvedValue(true);
  });

  it('uses only recorded provider cost instead of inventing a token-price total', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: {
        totalRequests: 13,
        completedCalls: 11,
        pendingCalls: 2,
        totalTokens: 500_000,
        totalCachedCalls: 3,
        trackedProviderCost: '0.124',
        pricedCompletedCalls: 4,
        unpricedCompletedCalls: 7,
      },
      error: null,
    });

    await expect(AIApiUsage.getUsageAggregates()).resolves.toMatchObject({
      totalRequests: 13,
      completedCalls: 11,
      pendingCalls: 2,
      totalTokens: 500_000,
      trackedProviderCost: 0.124,
      pricedCompletedCalls: 4,
      unpricedCompletedCalls: 7,
      costTelemetryAvailable: true,
    });
  });

  it('does not describe legacy aggregate output as priced telemetry', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { totalApiCalls: 8, totalTokens: 1200, totalCachedCalls: 1 },
      error: null,
    });

    await expect(AIApiUsage.getUsageAggregates()).resolves.toMatchObject({
      completedCalls: 8,
      trackedProviderCost: 0,
      pricedCompletedCalls: 0,
      unpricedCompletedCalls: 8,
      costTelemetryAvailable: false,
    });
  });

  it('normalizes lifecycle fields returned by the daily analytics RPC', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          date: '2026-07-30',
          total: '9',
          completed: '6',
          pending: '2',
          failed: '1',
          cached: '3',
          tokens: '1200',
        },
      ],
      error: null,
    });

    await expect(AIApiUsage.getDailyStats(7)).resolves.toEqual([
      {
        date: '2026-07-30',
        total: 9,
        completed: 6,
        pending: 2,
        failed: 1,
        cached: 3,
        tokens: 1200,
      },
    ]);
    expect(mocks.rpc).toHaveBeenCalledWith('get_daily_api_usage_stats', {
      p_start_date: expect.any(String),
    });
  });

  it('requests endpoint analytics for the selected reporting window', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          endpoint: 'synthesizeSpeech',
          total: 10,
          completed: 8,
          pending: 2,
          cached: 1,
          cacheHitRate: 12.5,
        },
      ],
      error: null,
    });

    await expect(AIApiUsage.getEndpointStats(30)).resolves.toEqual([
      {
        endpoint: 'synthesizeSpeech',
        total: 10,
        completed: 8,
        pending: 2,
        failed: 0,
        cached: 1,
        cacheHitRate: 12.5,
      },
    ]);
    expect(mocks.rpc).toHaveBeenCalledWith('get_ai_usage_endpoint_stats', {
      p_start_date: expect.any(String),
    });
  });
});

describe('AI admin authorization is enforced by each RPC', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.rpc.mockImplementation((name) =>
      Promise.resolve({
        data: ['get_daily_api_usage_stats', 'get_ai_usage_endpoint_stats'].includes(name) ? [] : {},
        error: null,
      })
    );
  });
  it('does not perform redundant role queries before the five admin analytics RPCs', async () => {
    await AIApiUsage.getUserStatsPaginated({});
    await AIApiUsage.getUsageAggregates();
    await AIApiUsage.getCoachBudgetStatus();
    await AIApiUsage.getDailyStats(30);
    await AIApiUsage.getEndpointStats(30);
    expect(mocks.rpc).toHaveBeenCalledTimes(5);
    expect(mocks.isAdmin).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('propagates RPC denial instead of fetching raw usage as a fallback', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error('Admin access required') });
    await expect(AIApiUsage.getDailyStats(30)).rejects.toThrow('Admin access required');
    await expect(AIApiUsage.getEndpointStats(30)).rejects.toThrow('Admin access required');
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
