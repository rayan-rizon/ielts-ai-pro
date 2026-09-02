import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));

import { AnalyticsService } from '@/features/admin/services/AnalyticsService';

const overview = { kpis: { signups: { value: 12 } } };
const actions = [{ key: 'pending-payment' }];

describe('AnalyticsService.getOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('uses retryable GET RPCs for the read-only overview snapshot', async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: overview, error: null })
      .mockResolvedValueOnce({ data: actions, error: null });

    await expect(AnalyticsService.getOverview(30)).resolves.toEqual({ ...overview, actions });

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      'get_admin_overview_with_signup_sources',
      { p_days: 30 },
      { get: true }
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'get_admin_overview_actions', undefined, {
      get: true,
    });
  });

  it('recovers from a transient Supabase transport failure', async () => {
    const transportError = { message: 'FetchError: TypeError: Load failed', code: '' };
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: transportError })
      .mockResolvedValueOnce({ data: actions, error: null })
      .mockResolvedValueOnce({ data: overview, error: null })
      .mockResolvedValueOnce({ data: actions, error: null });

    await expect(AnalyticsService.getOverview()).resolves.toEqual({ ...overview, actions });
    // The successful action-queue read is retained; only the failed overview
    // read is retried.
    expect(mocks.rpc).toHaveBeenCalledTimes(3);
  });

  it('does not retry a real RPC error', async () => {
    const accessError = { message: 'Access denied', code: 'P0001' };
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: accessError })
      .mockResolvedValueOnce({ data: actions, error: null });

    await expect(AnalyticsService.getOverview()).rejects.toBe(accessError);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
});
