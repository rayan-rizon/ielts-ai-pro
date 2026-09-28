// Detects the learner starting to talk while the practice coach is speaking.
//
// The microphone also hears the coach through the speakers. Browser echo
// cancellation removes most of it, but not reliably for <audio> playback, so
// the detector first learns how loud the coach's own echo is, then requires a
// sustained signal clearly above that level. A cough or a single loud frame
// does not interrupt; a sentence does.

export const BARGE_IN_DEFAULTS = {
  /** Learn the echo level from the first part of the coach's speech. */
  calibrationMs: 600,
  /** Absolute floor, so a near-silent room cannot make any sound a barge-in. */
  minRms: 0.025,
  /** Speech must be this many times louder than the learned echo. */
  echoMultiplier: 2.6,
  /**
   * Speech loudness swings between syllables, so frames are counted in a
   * sliding window rather than in an unbroken run: at least `requiredFrames`
   * loud frames within the last `windowFrames` (~0.4s at 50ms per frame).
   * Measured 2026-09-28: a spoken answer never held 7 loud frames in a row,
   * and 6-of-10 above 0.035 took 1.5-1.8s to fire; 5-of-8 above 0.025 is the
   * tuned setting.
   */
  requiredFrames: 5,
  windowFrames: 8,
};

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

export function createBargeInDetector(options = {}) {
  const config = { ...BARGE_IN_DEFAULTS, ...options };
  const echoSamples = [];
  let startedAt = null;
  let threshold = null;
  const recent = [];

  return {
    /** Feed one RMS reading; returns true once the learner is clearly speaking. */
    push(rms, now) {
      if (startedAt === null) startedAt = now;
      if (now - startedAt < config.calibrationMs) {
        echoSamples.push(rms);
        return false;
      }
      if (threshold === null) {
        threshold = Math.max(config.minRms, percentile(echoSamples, 0.9) * config.echoMultiplier);
      }
      recent.push(rms > threshold);
      if (recent.length > config.windowFrames) recent.shift();
      return recent.filter(Boolean).length >= config.requiredFrames;
    },
    get threshold() {
      return threshold;
    },
  };
}

/** Root-mean-square level of 8-bit analyser time-domain samples (0-1). */
export function rmsFromByteSamples(samples) {
  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const normalized = (samples[index] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / Math.max(1, samples.length));
}
