import { describe, expect, it } from 'vitest';
import { getCountdownSeconds, shouldAutoCompletePart } from './useSpeakingTimers';

function timerState(overrides = {}) {
  return {
    timeLeft: 0,
    testStarted: true,
    isLoading: false,
    isTestComplete: false,
    isPartComplete: false,
    isProcessingRef: { current: false },
    isSpeaking: false,
    isListening: false,
    conversationRef: { current: [{}, {}, {}] },
    timerExpiredRef: { current: false },
    ...overrides,
  };
}

describe('speaking timer completion', () => {
  it('derives countdown time from the wall clock after a throttled interval', () => {
    expect(getCountdownSeconds(10, 1_000, 4_400)).toBe(7);
    expect(getCountdownSeconds(2, 1_000, 4_400)).toBe(0);
  });

  it('does not consume test time while the speaking session is paused', () => {
    expect(getCountdownSeconds(10, 1_000, 4_400, true)).toBe(10);
  });

  it('waits for an active recording to be cancelled before completing the part', () => {
    expect(shouldAutoCompletePart(timerState({ isListening: true }))).toBe(false);
  });

  it('completes once the expired timer has no active recording or processing', () => {
    expect(shouldAutoCompletePart(timerState())).toBe(true);
  });
});
