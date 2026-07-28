export function formatBand(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0.0';
  return v.toFixed(1);
}

/**
 * Get a student-friendly label for band score.
 * Based on official IELTS band descriptors to be familiar and encouraging.
 */
export function getBandLabel(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s < 1) return 'Getting Started';
  if (s >= 8.5) return 'Expert';
  if (s >= 7.5) return 'Very Good';
  if (s >= 6.5) return 'Good';
  if (s >= 5.5) return 'Competent';
  if (s >= 4.5) return 'Developing';
  return 'Building';
}

export function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/**
 * Calculate improvement using weighted moving average of recent scores vs older scores.
 * More accurate than simple first-half vs second-half comparison.
 */
export function calculateImprovement(sessions) {
  if (!sessions || sessions.length < 2) return 0;

  // Get scores sorted by date (newest first)
  const scores = sessions
    .filter((s) => Number.isFinite(Number(s.score)))
    .sort(
      (a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at)
    )
    .map((s) => Number(s.score));

  if (scores.length < 2) return 0;

  // Use weighted average: recent 3 tests vs previous 3-5 tests
  const recentCount = Math.min(3, Math.floor(scores.length / 2));
  const recent = scores.slice(0, recentCount);
  const older = scores.slice(recentCount, recentCount + Math.min(5, scores.length - recentCount));

  if (recent.length === 0 || older.length === 0) return 0;

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  return Number((recentAvg - olderAvg).toFixed(1));
}
