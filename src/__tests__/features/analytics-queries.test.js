import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('@/lib/supabase', () => ({ supabase: { from } }));

import {
  ANALYTICS_SESSION_PAGE_SIZE,
  fetchSessions,
  getSessionFetchCutoff,
} from '@/features/analytics/hooks/analyticsQueries';

describe('Analytics session query', () => {
  beforeEach(() => from.mockReset());

  it('paginates completed sessions so All time is not silently capped', async () => {
    const firstPage = Array.from({ length: ANALYTICS_SESSION_PAGE_SIZE }, (_, index) => ({
      id: `session-${index}`,
    }));
    const secondPage = [{ id: 'session-1000' }];
    const range = vi
      .fn()
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null });
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      gte: vi.fn(() => query),
      range,
    };
    from.mockReturnValue(query);

    const sessions = await fetchSessions('user-1', 'all');

    expect(sessions).toHaveLength(ANALYTICS_SESSION_PAGE_SIZE + 1);
    expect(range).toHaveBeenNthCalledWith(1, 0, ANALYTICS_SESSION_PAGE_SIZE - 1);
    expect(range).toHaveBeenNthCalledWith(
      2,
      ANALYTICS_SESSION_PAGE_SIZE,
      ANALYTICS_SESSION_PAGE_SIZE * 2 - 1
    );
    expect(query.order).toHaveBeenCalledWith('id', { ascending: false });
    expect(query.gte).not.toHaveBeenCalled();
  });

  it('fetches only the current and comparison windows for bounded timeframes', async () => {
    const range = vi.fn().mockResolvedValue({ data: [{ id: 'session-1' }], error: null });
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      gte: vi.fn(() => query),
      range,
    };
    from.mockReturnValue(query);

    const now = Date.UTC(2026, 7, 8);
    await expect(fetchSessions('user-1', '30d', now)).resolves.toEqual([{ id: 'session-1' }]);
    expect(range).toHaveBeenCalledTimes(1);
    expect(query.gte).toHaveBeenCalledWith('completed_at', getSessionFetchCutoff('30d', now));
  });
});
