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

  it('reports a quota denial with the free total the server counted', async () => {
    mocks.rpc.mockResolvedValue({
      data: { error: 'quota_exceeded', quota: { limit: 5, used: 5 } },
      error: null,
    });
    await expect(
      createTestSession({ passageId: 'passage-1', type: 'reading' })
    ).rejects.toBeInstanceOf(ObjectiveTestQuotaError);
    try {
      await createTestSession({ passageId: 'passage-1', type: 'reading' });
    } catch (error) {
      expect(error.quota).toEqual({ limit: 5, used: 5 });
      const message = getObjectiveStartErrorMessage(error, 'reading');
      expect(message).toContain('all 5 of your free reading tests');
      expect(message).toContain('Upgrade');
    }
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('words the denial plainly when the plan has no free tests at all', () => {
    const message = getObjectiveStartErrorMessage(
      new ObjectiveTestQuotaError({ limit: 0, used: 0 }),
      'listening'
    );
    expect(message).toBe("You've used your free listening tests. Upgrade for unlimited tests.");
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
