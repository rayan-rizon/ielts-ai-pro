import { beforeEach, describe, expect, it, vi } from 'vitest';
const { from, rpc } = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { from, rpc } }));
vi.mock('@/features/testing/shared/services/practiceExposure', () => ({
  markPartlyPractised: async (rows) => rows,
}));
import { fetchReadingData } from '@/features/testing/reading/readingDataService';
import { fetchListeningData } from '@/features/testing/listening/listeningDataService';
import {
  computeReadingAccessLock,
  computeReadingProgress,
  buildReadingLinkTarget,
} from '@/features/testing/reading/readingCardHelpers';

describe('Learner latest-session cards', () => {
  beforeEach(() => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      range: vi.fn(async () => ({ data: [{ id: 'passage', total_questions: 20 }], count: 1 })),
    };
    from.mockReset().mockReturnValue(query);
    rpc.mockReset().mockImplementation(async (name) =>
      name === 'get_test_taken_counts'
        ? { data: [] }
        : {
            data: [
              {
                id: 'session',
                passage_id: 'passage',
                is_completed: false,
                completed_questions: 4,
                paired_room_id: 'room',
                content_data: { total_questions: 20, passage_id: 'passage' },
              },
            ],
          }
    );
  });
  it.each([
    ['reading', fetchReadingData],
    ['listening', fetchListeningData],
  ])('%s preserves progress and paired routing without answer payloads', async (type, fetch) => {
    const data = await fetch({ id: 'learner' });
    expect(rpc).toHaveBeenCalledWith('get_learner_latest_sessions', {
      p_user_id: 'learner',
      p_test_type: type,
      p_passage_ids: ['passage'],
    });
    expect(from).not.toHaveBeenCalledWith('test_sessions');
    expect(data.sessions[0].paired_room_id).toBe('room');
    expect(data.sessions[0].completed_questions).toBe(4);
    expect(computeReadingProgress(data.sessions[0], data.passages[0], 20)).toBe(20);
    expect(buildReadingLinkTarget({ isResuming: true, session: data.sessions[0] })).toBe(
      '/reading-test/session'
    );
  });
  it.each([
    ['reading', fetchReadingData],
    ['listening', fetchListeningData],
  ])('%s limits the newest free filter before pagination', async (type, fetch) => {
    const query = from();
    query.range.mockResolvedValueOnce({ data: [{ id: 'recent' }], count: 48 });
    const result = await fetch({ id: 'learner' }, { starterOnly: true, freeLimit: 6 });
    expect(query.eq).toHaveBeenCalledWith('test_type', type);
    expect(query.eq).toHaveBeenCalledWith('access_tier', 'free');
    expect(query.range).toHaveBeenCalledWith(0, 5);
    expect(result.passages).toEqual([{ id: 'recent', free_starter: true }]);
    expect(result.totalCount).toBe(6);
  });

  it.each([
    ['reading', fetchReadingData],
    ['listening', fetchListeningData],
  ])('%s marks older papers as locked in the full catalogue', async (_type, fetch) => {
    const query = from();
    query.range
      .mockResolvedValueOnce({
        data: [
          { id: 'recent', access_tier: 'free' },
          { id: 'older', access_tier: 'free' },
        ],
        count: 2,
      })
      .mockResolvedValueOnce({ data: [{ id: 'recent' }] });

    const { passages } = await fetch({ id: 'learner' }, { freeLimit: 1 });
    expect(query.range).toHaveBeenNthCalledWith(2, 0, 0);
    expect(passages.map((paper) => paper.free_starter)).toEqual([true, false]);
    expect(computeReadingAccessLock(passages[1], { subscription_tier: 'free' })).toBe(true);
    expect(computeReadingAccessLock(passages[1], { subscription_tier: 'pro' })).toBe(false);
  });

  it('surfaces other catalogue errors without dropping the starter-set requirement', async () => {
    const query = from();
    const error = { code: '42501', message: 'permission denied for library_passages' };
    query.range.mockResolvedValueOnce({ error });
    await expect(fetchReadingData({ id: 'learner' })).rejects.toEqual(error);
    expect(query.select).toHaveBeenCalledTimes(1);
  });

  it('surfaces failed session reads rather than incorrectly showing all tests as unattempted', async () => {
    rpc.mockImplementation(async (name) =>
      name === 'get_test_taken_counts' ? { data: [] } : { error: new Error('network') }
    );
    await expect(fetchReadingData({ id: 'learner' })).rejects.toThrow('network');
  });
});
