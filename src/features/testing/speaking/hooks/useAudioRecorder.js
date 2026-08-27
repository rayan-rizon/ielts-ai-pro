import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelRecorderCapture,
  MIN_VOICE_THRESHOLD,
  startRecorderCapture,
  stopRecorderCapture,
  unlockCaptureAudioContext,
} from '../utils/audioRecorderRuntime';
import { getSpeakingCaptureConfig } from '../utils/speakingCaptureUtils';

function useRecorderRefs(partNumber, handsFreeEnabled) {
  const refs = {
    mediaRecorder: useRef(null),
    audioChunks: useRef([]),
    stream: useRef(null),
    maxRecordingTimer: useRef(null),
    startTime: useRef(0),
    discardRecording: useRef(false),
    // Each permission prompt is asynchronous.  A monotonically increasing
    // request id lets cleanup/unmount invalidate a prompt that resolves later.
    captureRequestId: useRef(0),
    stopReason: useRef('manual'),
    speechRecognition: useRef(null),
    recognitionRestartTimer: useRef(null),
    recognitionBaseTranscript: useRef(''),
    recognitionSessionFinal: useRef(''),
    speechConfidence: useRef([]),
    liveTranscript: useRef(''),
    audioContext: useRef(null),
    analyser: useRef(null),
    analyserSource: useRef(null),
    analyserReady: useRef(false),
    analysisTimer: useRef(null),
    silenceMonitor: useRef(null),
    noiseFloor: useRef(MIN_VOICE_THRESHOLD / 2),
    noiseWindow: useRef([]),
    voiceFrames: useRef(0),
    speechDetected: useRef(false),
    lastVoiceAt: useRef(0),
    graceStartedAt: useRef(null),
    captureConfig: useRef(getSpeakingCaptureConfig(partNumber)),
    smartFinishEnabled: useRef(handsFreeEnabled),
    autoSubmitPaused: useRef(false),
    isListening: useRef(false),
    isRecording: useRef(false),
    isProcessing: useRef(false),
  };
  refs.captureConfig.current = getSpeakingCaptureConfig(partNumber);
  refs.smartFinishEnabled.current = handsFreeEnabled;
  return refs;
}

function useRecorderState() {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [autoFinishCountdown, setAutoFinishCountdown] = useState(null);
  const [autoSubmitPaused, setAutoSubmitPaused] = useState(false);
  const [hasDetectedSpeech, setHasDetectedSpeech] = useState(false);

  return {
    values: {
      isListening,
      isRecording,
      micError,
      liveTranscript,
      recordingStartedAt,
      autoFinishCountdown,
      autoSubmitPaused,
      hasDetectedSpeech,
    },
    actions: {
      setIsListening,
      setIsRecording,
      setMicError,
      setLiveTranscript,
      setRecordingStartedAt,
      setAutoFinishCountdown,
      setAutoSubmitPaused,
      setHasDetectedSpeech,
    },
  };
}

/**
 * Records a speaking answer with explicit start, learner-safe smart finish,
 * a visible grace countdown, manual finish, and a two-minute safety cap.
 */
export default function useAudioRecorder({
  processRecording,
  partNumber = 1,
  handsFreeEnabled = true,
}) {
  const refs = useRecorderRefs(partNumber, handsFreeEnabled);
  const { values, actions } = useRecorderState();
  const runtime = { refs, actions, processRecording };
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  const startListening = useCallback(() => startRecorderCapture(runtimeRef.current), []);
  const stopListening = useCallback(
    (reason = 'manual') => stopRecorderCapture(runtimeRef.current, reason),
    []
  );
  const cancelListening = useCallback(() => cancelRecorderCapture(runtimeRef.current), []);
  const setIsProcessing = useCallback((value) => {
    runtimeRef.current.refs.isProcessing.current = value;
  }, []);
  const setAutoSubmitPaused = useCallback((paused) => {
    const currentRuntime = runtimeRef.current;
    const nextPaused = Boolean(paused);
    currentRuntime.refs.autoSubmitPaused.current = nextPaused;
    currentRuntime.refs.graceStartedAt.current = null;
    currentRuntime.actions.setAutoFinishCountdown(null);
    currentRuntime.actions.setAutoSubmitPaused(nextPaused);

    if (!nextPaused && currentRuntime.refs.isListening.current) {
      currentRuntime.refs.lastVoiceAt.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const currentRuntime = runtimeRef.current;
    currentRuntime.refs.smartFinishEnabled.current = handsFreeEnabled;
    currentRuntime.refs.autoSubmitPaused.current = false;
    currentRuntime.refs.graceStartedAt.current = null;
    currentRuntime.actions.setAutoFinishCountdown(null);
    currentRuntime.actions.setAutoSubmitPaused(false);

    if (handsFreeEnabled && currentRuntime.refs.isListening.current) {
      currentRuntime.refs.lastVoiceAt.current = Date.now();
    }
  }, [handsFreeEnabled]);

  // Hands-free reopens the microphone without a click, so the analyser's audio
  // context must be resumed while the page still has a user activation.
  useEffect(() => {
    const unlock = () => unlockCaptureAudioContext();
    const events = ['pointerdown', 'touchend', 'keydown'];
    events.forEach((event) =>
      window.addEventListener(event, unlock, { capture: true, once: true, passive: true })
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, unlock, { capture: true }));
    };
  }, []);

  useEffect(() => cancelListening, [cancelListening]);

  return {
    startListening,
    stopListening,
    cancelListening,
    setIsProcessing,
    setAutoSubmitPaused,
    ...values,
  };
}
