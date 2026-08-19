import { describe, expect, it } from 'vitest';

import {
  canAutoStartSpeakingAnswer,
  formatRecordingDuration,
  getAutoFinishCountdown,
  getSpeakingCaptureConfig,
} from './speakingCaptureUtils';

describe('speakingCaptureUtils', () => {
  it('gives Part 2 a longer minimum answer and silence window', () => {
    const partOne = getSpeakingCaptureConfig(1);
    const partTwo = getSpeakingCaptureConfig(2);

    expect(partTwo.minimumAnswerMs).toBeGreaterThan(partOne.minimumAnswerMs);
    expect(partTwo.silenceBeforeGraceMs).toBeGreaterThan(partOne.silenceBeforeGraceMs);
    expect(partTwo.noSpeechTimeoutMs).toBeGreaterThan(partOne.noSpeechTimeoutMs);
  });

  it('waits until speech, minimum duration, and a real pause are all present', () => {
    const config = getSpeakingCaptureConfig(1);

    expect(
      getAutoFinishCountdown({
        speechDetected: false,
        elapsedMs: 8000,
        silenceMs: 3000,
        graceStartedAt: null,
        now: 10000,
        config,
      })
    ).toBeNull();

    expect(
      getAutoFinishCountdown({
        speechDetected: true,
        elapsedMs: 2000,
        silenceMs: 3000,
        graceStartedAt: null,
        now: 10000,
        config,
      })
    ).toBeNull();
  });

  it('provides a cancellable grace countdown before auto-finishing', () => {
    const config = getSpeakingCaptureConfig(1);
    const countdown = getAutoFinishCountdown({
      speechDetected: true,
      elapsedMs: 9000,
      silenceMs: 3000,
      graceStartedAt: 10000,
      now: 10500,
      config,
    });

    expect(countdown).toMatchObject({
      startedAt: 10000,
      seconds: 1,
      shouldFinish: false,
    });
  });

  it('finishes after the learner stays silent through the visible grace period', () => {
    const config = getSpeakingCaptureConfig(1);
    const countdown = getAutoFinishCountdown({
      speechDetected: true,
      elapsedMs: 7000,
      silenceMs: 4000,
      graceStartedAt: 10000,
      now: 10000 + config.gracePeriodMs,
      config,
    });

    expect(countdown).toMatchObject({
      seconds: 1,
      shouldFinish: true,
    });
  });

  it('formats recording duration for the streaming UI', () => {
    expect(formatRecordingDuration(0)).toBe('0:00');
    expect(formatRecordingDuration(65000)).toBe('1:05');
  });

  it('auto-starts only after the examiner is finished and the answer state is idle', () => {
    const readyState = {
      requested: true,
      handsFreeEnabled: true,
      testStarted: true,
      isProcessing: false,
      isSpeaking: false,
      isTTSLoading: false,
      isListening: false,
      isPartComplete: false,
      isPart2Prep: false,
      isTestComplete: false,
    };

    expect(canAutoStartSpeakingAnswer(readyState)).toBe(true);
    expect(canAutoStartSpeakingAnswer({ ...readyState, handsFreeEnabled: false })).toBe(false);
    expect(canAutoStartSpeakingAnswer({ ...readyState, isSpeaking: true })).toBe(false);
    expect(canAutoStartSpeakingAnswer({ ...readyState, isProcessing: true })).toBe(false);
    expect(canAutoStartSpeakingAnswer({ ...readyState, isPart2Prep: true })).toBe(false);
  });
});
