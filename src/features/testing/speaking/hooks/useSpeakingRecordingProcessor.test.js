import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import useSpeakingRecordingProcessor, {
  getAverageBrowserSpeechConfidence,
  recoverSpeakingV2Conflict,
  submitSpeakingV2TurnWithConflictRecovery,
} from './useSpeakingRecordingProcessor';

vi.mock('@/utils/api', () => ({
  callEdgeFunction: vi.fn(),
  callEdgeFunctionMultipart: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

import { callEdgeFunction, callEdgeFunctionMultipart } from '@/utils/api';

describe('speaking audio recovery message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the current question and skips upload when only background noise was captured', async () => {
    const setConversation = vi.fn();
    const requestAutoStart = vi.fn();
    const { result } = renderHook(() =>
      useSpeakingRecordingProcessor({ setConversation, requestAutoStart })
    );
    await result.current(new Blob([new Uint8Array(4096)]), {
      duration: 12000,
      speechDetected: false,
      liveTranscript: 'Thank you.',
      stopReason: 'no-speech-timeout',
    });
    const question = { speaker: 'ai', text: 'When do you usually read?' };
    expect(
      setConversation.mock.calls[0][0]([question, { speaker: 'user', text: '', isLoading: true }])
    ).toEqual([question]);
    expect(toast.info).toHaveBeenCalledWith('No speech detected', expect.any(Object));
    expect(callEdgeFunctionMultipart).not.toHaveBeenCalled();
    expect(requestAutoStart).not.toHaveBeenCalled();
  });

  it('keeps a service failure distinct from an unheard answer', async () => {
    const requestAutoStart = vi.fn();
    const speakAiMessageFromLoadingState = vi.fn();
    const { result } = renderHook(() =>
      useSpeakingRecordingProcessor({
        allParts: {},
        acousticMetricsRef: { current: {} },
        questionIndexRef: { current: 0 },
        currentPartNumber: 1,
        session: { id: 'session-1' },
        speakingV2State: { revision: 1, status: 'active' },
        setConversation: vi.fn(),
        setIsProcessing: vi.fn(),
        setProcessingStatus: vi.fn(),
        requestAutoStart,
        speakAiMessageFromLoadingState,
        useSpeakingV2: true,
      })
    );
    callEdgeFunctionMultipart.mockRejectedValueOnce(
      Object.assign(new Error('Service unavailable'), { status: 503 })
    );
    await result.current(new Blob([new Uint8Array(4096)], { type: 'audio/webm' }), {
      duration: 2000,
      speechDetected: true,
    });

    expect(callEdgeFunctionMultipart).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledWith('Could not process your answer', expect.any(Object));
    expect(toast.info).not.toHaveBeenCalled();
    expect(speakAiMessageFromLoadingState).not.toHaveBeenCalled();
    expect(requestAutoStart).not.toHaveBeenCalled();
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

  it('does not resubmit an answer when finalization reports a terminal conflict', async () => {
    const conflict = Object.assign(new Error('Turn no longer active'), {
      status: 409,
      retryable: false,
      code: 'speaking_turn_inactive',
      state: { part: 1, questionNumber: 2, revision: 9, status: 'active' },
    });
    callEdgeFunctionMultipart.mockRejectedValueOnce(conflict);
    await expect(
      submitSpeakingV2TurnWithConflictRecovery({
        audioBlob: new Blob(['audio']),
        sessionId: 'session-1',
        speakingV2State: { revision: 8, status: 'active' },
      })
    ).rejects.toBe(conflict);
    expect(callEdgeFunctionMultipart).toHaveBeenCalledTimes(1);
    expect(callEdgeFunction).not.toHaveBeenCalled();
  });

  it('stops after one recovery attempt if the revision keeps conflicting', async () => {
    const conflict = Object.assign(new Error('Revision conflict'), {
      status: 409,
      state: { revision: 9, status: 'active' },
    });
    callEdgeFunctionMultipart.mockRejectedValue(conflict);
    await expect(
      submitSpeakingV2TurnWithConflictRecovery({
        audioBlob: new Blob(['audio']),
        sessionId: 'session-1',
        speakingV2State: { revision: 8, status: 'active' },
      })
    ).rejects.toBe(conflict);
    expect(callEdgeFunctionMultipart).toHaveBeenCalledTimes(2);
  });
});
