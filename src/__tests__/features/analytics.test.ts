import { describe, it, expect } from 'vitest';
import { calculateErrorPatterns } from '@/services/testMetricsService';
import {
  buildPacingSummary,
  computeRecentPractice,
  computeChartData,
  computeModuleStats,
  computeStats,
  getSessionAccuracy,
  getRecordedDurationSeconds,
  roundIeltsOverall,
} from '@/features/analytics/hooks/analyticsCalculations';
import { buildBandProgressView } from '@/features/analytics/components/bandJourneyUtils';

/**
 * Analytics Unit Tests
 * Tests for score trending, skill analysis, and data processing
 */

describe('Analytics - Band Score Calculations', () => {
  // Helper functions to test analytics logic
  const calculateBandScore = (correct: number, total: number): number => {
    const percentage = total > 0 ? (correct / total) * 100 : 0;

    if (percentage >= 90) return 9;
    if (percentage >= 80) return 8;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5;
    if (percentage >= 40) return 4;
    return 3;
  };

  it('should calculate band 9 for 90%+ correct', () => {
    expect(calculateBandScore(36, 40)).toBe(9);
  });

  it('should calculate band 7 for 70-79% correct', () => {
    expect(calculateBandScore(28, 40)).toBe(7);
  });

  it('should calculate band 5 for 50-59% correct', () => {
    expect(calculateBandScore(20, 40)).toBe(5);
  });

  it('should handle edge case of 0 questions', () => {
    expect(calculateBandScore(0, 0)).toBe(3);
  });
});

describe('Analytics - Moving Average', () => {
  const calculateMovingAverage = (scores: number[], window: number = 5): number => {
    if (scores.length === 0) return 0;
    const subset = scores.slice(-window);
    return subset.reduce((acc, val) => acc + val, 0) / subset.length;
  };

  it('should calculate moving average of last 5 scores', () => {
    const scores = [6, 6.5, 7, 7.5, 8];
    expect(calculateMovingAverage(scores)).toBe(7);
  });

  it('should handle fewer than 5 scores', () => {
    const scores = [6, 7, 8];
    expect(calculateMovingAverage(scores)).toBe(7);
  });

  it('should return 0 for empty scores', () => {
    expect(calculateMovingAverage([])).toBe(0);
  });

  it('should only use last N scores', () => {
    const scores = [5, 5, 5, 7, 8, 9, 10];
    expect(calculateMovingAverage(scores, 3)).toBeCloseTo(9);
  });
});

describe('Analytics - Skill Identification', () => {
  interface SkillScores {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
  }

  const identifyWeakestSkill = (scores: SkillScores): string => {
    const skills = Object.entries(scores);
    if (skills.length === 0) return 'unknown';

    return skills.reduce((weakest, current) => {
      return current[1] < weakest[1] ? current : weakest;
    })[0];
  };

  const identifyStrongestSkill = (scores: SkillScores): string => {
    const skills = Object.entries(scores);
    if (skills.length === 0) return 'unknown';

    return skills.reduce((strongest, current) => {
      return current[1] > strongest[1] ? current : strongest;
    })[0];
  };

  it('should identify reading as weakest skill', () => {
    const scores: SkillScores = { reading: 5.5, writing: 7, listening: 7.5, speaking: 6.5 };
    expect(identifyWeakestSkill(scores)).toBe('reading');
  });

  it('should identify listening as strongest skill', () => {
    const scores: SkillScores = { reading: 6, writing: 7, listening: 8, speaking: 6.5 };
    expect(identifyStrongestSkill(scores)).toBe('listening');
  });

  it('should handle equal scores (returns first match)', () => {
    const scores: SkillScores = { reading: 7, writing: 7, listening: 7, speaking: 7 };
    // When all equal, returns first in iteration order
    expect(typeof identifyWeakestSkill(scores)).toBe('string');
  });
});

describe('Analytics - Progress Tracking', () => {
  interface TestResult {
    date: string;
    score: number;
    skill: string;
  }

  const calculateProgressTrend = (results: TestResult[]): 'improving' | 'declining' | 'stable' => {
    if (results.length < 2) return 'stable';

    const recentResults = results.slice(-5);
    const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2));
    const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2));

    const firstAvg = firstHalf.reduce((acc, r) => acc + r.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, r) => acc + r.score, 0) / secondHalf.length;

    if (secondAvg - firstAvg >= 0.5) return 'improving';
    if (firstAvg - secondAvg >= 0.5) return 'declining';
    return 'stable';
  };

  it('should identify improving trend', () => {
    const results: TestResult[] = [
      { date: '2024-01-01', score: 5, skill: 'reading' },
      { date: '2024-01-02', score: 5.5, skill: 'reading' },
      { date: '2024-01-03', score: 6, skill: 'reading' },
      { date: '2024-01-04', score: 7, skill: 'reading' },
    ];
    expect(calculateProgressTrend(results)).toBe('improving');
  });

  it('should identify declining trend', () => {
    const results: TestResult[] = [
      { date: '2024-01-01', score: 8, skill: 'reading' },
      { date: '2024-01-02', score: 7, skill: 'reading' },
      { date: '2024-01-03', score: 6, skill: 'reading' },
      { date: '2024-01-04', score: 5, skill: 'reading' },
    ];
    expect(calculateProgressTrend(results)).toBe('declining');
  });

  it('should identify stable trend', () => {
    const results: TestResult[] = [
      { date: '2024-01-01', score: 7, skill: 'reading' },
      { date: '2024-01-02', score: 7.1, skill: 'reading' },
      { date: '2024-01-03', score: 6.9, skill: 'reading' },
      { date: '2024-01-04', score: 7, skill: 'reading' },
    ];
    expect(calculateProgressTrend(results)).toBe('stable');
  });

  it('should return stable for insufficient data', () => {
    const results: TestResult[] = [{ date: '2024-01-01', score: 7, skill: 'reading' }];
    expect(calculateProgressTrend(results)).toBe('stable');
  });
});

describe('Analytics - Time Analysis', () => {
  const calculateAverageTestTime = (testTimes: number[]): number => {
    if (testTimes.length === 0) return 0;
    return testTimes.reduce((acc, time) => acc + time, 0) / testTimes.length;
  };

  const isUnderTimeLimit = (time: number, limit: number): boolean => {
    return time <= limit;
  };

  it('should calculate average test time', () => {
    const times = [55, 58, 60, 62, 65]; // minutes
    expect(calculateAverageTestTime(times)).toBe(60);
  });

  it('should identify test under time limit', () => {
    expect(isUnderTimeLimit(55, 60)).toBe(true);
  });

  it('should identify test over time limit', () => {
    expect(isUnderTimeLimit(65, 60)).toBe(false);
  });
});

describe('Analytics - Data Quality Guards', () => {
  it('distinguishes an unscored session from a genuine zero band', () => {
    const stats = computeStats(
      [
        { score: null, is_completed: true },
        { score: 0, is_completed: true },
      ],
      [],
      {},
      0
    );

    expect(stats.scoredTests).toBe(1);
    expect(stats.avgScore).toBe('0.0');
  });

  it('uses IELTS half-band rounding for a qualified Overall result', () => {
    expect(roundIeltsOverall([6.5, 6.5, 6, 6])).toBe(6.5);
    expect(roundIeltsOverall([7, 7, 6.5, 6.5])).toBe(7);
    expect(roundIeltsOverall([7, 7, 7])).toBeNull();
  });

  it('should never return a negative unanswered count', () => {
    const patterns = calculateErrorPatterns(
      { answer_a: 'one', answer_b: 'two' },
      { answer_a: 'three', answer_b: 'four' },
      1,
      {},
      null
    );

    expect(patterns.unansweredCount).toBe(0);
  });

  it('does not invent accuracy when answer totals are missing', () => {
    expect(getSessionAccuracy({ correct: 12 })).toBeNull();
    expect(getSessionAccuracy({ correctAnswers: 18, totalQuestions: 20 })).toBe(90);
    expect(getSessionAccuracy({ correct: 22, total: 20 })).toBe(100);
  });

  it('reports only learner-controlled Reading pacing', () => {
    const pacing = buildPacingSummary({ reading: 42, writing: 0, listening: 38 });

    expect(pacing.map((item) => item.type)).toEqual(['reading']);
    expect(pacing.find((item) => item.type === 'reading')).toMatchObject({
      averageMinutes: 42,
      benchmarkMinutes: 60,
      deltaMinutes: -18,
    });
  });

  it('prefers tracked elapsed time over initialized duration values', () => {
    expect(
      getRecordedDurationSeconds({
        test_type: 'writing',
        duration_minutes: 60,
        content_data: { timeMetrics: { totalTimeSpent: 1500 }, time_remaining: 2100 },
      })
    ).toBe(1500);

    expect(
      getRecordedDurationSeconds({
        test_type: 'writing',
        duration_minutes: 60,
        content_data: {},
      })
    ).toBeNull();

    expect(
      getRecordedDurationSeconds({
        test_type: 'writing',
        duration_minutes: 60,
        content_data: { time_remaining: 2100 },
      })
    ).toBe(1500);
  });

  it('builds recent practice rows from completed session facts', () => {
    const sessions = [
      {
        id: 'session-1',
        test_type: 'Reading',
        score: 6.5,
        duration_minutes: 18,
        actual_duration_seconds: 1080,
        completed_at: '2026-07-18T10:00:00Z',
        content_data: { correctAnswers: 30, totalQuestions: 40 },
        passage: { title: 'Academic Reading Test 4' },
      },
      {
        id: 'session-2',
        test_type: 'speaking',
        score: 6,
        created_at: '2026-07-17T09:15:00Z',
        completed_at: '2026-07-17T10:00:00Z',
        content_data: {},
      },
    ];
    const moduleStats = computeModuleStats(sessions);
    const chartData = computeChartData(sessions, moduleStats);

    expect(chartData.recentPractice[0]).toMatchObject({
      title: 'Academic Reading Test 4',
      type: 'reading',
      score: 6.5,
      accuracy: 75,
      durationMinutes: 18,
      resultData: {
        bandScore: 6.5,
        correctAnswers: 30,
        totalQuestions: 40,
      },
    });
    expect(chartData.recentPractice[1]).toMatchObject({
      title: 'Speaking practice',
      accuracy: null,
      durationMinutes: null,
    });
  });

  it('keeps every completed session available to the view-all results dialog', () => {
    const sessions = Array.from({ length: 8 }, (_, index) => ({
      id: `session-${index}`,
      test_type: 'reading',
      score: 6,
      completed_at: `2026-07-${String(18 - index).padStart(2, '0')}T10:00:00Z`,
      content_data: { correctAnswers: 28, totalQuestions: 40 },
    }));

    expect(computeRecentPractice(sessions)).toHaveLength(8);
  });

  it('compares only the latest two results in the same module', () => {
    const view = buildBandProgressView({
      tab: 'reading',
      moduleHistory: {
        reading: [
          { date: 'Jul 1', score: 5 },
          { date: 'Jul 8', score: 5.5 },
          { date: 'Jul 15', score: 6.5 },
        ],
      },
    });

    expect(view.current).toBe(6.5);
    expect(view.change).toBe(1);
    expect(view.hasTrend).toBe(true);
  });

  it('unlocks Overall only with all four modules and requires two each for a trend', () => {
    const oneSet = ['reading', 'writing', 'listening', 'speaking'].map((test_type, index) => ({
      id: `${test_type}-1`,
      test_type,
      score: 6 + index * 0.5,
      completed_at: `2026-07-${10 + index}T10:00:00Z`,
    }));
    const current = computeChartData(oneSet, computeModuleStats(oneSet)).overallProgress;
    expect(current).toMatchObject({ qualified: true, current: 7, hasTrend: false });

    const partial = oneSet.filter((session) => session.test_type !== 'speaking');
    expect(computeChartData(partial, computeModuleStats(partial)).overallProgress).toMatchObject({
      qualified: false,
      current: null,
      hasTrend: false,
    });

    const twoSets = [
      ...oneSet,
      ...oneSet.map((session) => ({
        ...session,
        id: `${session.test_type}-2`,
        score: Number(session.score) + 0.5,
        completed_at: '2026-07-20T10:00:00Z',
      })),
    ].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
    const trend = computeChartData(twoSets, computeModuleStats(twoSets)).overallProgress;
    expect(trend.qualified).toBe(true);
    expect(trend.hasTrend).toBe(true);
    expect(trend.history).toHaveLength(2);
  });
});
