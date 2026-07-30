import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MIN_VOICE_THRESHOLD,
  startRecorderCapture,
  stopRecorderCapture,
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
      speechConfidence: ref([]),
      liveTranscript: ref(''),
      audioContext: ref(null),
      analyser: ref(null),
      animationFrame: ref(null),
      silenceMonitor: ref(null),
      noiseFloor: ref(MIN_VOICE_THRESHOLD / 2),
      voiceFrames: ref(0),
      speechDetected: ref(false),
      lastVoiceAt: ref(0),
      graceStartedAt: ref(null),
      captureConfig: ref(getSpeakingCaptureConfig(1)),
      smartFinishEnabled: ref(true),
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
});
