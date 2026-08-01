import { describe, expect, it } from 'vitest';
import {
  buildLearningPathData,
  buildSkillMap,
} from '@/features/learning/hooks/learningPathDataModel';

describe('Learning Path combined data model', () => {
  it('keeps current persisted activity fields from the combined RPC', () => {
    const result = buildLearningPathData({
      learningPath: {
        id: 'path-1',
        path_data: JSON.stringify({ version: 2 }),
        activities_completed: { 'task-1': true },
      },
      activities: [
        {
          id: 'activity-1',
          activity_key: 'task-1',
          scheduled_date: '2026-08-02',
          stage_key: 'repair',
          completion_policy: 'verified_test',
          evidence_key: 'reading_inference',
          outcome_accuracy: 0.8,
        },
      ],
      stats: { totalTests: 3, sessions: [] },
      skillProficiencies: [],
    });

    expect(result.pathData.path).toEqual({ version: 2 });
    expect(result.pathData.activityByKey['task-1']).toMatchObject({
      scheduled_date: '2026-08-02',
      stage_key: 'repair',
      completion_policy: 'verified_test',
      evidence_key: 'reading_inference',
      outcome_accuracy: 0.8,
    });
    expect(result.statsData.totalTests).toBe(3);
  });

  it('rejects stale generated writing criteria but preserves current and measured skills', () => {
    const result = buildSkillMap(
      [
        {
          skill_code: 'writing_coherence',
          module: 'writing',
          mastery_probability: 0.4,
          evidence_version: 'stale-version',
        },
        {
          skill_code: 'speaking_fluency',
          module: 'speaking',
          mastery_probability: 0.6,
          evidence_version: '2026-07-29-v5',
        },
        {
          skill_code: 'reading_inference',
          module: 'reading',
          mastery_probability: 0.7,
        },
      ],
      []
    );

    expect(result.totals.skills).toBe(2);
    expect(result.byModule.writing).toBeUndefined();
    expect(result.byModule.speaking[0].skill_code).toBe('speaking_fluency');
    expect(result.byModule.reading[0].skill_code).toBe('reading_inference');
  });
});
