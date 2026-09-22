import { describe, expect, it } from 'vitest';

import { buildLearnerEvidence } from '../../../supabase/functions/_shared/learnerEvidence';

const session = (id: string, score: number, completedAt: string) => ({
  id,
  test_type: 'reading',
  test_mode: 'practice',
  score,
  is_completed: true,
  completed_at: completedAt,
  content_data: { correctAnswers: 20 },
});

describe('AI Coach learner evidence', () => {
  it('calculates comparable score changes in application code', () => {
    const context = buildLearnerEvidence({
      profile: { subscription_tier: 'free' },
      sessions: [
        session('17ae5770-a2c7-40fe-85a8-8fb1326090a1', 6.5, '2026-09-20T10:00:00Z'),
        session('ab0386fb-0762-46c2-a5c9-62c3d6f5dbea', 6, '2026-09-10T10:00:00Z'),
      ],
      skills: [],
      grammarAttempts: [],
      vocabularyItems: [],
      vocabularyReviews: [],
      activities: [],
    });
    expect(
      context.evidence.find((item: any) => item.category === 'comparable_trend')
    ).toMatchObject({ value: { latest: 6.5, previous: 6, delta: 0.5 } });
  });

  it('keeps Learning Path activities and actions behind active paid access', () => {
    const activity = {
      id: '61ab0c0f-83e8-4e99-bcd0-9e4f6454a9c4',
      title: 'Reading headings practice',
      module: 'reading',
      activity_type: 'practice',
      skill_targets: ['matching_headings'],
      scheduled_date: '2026-09-23',
      is_completed: false,
    };
    const free = buildLearnerEvidence({
      profile: { subscription_tier: 'free' },
      sessions: [],
      skills: [],
      grammarAttempts: [],
      vocabularyItems: [],
      vocabularyReviews: [],
      activities: [activity],
    });
    const paid = buildLearnerEvidence({
      profile: { subscription_tier: 'pro' },
      sessions: [],
      skills: [],
      grammarAttempts: [],
      vocabularyItems: [],
      vocabularyReviews: [],
      activities: [activity],
    });
    expect(free.evidence.some((item: any) => item.category === 'planned_activity')).toBe(false);
    expect(free.eligibleActions.some((item: any) => item.type === 'reschedule_activity')).toBe(
      false
    );
    expect(paid.evidence.some((item: any) => item.category === 'planned_activity')).toBe(true);
    expect(paid.eligibleActions.some((item: any) => item.type === 'reschedule_activity')).toBe(
      true
    );
  });
});
