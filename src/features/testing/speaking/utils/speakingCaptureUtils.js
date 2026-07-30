const DEFAULT_CAPTURE_CONFIG = {
  minimumAnswerMs: 2500,
  silenceBeforeGraceMs: 1600,
  gracePeriodMs: 1400,
};

const PART_TWO_CAPTURE_CONFIG = {
  minimumAnswerMs: 10000,
  silenceBeforeGraceMs: 3500,
  gracePeriodMs: 2000,
};

export function getSpeakingCaptureConfig(partNumber) {
  return Number(partNumber) === 2 ? PART_TWO_CAPTURE_CONFIG : DEFAULT_CAPTURE_CONFIG;
}

export function getAutoFinishCountdown({
  speechDetected,
  elapsedMs,
  silenceMs,
  graceStartedAt,
  now,
  config,
}) {
  const isWaitingForAutoFinish =
    !speechDetected ||
    elapsedMs < config.minimumAnswerMs ||
    silenceMs < config.silenceBeforeGraceMs;
  if (isWaitingForAutoFinish) return null;

  const startedAt = graceStartedAt || now;
  const remainingMs = Math.max(0, config.gracePeriodMs - (now - startedAt));

  return {
    startedAt,
    remainingMs,
    seconds: Math.max(1, Math.ceil(remainingMs / 1000)),
    shouldFinish: remainingMs === 0,
  };
}

export function formatRecordingDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function canAutoStartSpeakingAnswer({
  requested,
  handsFreeEnabled,
  testStarted,
  isProcessing,
  isSpeaking,
  isTTSLoading,
  isListening,
  isPartComplete,
  isPart2Prep,
  isTestComplete,
}) {
  const prerequisitesReady = [requested, handsFreeEnabled, testStarted].every(Boolean);
  if (!prerequisitesReady) return false;

  return ![
    isProcessing,
    isSpeaking,
    isTTSLoading,
    isListening,
    isPartComplete,
    isPart2Prep,
    isTestComplete,
  ].some(Boolean);
}
