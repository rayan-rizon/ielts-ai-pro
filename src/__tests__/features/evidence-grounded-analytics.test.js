import { describe, expect, it } from 'vitest';
import {
  buildPacingSummary,
  computeAdvancedMetrics,
} from '@/features/analytics/hooks/analyticsCalculations';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

describe('evidence-grounded Analytics calculations', () => {
  it('does not surface historical per-question pace or inferred cognitive skill claims', () => {
    const result = computeAdvancedMetrics([
      {
        id: 'reading-1',
        test_type: 'reading',
        is_completed: true,
        score: 6,
        duration_minutes: 58,
        content_data: {
          totalQuestions: 10,
          correctAnswers: 5,
          typeStats: { matching_headings: { correct: 2, total: 5 } },
          timeMetrics: {
            totalTimeSpent: 3480,
            rushedQuestions: 8,
            overanalyzedQuestions: 4,
          },
          skillGaps: {
            scanningEfficiency: 20,
            globalComprehension: 30,
          },
          errorPatterns: {
            nearMissCount: 1,
            unansweredCount: 2,
            troubleTypes: ['matching_headings'],
          },
        },
      },
    ]);

    expect(result.enhancedMetrics.totalRushed).toBe(0);
    expect(result.enhancedMetrics.totalOveranalyzed).toBe(0);
    expect(result.enhancedMetrics.skillGaps).toEqual([]);
    expect(result.enhancedMetrics.errorAuditData.map((item) => item.name)).toEqual([
      'Almost Correct',
      'Left Blank',
    ]);
    expect(result.typeAccuracy[0]).toMatchObject({
      module: 'reading',
      type: 'Matching Headings',
      correct: 2,
      total: 5,
    });
  });

  it('keeps identical question formats separate by IELTS module', () => {
    const result = computeAdvancedMetrics([
      {
        test_type: 'reading',
        content_data: { typeStats: { multiple_choice: { correct: 4, total: 5 } } },
      },
      {
        test_type: 'listening',
        content_data: { typeStats: { multiple_choice: { correct: 1, total: 5 } } },
      },
    ]);

    expect(result.typeAccuracy).toEqual([
      expect.objectContaining({ module: 'listening', type: 'Multiple Choice', accuracy: 20 }),
      expect.objectContaining({ module: 'reading', type: 'Multiple Choice', accuracy: 80 }),
    ]);
  });

  it('limits pacing comparison to learner-controlled Reading duration', () => {
    expect(buildPacingSummary({ reading: 58, listening: 35, writing: 62, speaking: 14 })).toEqual([
      {
        type: 'reading',
        label: 'Reading',
        averageMinutes: 58,
        benchmarkMinutes: 60,
        deltaMinutes: -2,
      },
    ]);
  });

  it('reports Writing and Speaking criterion sample counts separately from missing data', () => {
    const result = computeAdvancedMetrics([
      {
        test_type: 'writing',
        evaluation_status: 'complete',
        evaluation_version: CURRENT_EVALUATION_VERSION,
        content_data: {
          criteriaScores: {
            taskAchievement: 6,
            coherence: 6.5,
            lexicalResource: 7,
            grammar: 5.5,
          },
        },
      },
      {
        test_type: 'speaking',
        evaluation_status: 'complete',
        evaluation_version: CURRENT_EVALUATION_VERSION,
        content_data: {
          criteriaScores: {
            fluency: 6,
            lexicalResource: 6.5,
            grammar: 6,
          },
        },
      },
    ]);

    expect(result.writingCriteria.sampleCounts).toMatchObject({
      taskAchievement: 1,
      coherence: 1,
      lexicalResource: 1,
      grammar: 1,
    });
    expect(result.speakingCriteria.sampleCounts).toMatchObject({
      fluency: 1,
      lexicalResource: 1,
      grammar: 1,
      pronunciation: 0,
    });
    expect(result.speakingCriteria.pronunciation).toBeNull();
  });

  it('counts a present zero criterion while leaving absent criteria unavailable', () => {
    const result = computeAdvancedMetrics([
      {
        test_type: 'writing',
        evaluation_status: 'complete',
        evaluation_version: CURRENT_EVALUATION_VERSION,
        content_data: {
          criteriaScores: {
            taskAchievement: 0,
          },
        },
      },
    ]);

    expect(result.writingCriteria.taskAchievement).toBe(0);
    expect(result.writingCriteria.sampleCounts.taskAchievement).toBe(1);
    expect(result.writingCriteria.coherence).toBeNull();
    expect(result.writingCriteria.sampleCounts.coherence).toBe(0);
  });

  it('keeps a legacy overall band but excludes its old criterion details', () => {
    const legacy = {
      test_type: 'writing',
      is_completed: true,
      score: 6.5,
      evaluation_status: 'legacy',
      content_data: { criteriaScores: { taskAchievement: 9 } },
    };

    const result = computeAdvancedMetrics([legacy]);

    expect(result.writingCriteria.hasData).toBe(false);
    expect(result.writingCriteria.taskAchievement).toBeNull();
  });
});
