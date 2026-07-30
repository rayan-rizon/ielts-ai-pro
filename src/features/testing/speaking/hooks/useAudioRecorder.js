import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelRecorderCapture,
  MIN_VOICE_THRESHOLD,
  startRecorderCapture,
  stopRecorderCapture,
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
    stopReason: useRef('manual'),
    speechRecognition: useRef(null),
    speechConfidence: useRef([]),
    liveTranscript: useRef(''),
    audioContext: useRef(null),
    analyser: useRef(null),
    animationFrame: useRef(null),
    silenceMonitor: useRef(null),
    noiseFloor: useRef(MIN_VOICE_THRESHOLD / 2),
    voiceFrames: useRef(0),
    speechDetected: useRef(false),
    lastVoiceAt: useRef(0),
    graceStartedAt: useRef(null),
    captureConfig: useRef(getSpeakingCaptureConfig(partNumber)),
    smartFinishEnabled: useRef(handsFreeEnabled),
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
  const [hasDetectedSpeech, setHasDetectedSpeech] = useState(false);

  return {
    values: {
      isListening,
      isRecording,
      micError,
      liveTranscript,
      recordingStartedAt,
      autoFinishCountdown,
      hasDetectedSpeech,
    },
    actions: {
      setIsListening,
      setIsRecording,
      setMicError,
      setLiveTranscript,
      setRecordingStartedAt,
      setAutoFinishCountdown,
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

  useEffect(() => {
    const currentRuntime = runtimeRef.current;
    currentRuntime.refs.smartFinishEnabled.current = handsFreeEnabled;
    currentRuntime.refs.graceStartedAt.current = null;
    currentRuntime.actions.setAutoFinishCountdown(null);

    if (handsFreeEnabled && currentRuntime.refs.isListening.current) {
      currentRuntime.refs.lastVoiceAt.current = Date.now();
    }
  }, [handsFreeEnabled]);

  useEffect(() => cancelListening, [cancelListening]);

  return {
    startListening,
    stopListening,
    cancelListening,
    setIsProcessing,
    ...values,
  };
}
