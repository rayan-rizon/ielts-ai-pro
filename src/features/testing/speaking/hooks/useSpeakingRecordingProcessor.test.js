import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  recoverSpeakingV2Conflict,
  replacePendingWithAudioRecovery,
} from './useSpeakingRecordingProcessor';

vi.mock('@/utils/api', () => ({
  callEdgeFunction: vi.fn(),
  callEdgeFunctionMultipart: vi.fn(),
}));

import { callEdgeFunction } from '@/utils/api';

describe('speaking audio recovery message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces a pending transcript without stacking duplicate examiner warnings', () => {
    const first = replacePendingWithAudioRecovery([
      { speaker: 'ai', text: 'When do you usually read?' },
      { speaker: 'user', text: '', isLoading: true },
    ]);
    const second = replacePendingWithAudioRecovery([
      ...first,
      { speaker: 'user', text: '', isLoading: true },
    ]);

    expect(second).toEqual(first);
    expect(second.filter((entry) => entry.code === 'audio-capture-recovery')).toHaveLength(1);
  });

  it('reconciles a stale turn with the authoritative speaking state', async () => {
    callEdgeFunction.mockResolvedValueOnce({
      state: { part: 2, questionNumber: 1, revision: 9, status: 'active' },
    });

    await expect(
      recoverSpeakingV2Conflict({
        error: Object.assign(new Error('Speaking state conflict'), { status: 409 }),
        sessionId: 'session-1',
      })
    ).resolves.toMatchObject({ revision: 9, status: 'active' });
    expect(callEdgeFunction).toHaveBeenCalledWith('processSpeakingSessionV2', {
      action: 'resume',
      sessionId: 'session-1',
    });
  });

  it('uses conflict state directly when the server returned it', async () => {
    const state = { part: 2, questionNumber: 1, revision: 10, status: 'active' };
    await expect(
      recoverSpeakingV2Conflict({
        error: Object.assign(new Error('Speaking state conflict'), { status: 409, state }),
        sessionId: 'session-1',
      })
    ).resolves.toBe(state);
    expect(callEdgeFunction).not.toHaveBeenCalled();
  });
});
