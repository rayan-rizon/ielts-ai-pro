import { beforeEach, describe, expect, it, vi } from 'vitest';
const { from, rpc } = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { from, rpc } }));
vi.mock('@/features/testing/shared/services/objectiveTests', () => ({
  serverScoringEnabled: () => true,
}));
vi.mock('@/features/testing/shared/services/practiceExposure', () => ({
  markPartlyPractised: async (rows) => rows,
}));
import { fetchReadingData } from '@/features/testing/reading/readingDataService';
import { fetchListeningData } from '@/features/testing/listening/listeningDataService';
import {
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
  it('surfaces failed session reads rather than incorrectly showing all tests as unattempted', async () => {
    rpc.mockImplementation(async (name) =>
      name === 'get_test_taken_counts' ? { data: [] } : { error: new Error('network') }
    );
    await expect(fetchReadingData({ id: 'learner' })).rejects.toThrow('network');
  });
});
