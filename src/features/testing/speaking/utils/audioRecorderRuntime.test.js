import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_VOICE_THRESHOLD,
  MIN_VOICE_THRESHOLD,
  startRecorderCapture,
  stopRecorderCapture,
  __testing,
} from './audioRecorderRuntime';
import { getSpeakingCaptureConfig } from './speakingCaptureUtils';

let recognition;

class FakeSpeechRecognition {
  start() {
    recognition = this;
  }

  stop() {}
}

class FakeMediaRecorder {
  static isTypeSupported() {
    return true;
  }

  constructor(_stream, options) {
    this.mimeType = options.mimeType;
    this.state = 'inactive';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([new Uint8Array(6000)]) });
    this.onstop?.();
  }
}

function ref(value) {
  return { current: value };
}

function buildRuntime(processRecording) {
  return {
    processRecording,
    refs: {
      mediaRecorder: ref(null),
      audioChunks: ref([]),
      stream: ref(null),
      maxRecordingTimer: ref(null),
      startTime: ref(0),
      discardRecording: ref(false),
      stopReason: ref('manual'),
      speechRecognition: ref(null),
      recognitionRestartTimer: ref(null),
      recognitionBaseTranscript: ref(''),
      recognitionSessionFinal: ref(''),
      speechConfidence: ref([]),
      liveTranscript: ref(''),
      audioContext: ref(null),
      analyser: ref(null),
      analyserSource: ref(null),
      analyserReady: ref(false),
      analysisTimer: ref(null),
      silenceMonitor: ref(null),
      noiseFloor: ref(MIN_VOICE_THRESHOLD / 2),
      noiseWindow: ref([]),
      voiceFrames: ref(0),
      speechDetected: ref(false),
      lastVoiceAt: ref(0),
      graceStartedAt: ref(null),
      captureConfig: ref(getSpeakingCaptureConfig(1)),
      smartFinishEnabled: ref(true),
      autoSubmitPaused: ref(false),
      isListening: ref(false),
      isRecording: ref(false),
      isProcessing: ref(false),
    },
    actions: {
      setIsListening: vi.fn(),
      setIsRecording: vi.fn(),
      setMicError: vi.fn(),
      setLiveTranscript: vi.fn(),
      setRecordingStartedAt: vi.fn(),
      setAutoFinishCountdown: vi.fn(),
      setAutoSubmitPaused: vi.fn(),
      setHasDetectedSpeech: vi.fn(),
    },
  };
}

describe('audioRecorderRuntime hands-free silence detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'));
    recognition = null;
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('SpeechRecognition', FakeSpeechRecognition);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('uses transcript activity to send after a natural pause when Web Audio is unavailable', async () => {
    const processRecording = vi.fn().mockResolvedValue(undefined);
    const runtime = buildRuntime(processRecording);

    await startRecorderCapture(runtime);
    expect(recognition).not.toBeNull();

    recognition.onresult({
      results: [
        {
          0: { transcript: 'I enjoyed studying science.', confidence: 0.91 },
          isFinal: true,
          length: 1,
        },
      ],
    });

    await vi.advanceTimersByTimeAsync(4200);

    expect(processRecording).toHaveBeenCalledOnce();
    expect(processRecording.mock.calls[0][1]).toMatchObject({
      liveTranscript: 'I enjoyed studying science.',
      stopReason: 'smart-finish',
    });
  });

  it('does not auto-send while hands-free mode is disabled', async () => {
    const processRecording = vi.fn().mockResolvedValue(undefined);
    const runtime = buildRuntime(processRecording);
    runtime.refs.smartFinishEnabled.current = false;

    await startRecorderCapture(runtime);
    recognition.onresult({
      results: [
        {
          0: { transcript: 'I am still thinking.', confidence: 0.88 },
          isFinal: true,
          length: 1,
        },
      ],
    });

    await vi.advanceTimersByTimeAsync(10000);
    expect(processRecording).not.toHaveBeenCalled();

    stopRecorderCapture(runtime, 'manual');
    expect(processRecording).toHaveBeenCalledOnce();
    expect(processRecording.mock.calls[0][1].stopReason).toBe('manual');
  });

  it('pauses silence auto-send and gives a fresh silence window when resumed', async () => {
    const processRecording = vi.fn().mockResolvedValue(undefined);
    const runtime = buildRuntime(processRecording);

    await startRecorderCapture(runtime);
    recognition.onresult({
      results: [
        {
          0: { transcript: 'I need a moment to organise my answer.', confidence: 0.9 },
          isFinal: true,
          length: 1,
        },
      ],
    });

    runtime.refs.autoSubmitPaused.current = true;
    await vi.advanceTimersByTimeAsync(8000);
    expect(processRecording).not.toHaveBeenCalled();

    runtime.refs.autoSubmitPaused.current = false;
    runtime.refs.lastVoiceAt.current = Date.now();
    await vi.advanceTimersByTimeAsync(4200);

    expect(processRecording).toHaveBeenCalledOnce();
    expect(processRecording.mock.calls[0][1].stopReason).toBe('smart-finish');
  });

  it('hears a pause through steady background noise such as a fan', () => {
    // A fan holds the room at ~0.03 RMS; the learner peaks well above it.
    const fanOnly = Array.from({ length: 60 }, (_, index) => 0.029 + (index % 3) * 0.001);
    const noisyFloor = __testing.measureNoiseFloor(fanOnly);

    // The old estimator clamped the floor to MIN_VOICE_THRESHOLD, so the fan
    // itself registered as speech and the silence window never opened.
    expect(noisyFloor).toBeGreaterThan(MIN_VOICE_THRESHOLD);
    expect(__testing.detectVoice(0.03, noisyFloor)).toBe(false);
    expect(__testing.detectVoice(0.11, noisyFloor)).toBe(true);
  });

  it('does not let one fan trough collapse the learned room baseline', () => {
    const variableFan = Array.from({ length: 60 }, (_, index) =>
      index === 0 ? 0.002 : 0.029 + (index % 5) * 0.002
    );
    const noisyFloor = __testing.measureNoiseFloor(variableFan);

    expect(noisyFloor).toBeGreaterThan(0.025);
    expect(__testing.detectVoice(0.04, noisyFloor)).toBe(false);
    expect(__testing.detectVoice(0.055, noisyFloor)).toBe(true);
  });

  it('ends an unanswered hands-free capture without waiting for the safety limit', async () => {
    const processRecording = vi.fn().mockResolvedValue(undefined);
    const runtime = buildRuntime(processRecording);

    await startRecorderCapture(runtime);
    await vi.advanceTimersByTimeAsync(runtime.refs.captureConfig.current.noSpeechTimeoutMs + 200);

    expect(processRecording).toHaveBeenCalledOnce();
    expect(processRecording.mock.calls[0][1]).toMatchObject({
      speechDetected: false,
      stopReason: 'no-speech-timeout',
    });
  });

  it('does not treat brief ambient spikes as learner speech', () => {
    const quietFloor = __testing.measureNoiseFloor(Array.from({ length: 60 }, () => 0.002));
    let voiceFrames = 0;

    [0.04, 0.045, 0.003, 0.05, 0.048, 0.004].forEach((rms) => {
      voiceFrames = __testing.getNextVoiceFrameCount(rms, quietFloor, voiceFrames);
    });

    expect(voiceFrames).toBe(0);
    expect(voiceFrames).toBeLessThan(__testing.requiredConsecutiveVoiceFrames);
  });

  it('still confirms sustained speech promptly', () => {
    const quietFloor = __testing.measureNoiseFloor(Array.from({ length: 60 }, () => 0.002));
    let voiceFrames = 0;

    Array.from({ length: __testing.requiredConsecutiveVoiceFrames }, () => 0.05).forEach((rms) => {
      voiceFrames = __testing.getNextVoiceFrameCount(rms, quietFloor, voiceFrames);
    });

    expect(voiceFrames).toBe(__testing.requiredConsecutiveVoiceFrames);
  });

  it('stays sensitive to a quiet voice in a silent room', () => {
    const quietRoom = Array.from({ length: 60 }, () => 0.0015);
    const quietFloor = __testing.measureNoiseFloor(quietRoom);

    expect(__testing.detectVoice(0.002, quietFloor)).toBe(false);
    expect(__testing.detectVoice(0.025, quietFloor)).toBe(true);
  });

  it('never learns a threshold the learner cannot speak over', () => {
    const roaring = Array.from({ length: 60 }, () => 0.4);
    expect(
      __testing.detectVoice(MAX_VOICE_THRESHOLD + 0.01, __testing.measureNoiseFloor(roaring))
    ).toBe(true);
  });

  it('keeps completed caption text when browser recognition restarts', async () => {
    const processRecording = vi.fn().mockResolvedValue(undefined);
    const runtime = buildRuntime(processRecording);

    await startRecorderCapture(runtime);
    recognition.onresult({
      results: [
        {
          0: { transcript: 'The city has', confidence: 0.9 },
          isFinal: true,
          length: 1,
        },
      ],
    });

    recognition.onend();
    await vi.advanceTimersByTimeAsync(250);
    recognition.onresult({
      results: [
        {
          0: { transcript: 'several museums.', confidence: 0.92 },
          isFinal: true,
          length: 1,
        },
      ],
    });

    expect(runtime.actions.setLiveTranscript).toHaveBeenLastCalledWith(
      'The city has several museums.'
    );
  });
});
