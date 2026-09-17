import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  aggregateWritingCriteria,
  calculateWeightedWritingBand,
  isCurrentWritingFeedbackCache,
} from '@/features/testing/writing/utils/evaluationEvidence';
import {
  CURRENT_EVALUATION_VERSION,
  WRITING_CALIBRATION_REVISION,
} from '@/features/testing/shared/evaluationVersion';
import { rankBestNextTask } from '@/features/learning/components/dashboard/dashboardUtils';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';
import {
  findRecurringObjectiveMistakes,
  scheduleRecurringRepair,
} from '../../../supabase/functions/_shared/learningPathV2';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

const speakingCardSources = [
  readFileSync('src/features/testing/speaking/SpeakingCardComponents.jsx', 'utf8'),
  readFileSync('src/features/testing/speaking/SpeakingCardView.jsx', 'utf8'),
];

const writingFeedback = (band: number, grammar: number) => ({
  overallBand: band,
  evaluationVersion: CURRENT_EVALUATION_VERSION,
  writingCalibrationRevision: WRITING_CALIBRATION_REVISION,
  originalSource: '<p>A learner response.</p>',
  taskPrompt: 'Discuss both views.',
  imageUrl: null,
  criteriaScores: {
    TaskResponse: band,
    CoherenceAndCohesion: band,
    LexicalResource: band,
    GrammaticalRangeAndAccuracy: grammar,
  },
});

describe('connected learner evidence', () => {
  it('weights Writing Task 2 twice and rounds to an IELTS half band', () => {
    expect(calculateWeightedWritingBand(6, 7)).toBe(6.5);
    expect(calculateWeightedWritingBand(null, 7)).toBe(7);
    expect(calculateWeightedWritingBand(null, null)).toBeNull();

    const criteria = aggregateWritingCriteria(writingFeedback(6, 5), writingFeedback(7, 6.5));
    expect(criteria).toMatchObject({ taskAchievement: 6.5, grammar: 6 });
  });

  it('reuses only current feedback for the exact unchanged source', () => {
    const feedback = writingFeedback(6.5, 6);
    expect(
      isCurrentWritingFeedbackCache({
        feedback,
        response: ' A learner response. ',
        prompt: 'Discuss both views.',
      })
    ).toBe(true);
    expect(
      isCurrentWritingFeedbackCache({
        feedback,
        response: 'A changed learner response.',
        prompt: 'Discuss both views.',
      })
    ).toBe(false);
    expect(
      isCurrentWritingFeedbackCache({
        feedback: { ...feedback, evaluationVersion: 'legacy' },
        response: 'A learner response.',
        prompt: 'Discuss both views.',
      })
    ).toBe(false);
    expect(
      isCurrentWritingFeedbackCache({
        feedback: { ...feedback, writingCalibrationRevision: WRITING_CALIBRATION_REVISION - 1 },
        response: 'A learner response.',
        prompt: 'Discuss both views.',
      })
    ).toBe(false);
  });

  it('carries the exact activity id into every launched test route', () => {
    const activityId = '63a87df8-366b-4e84-9962-6253523666ef';
    for (const module of ['reading', 'listening', 'writing', 'speaking']) {
      const url = buildActivityUrl({
        id: activityId,
        module,
        routing: { route: module, test_id: 'test-1' },
      });
      expect(url).toContain(`activityId=${activityId}`);
    }

    expect(
      withLearningActivity('/speaking-test?test-id=test-1', `?activityId=${activityId}&mode=exam`)
    ).toBe(`/speaking-test?test-id=test-1&activityId=${activityId}&mode=exam`);
    for (const source of speakingCardSources) {
      expect(source).not.toContain('to={`/speaking-test?test-id=${test.id}`}');
      expect(source).not.toContain('to={`/speaking-test?test-id=${test.id}&retake=true`}');
    }
  });

  it('ranks the best next task deterministically from target gap and due evidence', () => {
    const days = [
      {
        date: '2026-07-30',
        capacity: 30,
        tasks: [
          {
            activity_key: 'writing-task',
            module: 'writing',
            priority: 'medium',
            estimated_minutes: 30,
            skill_targets: ['writing_grammar'],
          },
          {
            activity_key: 'reading-task',
            module: 'reading',
            priority: 'medium',
            estimated_minutes: 30,
            skill_targets: ['reading_headings'],
          },
        ],
      },
    ];
    const context = {
      targetBand: 7,
      readiness: { writing: { latest: 6.5 }, reading: { latest: 5 } },
      evidence: {
        measured_priorities: [{ module: 'reading', skill_code: 'reading_headings' }],
        due_reviews: [{ skill_code: 'reading_headings' }],
      },
    };

    expect(rankBestNextTask(days, context)?.activity_key).toBe('reading-task');
    expect(rankBestNextTask(days, context)?.activity_key).toBe('reading-task');
  });

  it('schedules repair only after the same objective mistake appears twice', () => {
    const session = (id: string, correct: number) => ({
      id,
      test_type: 'reading',
      is_completed: true,
      content_data: { typeStats: { matching_headings: { correct, total: 5 } } },
    });
    expect(findRecurringObjectiveMistakes([session('one', 3)])).toEqual([]);

    const mistakes = findRecurringObjectiveMistakes([session('one', 3), session('two', 3)]);
    expect(mistakes).toEqual([{ module: 'reading', type: 'matching_headings', sessionCount: 2 }]);

    const schedule = {
      Monday: [{ activity_key: 'existing', title: 'General practice', module: 'reading' }],
    };
    expect(scheduleRecurringRepair(schedule, mistakes[0]).Monday[0]).toMatchObject({
      activity_key: 'v2:Monday:repair:recurring:reading:matching_headings:0',
      requested_mode: 'practice',
      stage_key: 'repair',
      evidence_key: 'recurring:reading:matching_headings',
      activity_type: 'targeted_repair',
      priority: 'high',
      skill_targets: ['reading_matching_headings'],
    });
  });
});
