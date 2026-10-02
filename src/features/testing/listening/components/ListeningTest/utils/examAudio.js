import { LISTENING_REVIEW_SECONDS, getListeningParts } from '@/features/testing/shared/testMode';

export function hasValidAudioDurations(durations, partCount) {
  return (
    Array.isArray(durations) &&
    durations.length === partCount &&
    partCount > 0 &&
    durations.every((duration) => Number.isFinite(duration) && duration > 0)
  );
}

export function loadAudioDuration(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const finish = (duration, error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.ondurationchange = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
      if (error) reject(error);
      else resolve(duration);
    };
    const timeout = window.setTimeout(
      () =>
        finish(null, new Error('Unable to determine listening audio duration. Please try again.')),
      15_000
    );
    const readDuration = () => {
      // Capture before cleanup: load() resets the media element's duration to NaN.
      const duration = audio.duration;
      if (Number.isFinite(duration) && duration > 0) finish(Math.ceil(duration));
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = readDuration;
    audio.ondurationchange = readDuration;
    audio.onerror = () =>
      finish(null, new Error('Unable to load listening audio. Please try again.'));
    audio.src = src;
  });
}

export async function recoverListeningExamTiming(session, testData) {
  const parts = getListeningParts(testData);
  const storedDurations = session.content_data?.audio_durations;
  const durations = hasValidAudioDurations(storedDurations, parts.length)
    ? storedDurations
    : await Promise.all(parts.map((part) => loadAudioDuration(part.audio_url || part.audioUrl)));
  const durationSeconds =
    durations.reduce((total, duration) => total + duration, 0) + LISTENING_REVIEW_SECONDS;
  // Recover the timeline from the original start; preserve the attempt and its answers.
  return {
    ...session,
    content_data: {
      ...session.content_data,
      audio_durations: durations,
      duration_seconds: durationSeconds,
      review_seconds: LISTENING_REVIEW_SECONDS,
    },
  };
}
