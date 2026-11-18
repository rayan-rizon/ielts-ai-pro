import { describe, expect, it } from 'vitest';
import { buildLearnerEvidence } from '../../../supabase/functions/_shared/learnerEvidence';

const result = (id: string, type: string, content: object, score: number) => ({
  id,
  test_type: type,
  test_mode: 'practice',
  content_data: content,
  score,
  is_completed: true,
  completed_at: `2026-11-0${id}T12:00:00Z`,
});

describe('Coach score evidence', () => {
  it('distinguishes partial objective results from a full-module band', () => {
    const { evidence } = buildLearnerEvidence({
      sessions: [
        result('1', 'listening', { totalQuestions: 10, correctAnswers: 1 }, 1),
        result('2', 'listening', { totalQuestions: 40, correctAnswers: 23 }, 6),
      ],
    });
    expect(evidence.find((item) => item.id === 'session:1')?.value).toMatchObject({
      scoreUnit: 'practice_band_estimate',
      coverage: 'partial',
      total: 10,
      correct: 1,
    });
    expect(evidence.find((item) => item.id === 'session:2')?.value).toMatchObject({
      scoreUnit: 'practice_band_estimate',
      coverage: 'full',
      total: 40,
      correct: 23,
    });
    expect(evidence.some((item) => item.category === 'comparable_trend')).toBe(false);
  });

  it('compares Writing attempts only within the same known task', () => {
    const { evidence } = buildLearnerEvidence({
      sessions: [
        result('3', 'writing', { activeType: 'task2' }, 7),
        result('2', 'writing', { activeType: 'task1' }, 4),
        result('1', 'writing', { activeType: 'task2' }, 6),
      ],
    });
    expect(evidence.filter((item) => item.category === 'comparable_trend')).toEqual([
      expect.objectContaining({
        value: expect.objectContaining({
          task: 'Task 2',
          sampleCount: 2,
          latest: 7,
          previous: 6,
          delta: 1,
        }),
      }),
    ]);
  });
});
