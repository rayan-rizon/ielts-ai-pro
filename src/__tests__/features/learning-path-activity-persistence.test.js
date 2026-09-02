import { describe, expect, it, vi } from 'vitest';
import {
  isActivitySchemaCompatibilityError,
  upsertLearningPathActivity,
} from '@/features/learning/utils/activityPersistence';

const missingCompletionPolicy = {
  message:
    "Could not find the 'completion_policy' column of 'learning_path_activities' in the schema cache",
};

function clientWithResults(...results) {
  const upsert = vi.fn(() => Promise.resolve(results.shift()));
  return {
    from: vi.fn(() => ({ upsert })),
    upsert,
  };
}

describe('Learning Path activity persistence', () => {
  const payload = {
    learning_path_id: 'path-1',
    user_id: 'user-1',
    activity_key: 'plan:today:primary',
    scheduled_day: 'friday',
    scheduled_date: '2026-07-31',
    is_completed: true,
    completion_policy: 'self_reported',
    stage_key: 'repair',
    requested_mode: 'practice',
    evidence_key: 'skill:reading_matching_features',
    title: 'Reading practice',
  };

  it('identifies only missing newer activity columns as compatibility errors', () => {
    expect(isActivitySchemaCompatibilityError(missingCompletionPolicy)).toBe(true);
    expect(isActivitySchemaCompatibilityError({ message: 'Permission denied' })).toBe(false);
  });

  it('retries a task mark with the established schema when activity metadata is unavailable', async () => {
    const client = clientWithResults(
      { data: null, error: missingCompletionPolicy },
      { data: { id: 'activity-1' }, error: null }
    );

    await expect(upsertLearningPathActivity(client, payload)).resolves.toMatchObject({
      data: { id: 'activity-1' },
      error: null,
    });

    expect(client.upsert).toHaveBeenCalledTimes(2);
    expect(client.upsert.mock.calls[0][0]).toMatchObject({
      completion_policy: 'self_reported',
      scheduled_date: '2026-07-31',
    });
    expect(client.upsert.mock.calls[1][0]).not.toHaveProperty('completion_policy');
    expect(client.upsert.mock.calls[1][0]).not.toHaveProperty('scheduled_date');
    expect(client.upsert.mock.calls[1][0]).toMatchObject({
      activity_key: 'plan:today:primary',
      is_completed: true,
    });
  });
});
