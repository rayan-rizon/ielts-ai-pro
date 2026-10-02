import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  load: vi.fn(),
  scoringEnabled: vi.fn(() => false),
  invalidate: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/lib/queryClient', () => ({ queryClient: { invalidateQueries: mocks.invalidate } }));
vi.mock('@/features/testing/shared/services/objectiveTests', () => ({
  objectiveRequest: mocks.load,
  serverScoringEnabled: mocks.scoringEnabled,
}));

import {
  createTestSession,
  getObjectiveStartErrorMessage,
  ObjectiveTestQuotaError,
} from '@/lib/testInitializer';

describe('solo objective test start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.scoringEnabled.mockReturnValue(false);
  });

  it('starts Reading through the server quota boundary and invalidates usage', async () => {
    mocks.rpc.mockResolvedValue({ data: { session: { id: 'session-1' } }, error: null });
    const session = await createTestSession({
      passageId: 'passage-1',
      type: 'reading',
      testMode: 'exam',
      durationSeconds: 3600,
    });
    expect(session.id).toBe('session-1');
    expect(mocks.rpc).toHaveBeenCalledWith(
      'start_objective_test',
      expect.objectContaining({
        p_passage_id: 'passage-1',
        p_test_type: 'reading',
        p_test_mode: 'exam',
      })
    );
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['objective-test-quotas'] });
  });

  it('passes Listening timing data to the same boundary', async () => {
    mocks.rpc.mockResolvedValue({ data: { session: { id: 'session-2' } }, error: null });
    await createTestSession({
      passageId: 'passage-2',
      type: 'listening',
      testMode: 'exam',
      durationSeconds: 2400,
      audioDurations: [600, 580, 600, 500],
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'start_objective_test',
      expect.objectContaining({
        p_test_type: 'listening',
        p_audio_durations: [600, 580, 600, 500],
      })
    );
  });

  it('rejects invalid Listening exam timing before calling the server', async () => {
    for (const audioDurations of [[NaN, NaN, NaN, NaN], [600, 0, 600, 500], []]) {
      await expect(
        createTestSession({
          passageId: 'passage-2',
          type: 'listening',
          testMode: 'exam',
          durationSeconds: 2400,
          audioDurations,
        })
      ).rejects.toThrow(/timing/);
    }
    await expect(
      createTestSession({
        passageId: 'passage-2',
        type: 'listening',
        testMode: 'exam',
        durationSeconds: NaN,
        audioDurations: [600, 580, 600, 500],
      })
    ).rejects.toThrow(/timing/);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('reports a quota denial with the server reset time', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        error: 'quota_exceeded',
        quota: {
          daily_limit: 1,
          daily_used: 1,
          monthly_limit: 10,
          monthly_used: 1,
          daily_reset_at: '2026-09-24T00:00:00Z',
        },
      },
      error: null,
    });
    await expect(
      createTestSession({ passageId: 'passage-1', type: 'reading' })
    ).rejects.toBeInstanceOf(ObjectiveTestQuotaError);
    try {
      await createTestSession({ passageId: 'passage-1', type: 'reading' });
    } catch (error) {
      expect(getObjectiveStartErrorMessage(error, 'reading')).toContain('free reading test limit');
      expect(getObjectiveStartErrorMessage(error, 'reading')).toContain('upgrade');
    }
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('uses the monthly reset when both limits are exhausted', () => {
    const message = getObjectiveStartErrorMessage(
      new ObjectiveTestQuotaError({
        daily_limit: 1,
        daily_used: 1,
        monthly_limit: 1,
        monthly_used: 1,
        daily_reset_at: '2026-09-24T00:00:00Z',
        monthly_reset_at: '2026-10-01T00:00:00Z',
      }),
      'reading'
    );
    expect(message).toContain('Oct 1');
    expect(message).not.toContain('Sep 24');
  });

  it('returns the created session if scoring initialization temporarily fails', async () => {
    mocks.scoringEnabled.mockReturnValue(true);
    mocks.rpc.mockResolvedValue({ data: { session: { id: 'session-3' } }, error: null });
    mocks.load.mockRejectedValue(new Error('Temporary scoring outage'));
    const session = await createTestSession({ passageId: 'passage-1', type: 'reading' });
    expect(session.id).toBe('session-3');
    expect(mocks.load).toHaveBeenCalledWith('load', { sessionId: 'session-3' });
  });
});
