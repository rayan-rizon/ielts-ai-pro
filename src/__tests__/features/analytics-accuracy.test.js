import { describe, expect, it } from 'vitest';

import {
  calculateModuleImprovement,
  computeAdvancedMetrics,
  getSessionAccuracy,
} from '@/features/analytics/hooks/analyticsCalculations';
import { calculateErrorPatterns } from '@/services/testMetricsService';

let id = 0;
const session = (overrides) => ({
  id: `s${++id}`,
  is_completed: true,
  score: 6,
  completed_at: new Date(Date.UTC(2026, 9, 1, 0, id)).toISOString(),
  actual_duration_seconds: 1800,
  ...overrides,
});

const record = (questionNumber, userAnswer, correctAnswer, isCorrect) => ({
  questionNumber,
  userAnswer,
  correctAnswer,
  isCorrect,
});

describe('band trend', () => {
  it('compares each module with itself, never across modules', () => {
    // Newest first: reading 8 → 8, writing 5 → 5. A cross-module comparison
    // read this as a fall; neither module moved.
    const sessions = [
      session({ test_type: 'writing', score: 5 }),
      session({ test_type: 'reading', score: 8 }),
      session({ test_type: 'writing', score: 5 }),
      session({ test_type: 'reading', score: 8 }),
    ];
    expect(calculateModuleImprovement(sessions)).toBe(0);
  });

  it('averages the per-module movement', () => {
    const sessions = [
      // Later rows complete later: reading 6 → 7 (+1), listening 6 → 6 (0).
      session({ test_type: 'reading', score: 6 }),
      session({ test_type: 'reading', score: 7 }),
      session({ test_type: 'listening', score: 6 }),
      session({ test_type: 'listening', score: 6 }),
    ];
    expect(calculateModuleImprovement(sessions)).toBe(0.5);
  });
});

describe('answer analysis', () => {
  const readingContent = {
    correctAnswers: 1,
    totalQuestions: 4,
    errorPatterns: { nearMissCount: 3, unansweredCount: 3, troubleTypes: [] },
    answerChangeCounts: { a: 1 },
    timePerQuestionSeconds: { b: 10, c: 200 },
    correctAnswersMap: {
      a: record(1, 'forty eight', 'forty-eight', true),
      b: record(2, 'enviroment', 'environment', false),
      c: record(3, 'lake', 'river', false),
      d: record(4, '', 'stress', null),
    },
  };
  const listeningContent = {
    correctAnswers: 0,
    totalQuestions: 2,
    errorPatterns: { nearMissCount: 0, unansweredCount: 1, troubleTypes: [] },
    answerChangeCounts: {},
    correctAnswersMap: {
      x: record(1, '', 'soil', false),
      y: record(2, 'colour', 'color', false),
    },
  };

  const metrics = computeAdvancedMetrics([
    session({ test_type: 'reading', content_data: readingContent }),
    session({ test_type: 'listening', content_data: listeningContent }),
  ]).enhancedMetrics;

  it('recounts near misses from graded records, skipping accepted answers', () => {
    // reading: "enviroment" (wrong, close); listening: "colour" (wrong, close).
    expect(metrics.totalNearMisses).toBe(2);
  });

  it('recounts blanks from graded records', () => {
    expect(metrics.totalUnanswered).toBe(2);
  });

  it('compares revisions only on answered reading questions', () => {
    expect(metrics.behaviour.revised.total).toBe(1);
    expect(metrics.behaviour.firstAnswer.total).toBe(2);
  });

  it('counts a rushed near miss once in the mistakes total', () => {
    expect(metrics.totalRushed).toBe(1);
    expect(metrics.distinctMistakes).toBe(
      metrics.totalNearMisses +
        metrics.totalUnanswered +
        metrics.totalRushed +
        metrics.totalOveranalyzed -
        1
    );
  });
});

describe('time per test', () => {
  it('weights every recorded test equally', () => {
    const result = computeAdvancedMetrics([
      session({ test_type: 'reading', actual_duration_seconds: 60 * 60 }),
      session({ test_type: 'reading', actual_duration_seconds: 60 * 60 }),
      session({ test_type: 'reading', actual_duration_seconds: 60 * 60 }),
      session({ test_type: 'speaking', actual_duration_seconds: 12 * 60 }),
    ]);
    expect(result.avgMinutesPerTest).toBe(48);
  });
});

describe('percentages and near misses at save time', () => {
  it('rounds exact halves up', () => {
    expect(getSessionAccuracy({ correctAnswers: 23, totalQuestions: 40 })).toBe(58);
  });

  it('never calls an accepted answer a near miss', () => {
    const map = {
      a: record(1, 'forty eight', 'forty-eight', true),
      b: record(2, 'enviroment', 'environment', false),
    };
    const patterns = calculateErrorPatterns({ a: 'forty eight', b: 'enviroment' }, map, 2, {});
    expect(patterns.nearMissCount).toBe(1);
  });
});
