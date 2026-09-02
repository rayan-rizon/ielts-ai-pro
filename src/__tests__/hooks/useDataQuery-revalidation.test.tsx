import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cache = vi.hoisted(() => new Map<string, unknown>());

vi.mock('@/lib/apiCache', () => ({
  CACHE_TTL: { MEDIUM: 300_000 },
  getFromCache: (key: string) => cache.get(key) ?? null,
  setInCache: (key: string, value: unknown) => cache.set(key, value),
  removeFromCache: (key: string) => cache.delete(key),
}));

import { useDataQuery } from '@/hooks/useDataQuery';

describe('useDataQuery dependency revalidation', () => {
  beforeEach(() => cache.clear());

  it('starts the new-key request while an older key is still revalidating', async () => {
    cache.set('results:a', 'cached-a');
    cache.set('results:b', 'cached-b');
    const first = new Promise<string>(() => {});
    const fetchA = vi.fn(() => first);
    const fetchB = vi.fn().mockResolvedValue('fresh-b');

    const { result, rerender } = renderHook(
      ({ filter }) =>
        useDataQuery(`results:${filter}`, filter === 'a' ? fetchA : fetchB, {
          dependencies: [filter],
        }),
      { initialProps: { filter: 'a' } }
    );

    await waitFor(() => expect(fetchA).toHaveBeenCalledOnce());
    rerender({ filter: 'b' });

    await waitFor(() => expect(fetchB).toHaveBeenCalledOnce());
    await waitFor(() => expect(result.current.data).toBe('fresh-b'));
  });
});
