import { getAutoFinishCountdown } from './speakingCaptureUtils';

export const MAX_RECORDING_DURATION = 120000;
export const MIN_VOICE_THRESHOLD = 0.018;
// Below this peak, a running analyser has observed effectively digital silence.
// Anything louder but not confidently voice-shaped is ambiguous and must still
// reach transcription instead of being discarded as "no speech".
const CONFIRMED_SILENCE_PEAK_RMS = 0.003;
// Ceiling on the learned threshold, so an extreme room can still be spoken over.
export const MAX_VOICE_THRESHOLD = 0.12;
const ANALYSIS_INTERVAL_MS = 50;
// A couple of loud frames can be a keyboard tap, examiner-audio echo, or a
// brief fan spike. Require a short, continuous voice-shaped run before
// declaring that the learner spoke; browser captions still count instantly.
const REQUIRED_CONSECUTIVE_VOICE_FRAMES = 6;
// Learn the room before accepting analyser-only speech evidence. Browser
// captions remain active immediately, so an eager learner is never muted.
const NOISE_CALIBRATION_MS = 1000;
// Three seconds of history: long enough that every natural pause in speech
// lands inside it, short enough to follow a fan being switched on or off.
const NOISE_WINDOW_FRAMES = 60;
const NOISE_BASELINE_PERCENTILE = 0.2;
const MAX_NOISE_FLOOR = 0.06;
// The quietest frame slightly understates steady noise; lift it a little so a
// dip between fan revolutions does not read as the true floor.
const NOISE_FLOOR_BIAS = 1.15;

// ── Shared capture AudioContext ──────────────────────────────────────────────
// Safari starts every AudioContext constructed outside a user gesture in the
// `suspended` state, and resume() only succeeds from a gesture. Hands-free mode
// opens the microphone automatically — with no gesture — so a per-capture
// context stayed suspended, the analyser only ever read silence, smart finish
// never armed, and the answer sat there until the 2-minute safety cap.
// One context, unlocked on the learner's first interaction, is reused instead.
let sharedCaptureContext = null;

function getCaptureAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedCaptureContext || sharedCaptureContext.state === 'closed') {
    try {
      sharedCaptureContext = new AudioContextCtor();
    } catch {
      return null;
    }
  }
  return sharedCaptureContext;
}

/** The same gesture-unlocked context, for other microphone analysers (barge-in). */
export function getSharedCaptureAudioContext() {
  return getCaptureAudioContext();
}

/** Call synchronously from a user gesture so hands-free captures can analyse. */
export function unlockCaptureAudioContext() {
  const audioContext = getCaptureAudioContext();
  if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
}

/** Test seam — drops the shared context between specs. */
export function resetCaptureAudioContextForTests() {
  sharedCaptureContext = null;
}

/** Test seam — exposes the loudness classifier without a live microphone. */
export const __testing = {
  detectVoice: (rms, noiseFloor) => detectVoice(rms, noiseFloor),
  getNextVoiceFrameCount: (rms, noiseFloor, currentFrames = 0) =>
    getNextVoiceFrameCount(rms, noiseFloor, currentFrames),
  requiredConsecutiveVoiceFrames: REQUIRED_CONSECUTIVE_VOICE_FRAMES,
  noiseCalibrationMs: NOISE_CALIBRATION_MS,
  measureNoiseFloor: (samples) => {
    const refs = { noiseWindow: { current: [] }, noiseFloor: { current: 0 } };
    samples.forEach((rms) => updateNoiseFloor(refs, rms));
    return refs.noiseFloor.current;
  },
  resolveSpeechDetected: (refs) => resolveSpeechDetected(refs),
};

function calculateRms(samples) {
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = (samples[index] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Estimates room noise from the quieter fifth of the last few seconds.
 *
 * The previous estimator could not represent a noisy room at all: it clamped
 * the floor to MIN_VOICE_THRESHOLD, refused to learn from any frame above it,
 * and stopped adapting after 1.2s. A running fan sits above that ceiling, so
 * the floor stayed at its quiet-room default, every single frame classified as
 * speech, `lastVoiceAt` was refreshed forever, and the grace countdown could
 * never start — the answer only ended at the 2-minute cap. Switching the fan
 * off made it work, which is exactly the shape of that bug.
 *
 * A single minimum is too fragile for a fan: one trough makes every later fan
 * pulse look like speech. A lower percentile still ignores speech peaks while
 * resisting those isolated dips.
 */
function updateNoiseFloor(refs, rms) {
  const samples = refs.noiseWindow.current;
  samples.push(rms);
  if (samples.length > NOISE_WINDOW_FRAMES) samples.shift();

  const sorted = [...samples].sort((left, right) => left - right);
  const baselineIndex = Math.floor((sorted.length - 1) * NOISE_BASELINE_PERCENTILE);
  const baseline = sorted[baselineIndex] ?? rms;

  refs.noiseFloor.current = Math.min(MAX_NOISE_FLOOR, baseline * NOISE_FLOOR_BIAS);
}

function detectVoice(rms, noiseFloor) {
  // Enough headroom to clear steady noise, but not so much that a soft speaker
  // in a noisy room stops registering.
  const threshold = Math.max(
    MIN_VOICE_THRESHOLD,
    Math.min(MAX_VOICE_THRESHOLD, noiseFloor * 1.35 + 0.004)
  );
  return rms > threshold;
}

function getNextVoiceFrameCount(rms, noiseFloor, currentFrames) {
  return detectVoice(rms, noiseFloor) ? currentFrames + 1 : 0;
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

/**
 * Whether we have grounds to believe the learner has actually spoken.
 *
 * Either signal alone is sufficient, and deliberately so. Recognised words are
 * direct proof of speech, so they count even when the loudness analyser is
 * running — in a noisy room the learned threshold can sit above a soft voice,
 * and requiring the analyser to agree would leave the answer hanging until the
 * safety cap, which is the failure this whole path exists to prevent.
 */
function hasSpeechEvidence(refs) {
  return refs.speechDetected.current || Boolean(refs.liveTranscript.current);
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
  return () => {
    const { refs } = runtime;
    if (!refs.isListening.current || !refs.analyser.current) return;

    refs.analyser.current.getByteTimeDomainData(samples);
    const now = Date.now();
    const rms = calculateRms(samples);
    refs.peakRms.current = Math.max(refs.peakRms.current, rms);

    // A context that never leaves `suspended` yields perfectly flat frames.
    // Treat the analyser as usable only once it delivers real signal, so the
    // silence monitor knows whether it can trust the absence of voice.
    if (!refs.analyserReady.current && rms > 0) refs.analyserReady.current = true;

    updateNoiseFloor(refs, rms);

    if (now - refs.startTime.current < NOISE_CALIBRATION_MS) {
      refs.voiceFrames.current = 0;
      return;
    }

    refs.voiceFrames.current = getNextVoiceFrameCount(
      rms,
      refs.noiseFloor.current,
      refs.voiceFrames.current
    );
    if (refs.voiceFrames.current >= REQUIRED_CONSECUTIVE_VOICE_FRAMES) {
      markVoiceDetected(runtime, now);
    }
  };
}

function startAudioAnalysis(runtime, stream) {
  const audioContext = getCaptureAudioContext();
  if (!audioContext) return;

  try {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    runtime.refs.audioContext.current = audioContext;
    runtime.refs.analyser.current = analyser;
    runtime.refs.analyserSource.current = source;

    // Hands-free opens the mic without a gesture, so this resume can be
    // refused; unlockCaptureAudioContext already ran on first interaction.
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});

    // A timer, not requestAnimationFrame: rAF is throttled to a standstill in
    // a backgrounded tab, which froze `lastVoiceAt` and stalled smart finish.
    const analyze = createAnalysisLoop(runtime, new Uint8Array(analyser.fftSize));
    runtime.refs.analysisTimer.current = setInterval(analyze, ANALYSIS_INTERVAL_MS);
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

  const sessionFinal = finalSegments.join(' ').replace(/\s+/g, ' ').trim();
  if (runtime.refs.recognitionSessionFinal) {
    runtime.refs.recognitionSessionFinal.current = sessionFinal;
  }
  const baseTranscript = runtime.refs.recognitionBaseTranscript?.current || '';
  const preview = [baseTranscript, sessionFinal, ...interimSegments]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (runtime.refs.speechConfidence) runtime.refs.speechConfidence.current = confidence;
  const previousPreview = runtime.refs.liveTranscript?.current || '';
  if (runtime.refs.liveTranscript) runtime.refs.liveTranscript.current = preview;
  runtime.actions.setLiveTranscript(preview);

  // Only *new* words are evidence of ongoing speech. `preview` always carries
  // the accumulated base transcript, so treating any non-empty value as voice
  // refreshed the silence clock on every restart of the recogniser and the
  // grace countdown could never run out.
  if (preview && preview !== previousPreview) markVoiceDetected(runtime, Date.now());
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
    if (refs.autoSubmitPaused.current) return;
    const now = Date.now();
    const elapsedMs = now - refs.startTime.current;
    if (!hasSpeechEvidence(refs)) {
      if (elapsedMs >= refs.captureConfig.current.noSpeechTimeoutMs) {
        stopRecorderCapture(runtime, 'no-speech-timeout');
      }
      return;
    }

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
  recognition.onerror = (event) => {
    if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
      runtime.refs.speechRecognition.current = null;
    }
  };
  recognition.onend = () => restartRecognitionIfActive(runtime, recognition);
  recognition.start();
  runtime.refs.speechRecognition.current = recognition;
}

function restartRecognitionIfActive(runtime, recognition) {
  const isCurrentRecognition = runtime.refs.speechRecognition.current === recognition;
  if (!runtime.refs.isListening.current || !isCurrentRecognition) return;

  const completedText = runtime.refs.recognitionSessionFinal.current;
  if (completedText) {
    runtime.refs.recognitionBaseTranscript.current = [
      runtime.refs.recognitionBaseTranscript.current,
      completedText,
    ]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    runtime.refs.recognitionSessionFinal.current = '';
  }

  runtime.refs.recognitionRestartTimer.current = setTimeout(() => {
    if (
      !runtime.refs.isListening.current ||
      runtime.refs.speechRecognition.current !== recognition
    ) {
      return;
    }
    try {
      recognition.start();
    } catch {
      restartRecognitionIfActive(runtime, recognition);
    }
  }, 250);
}

function cleanupAudioAnalysis(runtime) {
  const { refs } = runtime;
  if (refs.analysisTimer.current) {
    clearInterval(refs.analysisTimer.current);
    refs.analysisTimer.current = null;
  }
  // Disconnect this capture's nodes but leave the shared context open — it is
  // unlocked once per page and closing it would re-suspend the next capture.
  try {
    refs.analyserSource.current?.disconnect();
  } catch {
    // Already torn down with the media stream.
  }
  refs.analyserSource.current = null;
  refs.audioContext.current = null;
  refs.analyser.current = null;
  if (refs.silenceMonitor.current) {
    clearInterval(refs.silenceMonitor.current);
    refs.silenceMonitor.current = null;
  }
  if (refs.recognitionRestartTimer.current) {
    clearTimeout(refs.recognitionRestartTimer.current);
    refs.recognitionRestartTimer.current = null;
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
  } else {
    stopMediaStream(runtime);
  }

  actions.setIsListening(false);
  actions.setIsRecording(false);
  actions.setAutoFinishCountdown(null);
}

export function cancelRecorderCapture(runtime) {
  const { refs } = runtime;
  refs.discardRecording.current = true;
  // getUserMedia can resolve after a route change or explicit cancel. Invalidate
  // that pending request before stopping the currently active capture.
  if (refs.captureRequestId) refs.captureRequestId.current += 1;
  stopRecorderCapture(runtime, 'cancelled');
}

export function resetRecorderCapture(runtime) {
  const { refs, actions } = runtime;
  if (refs.liveTranscript) refs.liveTranscript.current = '';
  if (refs.recognitionBaseTranscript) refs.recognitionBaseTranscript.current = '';
  if (refs.recognitionSessionFinal) refs.recognitionSessionFinal.current = '';
  if (refs.speechConfidence) refs.speechConfidence.current = [];
  if (refs.speechDetected) refs.speechDetected.current = false;
  if (refs.analyserReady) refs.analyserReady.current = false;
  if (refs.peakRms) refs.peakRms.current = 0;
  if (refs.voiceFrames) refs.voiceFrames.current = 0;
  if (refs.lastVoiceAt) refs.lastVoiceAt.current = 0;
  if (refs.graceStartedAt) refs.graceStartedAt.current = null;
  if (refs.autoSubmitPaused) refs.autoSubmitPaused.current = false;
  if (refs.noiseFloor) refs.noiseFloor.current = MIN_VOICE_THRESHOLD / 2;
  if (refs.noiseWindow) refs.noiseWindow.current = [];
  actions.setLiveTranscript('');
  actions.setRecordingStartedAt(null);
  actions.setAutoFinishCountdown(null);
  actions.setAutoSubmitPaused(false);
  actions.setHasDetectedSpeech(false);
}

function getRecorderMimeType() {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  return MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
}

function resolveSpeechDetected(refs) {
  if (refs.speechDetected.current || Boolean(refs.liveTranscript.current)) return true;

  // A suspended/unavailable AudioContext cannot prove silence. Likewise, quiet
  // or noise-like audio is ambiguous: send it to the provider and let the
  // server-side VAD/transcriber decide. Only a working analyser that stayed at
  // an effectively flat digital signal may short-circuit as confirmed silence.
  if (!refs.analyserReady.current) return null;
  return refs.peakRms.current <= CONFIRMED_SILENCE_PEAK_RMS ? false : null;
}

function buildRecordingMetadata(runtime, duration) {
  const { refs } = runtime;
  return {
    duration,
    speechConfidence:
      refs.speechConfidence.current.length > 0 ? [...refs.speechConfidence.current] : null,
    liveTranscript: refs.liveTranscript.current || null,
    // Lets the server refuse to invent a transcript for a clip the client is
    // confident contains no speech at all.
    speechDetected: resolveSpeechDetected(refs),
    stopReason: refs.stopReason.current,
  };
}

async function processCompletedRecording(runtime, mediaRecorder) {
  const { refs } = runtime;
  // Set the synchronous guard before React has a chance to publish its
  // processing state. Otherwise a fast click or auto-start can open a second
  // capture while this turn is still uploading/transcribing.
  if (refs.isProcessing.current) return;
  refs.isProcessing.current = true;
  const duration = Date.now() - refs.startTime.current;
  refs.mediaRecorder.current = null;

  if (refs.discardRecording.current) {
    refs.discardRecording.current = false;
    refs.audioChunks.current = [];
    resetRecorderCapture(runtime);
    refs.isProcessing.current = false;
    return;
  }

  if (duration < 1500) {
    try {
      await runtime.processRecording(null, { error: 'too_short', duration });
    } finally {
      resetRecorderCapture(runtime);
      refs.isProcessing.current = false;
    }
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
    refs.isProcessing.current = false;
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
  mediaRecorder.onstop = () =>
    processCompletedRecording(runtime, mediaRecorder).finally(() => stopMediaStream(runtime));
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

  const requestId = refs.captureRequestId ? ++refs.captureRequestId.current : null;

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

    // Do not resurrect a microphone after the learner navigated away, cancelled
    // the prompt, or started a newer capture while permission was pending.
    if (requestId !== null && refs.captureRequestId.current !== requestId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
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
    if (requestId !== null && refs.captureRequestId.current !== requestId) return;
    console.error('Microphone error:', error);
    actions.setMicError(microphoneErrorMessage(error));
    resetRecorderCapture(runtime);
  }
}
