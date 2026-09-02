export const READING_RAW_SCORE_THRESHOLDS = Object.freeze({
  9.0: 39,
  8.5: 37,
  8.0: 35,
  7.5: 33,
  7.0: 30,
  6.5: 27,
  6.0: 23,
  5.5: 19,
  5.0: 15,
  4.5: 13,
  4.0: 10,
  3.5: 8,
  3.0: 6,
  2.5: 4,
  2.0: 2,
  1.0: 1,
});

export const LISTENING_RAW_SCORE_THRESHOLDS = Object.freeze({
  9.0: 39,
  8.5: 37,
  8.0: 35,
  7.5: 32,
  7.0: 30,
  6.5: 26,
  6.0: 23,
  5.5: 18,
  5.0: 16,
  4.5: 13,
  4.0: 11,
  3.5: 10,
  3.0: 6,
  2.5: 4,
  2.0: 2,
  1.0: 1,
});

function toScaledRawScore(correct, total) {
  const safeTotal = Number(total);
  const safeCorrect = Number(correct);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0 || !Number.isFinite(safeCorrect)) return 0;
  return (Math.max(0, Math.min(safeCorrect, safeTotal)) / safeTotal) * 40;
}

function bandFromThresholds(correct, total, thresholds, fallbackBand) {
  if (Number(correct) < 1 || Number(total) <= 0) return 0;
  const rawScore40 = toScaledRawScore(correct, total);
  const bands = Object.keys(thresholds)
    .map(Number)
    .sort((a, b) => b - a);
  return bands.find((band) => rawScore40 >= thresholds[band]) ?? fallbackBand;
}

export function calculateReadingBandScore(correct, total) {
  return bandFromThresholds(correct, total, READING_RAW_SCORE_THRESHOLDS, 1.0);
}

export function calculateListeningBandScore(correct, total) {
  return bandFromThresholds(correct, total, LISTENING_RAW_SCORE_THRESHOLDS, 0);
}

export function calculateTestBandScore(correct, total, testType = 'reading') {
  return testType === 'listening'
    ? calculateListeningBandScore(correct, total)
    : calculateReadingBandScore(correct, total);
}
