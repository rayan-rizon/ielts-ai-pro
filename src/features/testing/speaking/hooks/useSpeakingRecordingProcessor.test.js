import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAverageBrowserSpeechConfidence,
  recoverSpeakingV2Conflict,
  replacePendingWithAudioRecovery,
  submitSpeakingV2TurnWithConflictRecovery,
} from './useSpeakingRecordingProcessor';

vi.mock('@/utils/api', () => ({
  callEdgeFunction: vi.fn(),
  callEdgeFunctionMultipart: vi.fn(),
}));

import { callEdgeFunction, callEdgeFunctionMultipart } from '@/utils/api';

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

  it('preserves live-recognition confidence objects for transcript recovery', () => {
    expect(
      getAverageBrowserSpeechConfidence([
        { transcript: 'I pay by card', confidence: 0.92 },
        { transcript: 'most of the time', confidence: 0.84 },
      ])
    ).toBeCloseTo(0.88);
  });

  it('retries the captured audio once after reconciling a stale revision', async () => {
    const conflict = Object.assign(new Error('Speaking state conflict'), {
      status: 409,
      state: { part: 1, questionNumber: 2, revision: 9, status: 'active' },
    });
    callEdgeFunctionMultipart
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce({ success: true, userTranscript: 'I usually pay by card.' });

    await expect(
      submitSpeakingV2TurnWithConflictRecovery({
        audioBlob: new Blob(['recorded-audio'.repeat(100)], { type: 'audio/webm' }),
        audioDurationMs: 4200,
        browserTranscript: 'I usually pay by card.',
        sessionId: 'session-1',
        speakingV2State: { revision: 8, status: 'active' },
        speechConfidence: [{ transcript: 'I usually pay by card.', confidence: 0.9 }],
        speechDetected: true,
        pronunciationAudio: null,
      })
    ).resolves.toMatchObject({ success: true });

    expect(callEdgeFunctionMultipart).toHaveBeenCalledTimes(2);
    const firstPayload = callEdgeFunctionMultipart.mock.calls[0][1];
    const retryPayload = callEdgeFunctionMultipart.mock.calls[1][1];
    expect(retryPayload.get('expectedRevision')).toBe('9');
    expect(retryPayload.get('idempotencyKey')).toBe(firstPayload.get('idempotencyKey'));
    expect(JSON.parse(retryPayload.get('browserSpeechHint'))).toMatchObject({
      transcript: 'I usually pay by card.',
      confidence: 0.9,
    });
  });
});
