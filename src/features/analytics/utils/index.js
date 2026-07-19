import { BookOpen, Star, TrendingUp, Target } from 'lucide-react';

export function formatBand(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0.0';
  return v.toFixed(1);
}

export function getCEFR(score) {
  const s = Number(score);
  if (s >= 8.5) return 'C2';
  if (s >= 7.0) return 'C1';
  if (s >= 5.5) return 'B2';
  if (s >= 4.0) return 'B1';
  return 'A2';
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

export function getLearningPhase(avgScore) {
  const score = Number(avgScore);
  if (!Number.isFinite(score)) {
    return {
      label: 'Foundation',
      progress: 0,
      next: 'Intermediate',
      tone: 'from-blue-600 to-cyan-600',
      Icon: BookOpen,
    };
  }
  if (score >= 7.5)
    return {
      label: 'Mastery',
      progress: 100,
      next: 'Max',
      tone: 'from-emerald-600 to-teal-600',
      Icon: Star,
    };
  if (score >= 6.5)
    return {
      label: 'Advanced',
      progress: ((score - 6.5) / 1.0) * 100,
      next: 'Mastery',
      tone: 'from-blue-600 to-indigo-600',
      Icon: TrendingUp,
    };
  if (score >= 5.0)
    return {
      label: 'Intermediate',
      progress: ((score - 5.0) / 1.5) * 100,
      next: 'Advanced',
      tone: 'from-amber-500 to-orange-600',
      Icon: Target,
    };
  return {
    label: 'Foundation',
    progress: (score / 5.0) * 100,
    next: 'Intermediate',
    tone: 'from-violet-600 to-fuchsia-600',
    Icon: BookOpen,
  };
}

export function getNextMilestone(avgScore) {
  const score = Number(avgScore);
  const milestones = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
  if (!Number.isFinite(score)) return { target: 5.0, gap: '5.0' };
  const target = milestones.find((m) => m > score) ?? 9.0;
  return { target, gap: formatBand(Math.max(0, target - score)) };
}

export function clamp01(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function normalCdf(value) {
  // Abramowitz and Stegun approximation. Accurate enough for a learner-facing
  // trend estimate without presenting the result as an exact statistical model.
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

/**
 * Estimate the likelihood of reaching a target band from the same bounded
 * 30-day trend used in the forecast. This is deliberately conservative: it
 * widens uncertainty for sparse or volatile histories and never claims 100%.
 */
export function calculateTargetLikelihood({
  projectedScore,
  targetScore,
  standardDeviation,
  sampleSize,
}) {
  const projected = Number(projectedScore);
  const target = Number(targetScore);
  const deviation = Number(standardDeviation);
  const samples = Number(sampleSize);

  if (!Number.isFinite(projected) || !Number.isFinite(target) || !Number.isFinite(samples)) {
    return null;
  }

  const evidencePenalty = samples < 5 ? 0.6 : samples < 7 ? 0.4 : 0.25;
  const uncertainty = Math.max(0.45, Number.isFinite(deviation) ? deviation : 0) + evidencePenalty;
  // IELTS bands are reported in half-band increments, so the threshold starts
  // halfway between the previous available band and the requested target.
  const zScore = (target - 0.25 - projected) / uncertainty;
  const probability = 1 - normalCdf(zScore);
  return Math.max(0, Math.min(99, Math.round(probability * 100)));
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

/**
 * Calculate score forecast using linear regression on historical data.
 * Returns predicted score for 30 days from now, capped at 9.0.
 */
export function calculateScoreForecast(sessions, currentScore, targetScore) {
  const avgScore = Number(currentScore) || 0;
  const target = Number(targetScore) || 7.5;

  // Return empty if not enough data
  if (!sessions || sessions.length < 3) {
    return [];
  }

  // Get scores with timestamps, sorted by date (oldest first for regression)
  const dataPoints = sessions
    .filter((s) => {
      const score = Number(s.score);
      return Number.isFinite(score) && score >= 0 && score <= 9 && (s.completed_at || s.created_at);
    })
    .map((s) => ({
      time: new Date(s.completed_at || s.created_at).getTime(),
      score: Number(s.score),
    }))
    .sort((a, b) => a.time - b.time)
    .slice(-10); // Use last 10 sessions for more stable prediction

  if (dataPoints.length < 3) {
    return [];
  }

  // Linear regression: y = mx + b
  const n = dataPoints.length;
  const originTime = dataPoints[0].time;
  const dayMs = 24 * 60 * 60 * 1000;
  const centeredPoints = dataPoints.map((point) => ({
    x: (point.time - originTime) / dayMs,
    score: point.score,
  }));
  const sumX = centeredPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = dataPoints.reduce((sum, p) => sum + p.score, 0);
  const sumXY = centeredPoints.reduce((sum, p) => sum + p.x * p.score, 0);
  const sumX2 = centeredPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  let slope = 0;
  let intercept = avgScore;

  if (denominator !== 0) {
    slope = (n * sumXY - sumX * sumY) / denominator;
    intercept = (sumY - slope * sumX) / n;
  }

  // Extrapolate 30 days from the latest observation, then bound the movement.
  // Sparse practice data should guide learners without projecting an implausible collapse or leap.
  const predictionX = (dataPoints[dataPoints.length - 1].time - originTime) / dayMs + 30;
  const rawPrediction = intercept + slope * predictionX;
  const boundedPrediction = Math.min(avgScore + 1, Math.max(avgScore - 1, rawPrediction));
  const predictedScore = Math.min(9, Math.max(0, Math.round(boundedPrediction * 2) / 2));

  // Calculate confidence based on data points and variance
  const variance = dataPoints.reduce((sum, p) => sum + Math.pow(p.score - avgScore, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  const confidence = n >= 7 && variance < 0.5 ? 'high' : n >= 5 && variance < 1 ? 'medium' : 'low';
  const targetLikelihood = calculateTargetLikelihood({
    projectedScore: predictedScore,
    targetScore: target,
    standardDeviation,
    sampleSize: n,
  });

  return [
    { date: 'Now', score: avgScore, isForecast: false },
    {
      date: '+30 Days',
      score: Number(predictedScore.toFixed(1)),
      isForecast: true,
      confidence,
      sampleSize: n,
      standardDeviation: Number(standardDeviation.toFixed(2)),
      targetLikelihood,
    },
    { date: 'Target', score: target, isForecast: true },
  ];
}
