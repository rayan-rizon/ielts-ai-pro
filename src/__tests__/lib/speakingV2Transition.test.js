import { describe, expect, it, vi } from 'vitest';

import { createSpeakingPartTransitionGuard } from '@/features/testing/speaking/utils/speakingPartTransitionGuard';
import { advanceSpeakingV2Part } from '@/features/testing/speaking/utils/speakingV2Transition';

describe('advanceSpeakingV2Part', () => {
  it('coalesces repeated part-advance intents until the first request settles', () => {
    const guard = createSpeakingPartTransitionGuard();

    expect(guard.acquire()).toBe(true);
    expect(guard.acquire()).toBe(false);
    guard.release();
    expect(guard.acquire()).toBe(true);
  });

  it('recovers a duplicate or stale transition request when the server already advanced', async () => {
    const callEdgeFunction = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Speaking state conflict'), { status: 409 }))
      .mockResolvedValueOnce({ state: { part: 2, revision: 8, status: 'active' } });

    await expect(
      advanceSpeakingV2Part({
        callEdgeFunction,
        sessionId: 'session-1',
        expectedRevision: 7,
        currentPartNumber: 1,
      })
    ).resolves.toEqual({ state: { part: 2, revision: 8, status: 'active' } });

    expect(callEdgeFunction).toHaveBeenNthCalledWith(1, 'processSpeakingSessionV2', {
      action: 'advance_part',
      sessionId: 'session-1',
      expectedRevision: 7,
    });
    expect(callEdgeFunction).toHaveBeenNthCalledWith(2, 'processSpeakingSessionV2', {
      action: 'resume',
      sessionId: 'session-1',
    });
  });

  it('uses authoritative conflict state without an extra resume request', async () => {
    const conflict = Object.assign(new Error('Speaking state conflict'), {
      status: 409,
      state: { part: 2, revision: 8, status: 'active' },
    });
    const callEdgeFunction = vi.fn().mockRejectedValueOnce(conflict);

    await expect(
      advanceSpeakingV2Part({
        callEdgeFunction,
        sessionId: 'session-1',
        expectedRevision: 7,
        currentPartNumber: 1,
      })
    ).resolves.toEqual({ state: conflict.state });
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);
  });

  it('retries once with the authoritative revision when the part is still complete', async () => {
    const callEdgeFunction = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('Speaking state conflict'), { status: 409 }))
      .mockResolvedValueOnce({ state: { part: 1, revision: 9, status: 'part_complete' } })
      .mockResolvedValueOnce({ state: { part: 2, revision: 10, status: 'active' } });

    await expect(
      advanceSpeakingV2Part({
        callEdgeFunction,
        sessionId: 'session-1',
        expectedRevision: 7,
        currentPartNumber: 1,
      })
    ).resolves.toEqual({ state: { part: 2, revision: 10, status: 'active' } });
    expect(callEdgeFunction).toHaveBeenNthCalledWith(3, 'processSpeakingSessionV2', {
      action: 'advance_part',
      sessionId: 'session-1',
      expectedRevision: 9,
    });
  });
});
