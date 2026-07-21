import { describe, expect, it } from 'vitest';
import { shouldAutoCompletePart } from './useSpeakingTimers';

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
  it('waits for an active recording to be cancelled before completing the part', () => {
    expect(shouldAutoCompletePart(timerState({ isListening: true }))).toBe(false);
  });

  it('completes once the expired timer has no active recording or processing', () => {
    expect(shouldAutoCompletePart(timerState())).toBe(true);
  });
});
