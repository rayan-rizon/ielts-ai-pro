import { describe, expect, it } from 'vitest';
import { readMigrationSource } from '../helpers/migrationSource';

const migration = readMigrationSource('connected_learner_evidence_v5').toLowerCase();

describe('connected learner evidence v5 migration', () => {
  it('adds constrained, nullable evaluation and timing metadata', () => {
    expect(migration).toContain('learning_path_activity_id uuid');
    expect(migration).toContain('evaluation_status text');
    expect(migration).toContain('evaluation_version text');
    expect(migration).toContain('evaluated_at timestamptz');
    expect(migration).toContain('actual_duration_seconds integer');
    expect(migration).toContain(
      "evaluation_status in ('not_requested', 'pending', 'complete', 'failed', 'legacy')"
    );
    expect(migration).toContain('actual_duration_seconds between 1 and 14400');
  });

  it('marks only existing reports as legacy and leaves unevaluated responses analyzable', () => {
    expect(migration).toContain("set evaluation_status = 'legacy'");
    expect(migration).toContain("content_data ? 'aI_feedbacks'".toLowerCase());
    expect(migration).toContain("content_data ? 'finalevaluation'");
    expect(migration).toContain("set evaluation_status = 'not_requested'");
  });

  it('completes only the activity carried by the exact test session', () => {
    expect(migration).toContain('new.learning_path_activity_id is not null');
    expect(migration).toContain('where activity.id = new.learning_path_activity_id');
    expect(migration).toContain('activity.user_id = new.user_id');
    expect(migration).toContain("lower(coalesce(activity.module, '')) = lower(new.test_type)");
    expect(migration).not.toContain('lower(scheduled_day) = lower(v_day_name)');
  });

  it('stores verified outcomes and repairs historical auto-completions', () => {
    expect(migration).toContain('add column if not exists outcome_band numeric');
    expect(migration).toContain('add column if not exists outcome_accuracy numeric');
    expect(migration).toContain('add column if not exists completion_source text');
    expect(migration).toContain("outcome_data ->> 'test_score'");
    expect(migration).toContain("completion_source = 'test_session'");
    expect(migration).toContain("completion_source = 'manual'");
  });

  it('updates Writing and Speaking skill rows only from v5 evidence', () => {
    expect(migration).toContain('add column if not exists evidence_version text');
    expect(migration).toContain("new.evaluation_version <> '2026-07-29-v5'");
    expect(migration).toContain("evidence_version = '2026-07-29-v5'");
    expect(migration).toContain('trigger_update_current_evaluation_skill_evidence');
    expect(migration).toContain(
      "lower(coalesce(new.module, '')) not in ('writing', 'speaking', 'grammar')"
    );
  });

  it('keeps the saved Overall estimate qualified and uses actual study time', () => {
    expect(migration).toContain('when count(*) = 4');
    expect(migration).toContain("evaluation_version = '2026-07-29-v5'");
    expect(migration).toContain('actual_duration_seconds / 60.0');
    expect(migration).not.toContain('when duration_minutes > 0');
  });
});
