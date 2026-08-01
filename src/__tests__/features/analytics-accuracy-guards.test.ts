import { describe, expect, it } from 'vitest';
import {
  computeAdvancedMetrics,
  computeExamReadiness,
  computeStats,
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
});
