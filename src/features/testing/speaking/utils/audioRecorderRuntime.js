import { getAutoFinishCountdown } from './speakingCaptureUtils';

export const MAX_RECORDING_DURATION = 120000;
export const MIN_VOICE_THRESHOLD = 0.018;

function calculateRms(samples) {
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = (samples[index] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

function updateNoiseFloor(refs, rms, elapsedMs) {
  if (elapsedMs >= 1200) return;
  if (refs.speechDetected.current) return;
  if (rms >= MIN_VOICE_THRESHOLD * 1.4) return;

  refs.noiseFloor.current = Math.min(
    MIN_VOICE_THRESHOLD,
    refs.noiseFloor.current * 0.88 + rms * 0.12
  );
}

function detectVoice(rms, noiseFloor) {
  const threshold = Math.max(MIN_VOICE_THRESHOLD, Math.min(0.05, noiseFloor * 1.7 + 0.005));
  return rms > threshold;
}

function markVoiceDetected(runtime, now) {
  const { refs, actions } = runtime;
  refs.lastVoiceAt.current = now;
  refs.graceStartedAt.current = null;
  if (!refs.speechDetected.current) {
    refs.speechDetected.current = true;
    actions.setHasDetectedSpeech(true);
  }
  actions.setAutoFinishCountdown(null);
}

function shouldFinishAfterSilence(runtime, now, elapsedMs) {
  const { refs, actions } = runtime;
  const countdown = getAutoFinishCountdown({
    speechDetected: true,
    elapsedMs,
    silenceMs: now - refs.lastVoiceAt.current,
    graceStartedAt: refs.graceStartedAt.current,
    now,
    config: refs.captureConfig.current,
  });
  if (!countdown) return false;

  refs.graceStartedAt.current = countdown.startedAt;
  actions.setAutoFinishCountdown(countdown.seconds);
  return countdown.shouldFinish;
}

function createAnalysisLoop(runtime, samples) {
  const analyze = () => {
    const { refs } = runtime;
    if (!refs.isListening.current || !refs.analyser.current) return;

    refs.analyser.current.getByteTimeDomainData(samples);
    const now = Date.now();
    const elapsedMs = now - refs.startTime.current;
    const rms = calculateRms(samples);
    updateNoiseFloor(refs, rms, elapsedMs);

    if (detectVoice(rms, refs.noiseFloor.current)) {
      refs.voiceFrames.current += 1;
      if (refs.voiceFrames.current >= 2) markVoiceDetected(runtime, now);
    } else {
      refs.voiceFrames.current = 0;
    }

    refs.animationFrame.current = requestAnimationFrame(analyze);
  };
  return analyze;
}

function startAudioAnalysis(runtime, stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  try {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    runtime.refs.audioContext.current = audioContext;
    runtime.refs.analyser.current = analyser;
    audioContext.resume().catch(() => {});

    const analyze = createAnalysisLoop(runtime, new Uint8Array(analyser.fftSize));
    runtime.refs.animationFrame.current = requestAnimationFrame(analyze);
  } catch {
    // Smart finish is progressive enhancement. Manual finish remains available.
  }
}

function updateLiveRecognition(runtime, event) {
  const finalSegments = [];
  const interimSegments = [];
  const confidence = [];

  for (let index = 0; index < event.results.length; index += 1) {
    collectRecognitionResult(event.results[index], {
      confidence,
      finalSegments,
      interimSegments,
    });
  }

  const preview = [...finalSegments, ...interimSegments].join(' ').replace(/\s+/g, ' ').trim();
  runtime.refs.speechConfidence.current = confidence;
  runtime.refs.liveTranscript.current = preview;
  runtime.actions.setLiveTranscript(preview);
  if (preview) markVoiceDetected(runtime, Date.now());
}

function collectRecognitionResult(result, output) {
  const alternative = result?.[0];
  const text = String(alternative?.transcript || '').trim();
  if (!text) return;

  if (!result.isFinal) {
    output.interimSegments.push(text);
    return;
  }
  output.finalSegments.push(text);
  output.confidence.push({
    transcript: text,
    confidence: Number(alternative.confidence) || 0,
  });
}

function startSilenceMonitor(runtime) {
  runtime.refs.silenceMonitor.current = setInterval(() => {
    const { refs } = runtime;
    if (!refs.isListening.current) return;
    if (!refs.smartFinishEnabled.current) return;
    if (!refs.speechDetected.current) return;

    const now = Date.now();
    const elapsedMs = now - refs.startTime.current;
    if (shouldFinishAfterSilence(runtime, now, elapsedMs)) {
      stopRecorderCapture(runtime, 'smart-finish');
    }
  }, 200);
}

function startBrowserRecognition(runtime) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = 'en-GB';
  recognition.onresult = (event) => updateLiveRecognition(runtime, event);
  recognition.onerror = () => {};
  recognition.onend = () => restartRecognitionIfActive(runtime, recognition);
  recognition.start();
  runtime.refs.speechRecognition.current = recognition;
}

function restartRecognitionIfActive(runtime, recognition) {
  const isCurrentRecognition = runtime.refs.speechRecognition.current === recognition;
  if (!runtime.refs.isListening.current || !isCurrentRecognition) return;
  try {
    recognition.start();
  } catch {
    // Some browsers impose a restart delay. Recording continues without captions.
  }
}

function cleanupAudioAnalysis(runtime) {
  const { refs } = runtime;
  if (refs.animationFrame.current) {
    cancelAnimationFrame(refs.animationFrame.current);
    refs.animationFrame.current = null;
  }
  if (refs.audioContext.current?.state !== 'closed') {
    refs.audioContext.current?.close().catch(() => {});
  }
  refs.audioContext.current = null;
  refs.analyser.current = null;
  if (refs.silenceMonitor.current) {
    clearInterval(refs.silenceMonitor.current);
    refs.silenceMonitor.current = null;
  }
}

function stopSpeechRecognition(runtime) {
  const recognition = runtime.refs.speechRecognition.current;
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    // Recognition may already have ended after a period of silence.
  }
  runtime.refs.speechRecognition.current = null;
}

function stopMediaStream(runtime) {
  const stream = runtime.refs.stream.current;
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
  runtime.refs.stream.current = null;
}

export function stopRecorderCapture(runtime, reason = 'manual') {
  const { refs, actions } = runtime;
  refs.stopReason.current = reason;
  refs.isListening.current = false;
  refs.isRecording.current = false;

  if (refs.maxRecordingTimer.current) {
    clearTimeout(refs.maxRecordingTimer.current);
    refs.maxRecordingTimer.current = null;
  }

  cleanupAudioAnalysis(runtime);
  stopSpeechRecognition(runtime);
  if (refs.mediaRecorder.current?.state === 'recording') {
    refs.mediaRecorder.current.stop();
  }
  stopMediaStream(runtime);

  actions.setIsListening(false);
  actions.setIsRecording(false);
  actions.setAutoFinishCountdown(null);
}

export function cancelRecorderCapture(runtime) {
  runtime.refs.discardRecording.current = true;
  stopRecorderCapture(runtime, 'cancelled');
}

export function resetRecorderCapture(runtime) {
  const { refs, actions } = runtime;
  refs.liveTranscript.current = '';
  refs.speechConfidence.current = [];
  refs.speechDetected.current = false;
  refs.voiceFrames.current = 0;
  refs.lastVoiceAt.current = 0;
  refs.graceStartedAt.current = null;
  refs.noiseFloor.current = MIN_VOICE_THRESHOLD / 2;
  actions.setLiveTranscript('');
  actions.setRecordingStartedAt(null);
  actions.setAutoFinishCountdown(null);
  actions.setHasDetectedSpeech(false);
}

function getRecorderMimeType() {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  return MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
}

function buildRecordingMetadata(runtime, duration) {
  const { refs } = runtime;
  return {
    duration,
    speechConfidence:
      refs.speechConfidence.current.length > 0 ? [...refs.speechConfidence.current] : null,
    liveTranscript: refs.liveTranscript.current || null,
    stopReason: refs.stopReason.current,
  };
}

async function processCompletedRecording(runtime, mediaRecorder) {
  const { refs } = runtime;
  const duration = Date.now() - refs.startTime.current;
  refs.mediaRecorder.current = null;

  if (refs.discardRecording.current) {
    refs.discardRecording.current = false;
    refs.audioChunks.current = [];
    resetRecorderCapture(runtime);
    return;
  }

  if (duration < 1500) {
    await runtime.processRecording(null, { error: 'too_short', duration });
    resetRecorderCapture(runtime);
    return;
  }

  const audioBlob = new Blob(refs.audioChunks.current, {
    type: mediaRecorder.mimeType || 'audio/webm',
  });
  refs.audioChunks.current = [];

  try {
    await runtime.processRecording(audioBlob, buildRecordingMetadata(runtime, duration));
  } finally {
    resetRecorderCapture(runtime);
  }
}

function createMediaRecorder(runtime, stream) {
  const mimeType = getRecorderMimeType();
  const mediaRecorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    audioBitsPerSecond: 24000,
  });
  runtime.refs.mediaRecorder.current = mediaRecorder;
  runtime.refs.audioChunks.current = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) runtime.refs.audioChunks.current.push(event.data);
  };
  mediaRecorder.onstop = () => processCompletedRecording(runtime, mediaRecorder);
  return mediaRecorder;
}

function markRecordingStarted(runtime) {
  const startedAt = Date.now();
  runtime.refs.startTime.current = startedAt;
  runtime.refs.lastVoiceAt.current = startedAt;
  runtime.refs.isListening.current = true;
  runtime.refs.isRecording.current = true;
  runtime.actions.setRecordingStartedAt(startedAt);
  runtime.actions.setIsListening(true);
  runtime.actions.setIsRecording(true);
}

function microphoneErrorMessage(error) {
  if (error.name === 'NotAllowedError') {
    return 'Microphone access denied. Please allow microphone access in your browser settings.';
  }
  if (error.name === 'NotFoundError') {
    return 'No microphone found. Please connect a microphone and try again.';
  }
  return `Could not access microphone: ${error.message}`;
}

function isCaptureBusy(refs) {
  return refs.isProcessing.current || refs.isRecording.current || refs.isListening.current;
}

export async function startRecorderCapture(runtime) {
  const { refs, actions } = runtime;
  if (isCaptureBusy(refs)) return;

  try {
    actions.setMicError(null);
    resetRecorderCapture(runtime);
    refs.discardRecording.current = false;
    refs.stopReason.current = 'manual';

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    });
    refs.stream.current = stream;

    const mediaRecorder = createMediaRecorder(runtime, stream);
    mediaRecorder.start(100);
    markRecordingStarted(runtime);
    startAudioAnalysis(runtime, stream);
    startSilenceMonitor(runtime);

    try {
      startBrowserRecognition(runtime);
    } catch {
      // Continue with audio recording when browser captions are unavailable.
    }

    refs.maxRecordingTimer.current = setTimeout(
      () => stopRecorderCapture(runtime, 'safety-limit'),
      MAX_RECORDING_DURATION
    );
  } catch (error) {
    console.error('Microphone error:', error);
    actions.setMicError(microphoneErrorMessage(error));
    resetRecorderCapture(runtime);
  }
}
