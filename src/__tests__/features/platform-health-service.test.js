import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));

import { PlatformHealth } from '@/features/admin/services/PlatformHealth';

describe('PlatformHealth service contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('validates and severity-sorts the persisted service contract', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: {
        contractVersion: 2,
        services: [
          { key: 'database', label: 'Database', status: 'operational' },
          { key: 'speech', label: 'Speech', status: 'degraded' },
        ],
      },
      error: null,
    });
    mocks.rpc.mockResolvedValueOnce({
      data: {
        service: { key: 'ai_text_providers', label: 'Text AI Providers', status: 'operational' },
      },
      error: null,
    });

    const result = await PlatformHealth.get(99999);

    expect(result.services.map((service) => service.key)).toEqual([
      'speech',
      'database',
      'ai_text_providers',
    ]);
    expect(mocks.rpc).toHaveBeenCalledWith('get_platform_health', { p_hours: 2160 }, { get: true });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'get_ai_provider_health',
      { p_hours: 2160 },
      { get: true }
    );
  });

  it('rejects malformed health data instead of rendering a false green state', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { services: [{ status: 'operational' }] },
      error: null,
    });
    mocks.rpc.mockResolvedValueOnce({ data: { service: {} }, error: null });

    await expect(PlatformHealth.get()).rejects.toThrow('invalid service contract');
  });

  it('supports Supabase RPC thenables that do not implement catch', async () => {
    const providerThenable = {
      then(resolve) {
        return Promise.resolve({
          data: {
            service: { key: 'ai_text_providers', label: 'Text AI Providers', status: 'idle' },
          },
          error: null,
        }).then(resolve);
      },
    };
    mocks.rpc
      .mockResolvedValueOnce({
        data: { services: [{ key: 'database', label: 'Database', status: 'operational' }] },
        error: null,
      })
      .mockReturnValueOnce(providerThenable);

    const result = await PlatformHealth.get(24);

    expect(result.services.map((service) => service.key)).toContain('ai_text_providers');
  });

  it('validates incident payloads and bounds the requested limit', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });

    await expect(PlatformHealth.incidents(24, 5000)).resolves.toEqual([]);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'get_platform_health_incidents',
      {
        p_hours: 24,
        p_limit: 200,
      },
      { get: true }
    );
  });

  it('recovers platform health after a transient Supabase transport failure', async () => {
    const transportError = { message: 'FetchError: TypeError: Load failed', code: '' };
    mocks.rpc
      .mockResolvedValueOnce({ data: null, error: transportError })
      .mockResolvedValueOnce({
        data: {
          service: { key: 'ai_text_providers', label: 'Text AI Providers', status: 'operational' },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { services: [{ key: 'database', label: 'Database', status: 'operational' }] },
        error: null,
      });

    await expect(PlatformHealth.get()).resolves.toMatchObject({
      services: expect.arrayContaining([expect.objectContaining({ key: 'database' })]),
    });
  });
});
