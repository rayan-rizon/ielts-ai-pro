import { describe, expect, it } from 'vitest';
import {
  computeAdvancedMetrics,
  computeExamReadiness,
  computeStats,
  isAbandonedSession,
} from '@/features/analytics/hooks/analyticsCalculations';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

describe('Analytics accuracy guards', () => {
  it('does not invent a Band 7 target when the learner has not set one', () => {
    const stats = computeStats(
      [{ is_completed: true, test_type: 'reading', score: 6 }],
      [],
      { target_band_score: null },
      0
    );

    expect(stats.targetScore).toBeNull();
  });

  it('requires a saved target and all four measured modules for readiness', () => {
    const baseStats = {
      targetScore: 7,
      measuredTests: 4,
      avgScore: '7.0',
      overallEstimate: 7,
      practiceRhythm: { consistency: 100 },
    };
    const completeModules = ['reading', 'writing', 'listening', 'speaking'].map((type) => ({
      type,
      count: 1,
      volatility: 0,
    }));

    expect(computeExamReadiness(baseStats, completeModules.slice(0, 3))).toBeNull();
    expect(computeExamReadiness({ ...baseStats, targetScore: null }, completeModules)).toBeNull();
    expect(computeExamReadiness(baseStats, completeModules)).toMatchObject({
      score: 100,
      verdict: 'Exam ready',
      missingModules: [],
    });
  });

  it('recognizes Task 2 Task Response evidence in the combined Writing criterion', () => {
    const metrics = computeAdvancedMetrics([
      {
        test_type: 'writing',
        evaluation_version: CURRENT_EVALUATION_VERSION,
        evaluation_status: 'complete',
        content_data: {
          ai_feedbacks: {
            'Task 2': { criteriaScores: { TaskResponse: 7.5 } },
          },
        },
      },
    ]);

    expect(metrics.writingCriteria).toMatchObject({
      taskAchievement: 7.5,
      sampleCounts: { taskAchievement: 1 },
      hasData: true,
    });
  });

  it('excludes abandoned objective sessions from detailed averages and reports evidence coverage', () => {
    const metrics = computeAdvancedMetrics([
      {
        test_type: 'reading',
        score: 0,
        actual_duration_seconds: 120,
        content_data: {
          totalQuestions: 40,
          correctAnswers: 0,
          typeStats: { matching_headings: { correct: 0, total: 40 } },
          sectionStats: [{ correct: 0, total: 40 }],
        },
      },
      {
        test_type: 'listening',
        score: 7,
        actual_duration_seconds: 1800,
        content_data: {
          totalQuestions: 40,
          correctAnswers: 30,
          typeStats: { gap_fill: { correct: 15, total: 20 } },
        },
      },
    ]);

    expect(metrics.typeAccuracy).toEqual([
      expect.objectContaining({ module: 'listening', type: 'Gap Fill', correct: 15, total: 20 }),
    ]);
    expect(metrics.sectionPerformance).toEqual([]);
    expect(metrics.evidenceCoverage).toEqual({
      objectiveSessions: 1,
      typeSessions: 1,
      sectionSessions: 0,
    });
  });

  it('never classifies short Writing or Speaking evaluations as abandoned objective tests', () => {
    expect(
      isAbandonedSession({ test_type: 'writing', score: 0, actual_duration_seconds: 120 })
    ).toBe(false);
    expect(
      isAbandonedSession({ test_type: 'speaking', score: 0, actual_duration_seconds: 120 })
    ).toBe(false);
  });
});
