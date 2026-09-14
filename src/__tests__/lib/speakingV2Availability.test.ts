import { describe, expect, it, vi } from 'vitest';
import {
  prepareSpeakingTurnState,
  isSpeakingSessionExpired,
  toExpiredSpeakingState,
} from '../../../supabase/functions/_shared/speakingV2Availability';

describe('speaking turn availability', () => {
  it('publishes an explicit expired status for learner-facing session summaries', () => {
    expect(toExpiredSpeakingState({ status: 'paused', revision: 4 })).toEqual({
      status: 'expired',
      revision: 4,
    });
  });
  it('rejects an expired practice window even with active time remaining', () => {
    expect(
      isSpeakingSessionExpired(
        { mode: 'practice', status: 'active', resume_expires_at: '2026-09-02T00:00:00Z' },
        Date.parse('2026-09-14T00:00:00Z')
      )
    ).toBe(true);
  });
  it('resumes a paused practice answer at the same revision before reservation', async () => {
    const state = { mode: 'practice', status: 'paused', revision: 2 };
    const resume = vi.fn().mockResolvedValue({ ...state, status: 'active' });
    await expect(prepareSpeakingTurnState(state, 2, resume)).resolves.toMatchObject({
      status: 'active',
    });
    expect(resume).toHaveBeenCalledOnce();
  });
  it('refreshes the heartbeat before reserving a long recorded answer', async () => {
    const state = { mode: 'practice', status: 'active', revision: 2 };
    const resume = vi.fn().mockResolvedValue(state);
    await prepareSpeakingTurnState(state, 2, resume);
    expect(resume).toHaveBeenCalledOnce();
  });
  it('does not resume expired, finished, exam or stale-question states', async () => {
    for (const state of [
      { mode: 'practice', status: 'expired', revision: 2 },
      { mode: 'practice', status: 'part_complete', revision: 2 },
      { mode: 'exam', status: 'active', revision: 2 },
      { mode: 'practice', status: 'paused', revision: 3 },
    ]) {
      const resume = vi.fn();
      expect(await prepareSpeakingTurnState(state, 2, resume)).toBe(state);
      expect(resume).not.toHaveBeenCalled();
    }
  });
});
