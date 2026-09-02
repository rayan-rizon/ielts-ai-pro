import { readMigrationSource } from '../helpers/migrationSource';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource('20260722170000_learning_path_v2.sql').toLowerCase();
const verifiedActivityMigration = readMigrationSource(
  '20260730184647_learning_path_verified_activity_contract.sql'
).toLowerCase();

describe('Learning Path migration contract', () => {
  it('adds validated versioned JSON availability while preserving the weekly field', () => {
    expect(migration).toContain('add column if not exists study_availability jsonb');
    expect(migration).toContain('users_study_availability_valid');
    expect(migration).toContain('entry.minutes');
    expect(migration).toContain('between 20 and 240');
    expect(migration).toContain('study_hours_goal');
  });

  it('hardens touched RPCs with ownership, empty paths, and restricted grants', () => {
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain('profile.auth_id = auth.uid()');
    expect(migration).toContain('revoke all on function public.get_learning_path_data() from anon');
    expect(migration).toContain(
      'revoke all on function public.save_learning_path_v2(jsonb, jsonb) from public'
    );
    expect(migration).toContain(
      'grant execute on function public.save_learning_path_v2(jsonb, jsonb) to authenticated'
    );
  });

  it('atomically creates the path and dated activities', () => {
    expect(migration).toContain('insert into public.learning_paths');
    expect(migration).toContain('insert into public.learning_path_activities');
    expect(migration).toContain("p_path_data->>'version' <> '2'");
    expect(migration).toContain("(item.activity->>'scheduled_date')::date");
  });

  it('rejects rescheduling onto rest days or beyond daily capacity', () => {
    expect(migration).toContain('that is a rest day');
    expect(migration).toContain('rescheduling would exceed the selected daily availability');
    expect(migration).toContain('other.scheduled_date = p_scheduled_date');
  });

  it('preserves the roadmap while merging result recovery work', () => {
    expect(migration).toContain("p_path_data - 'weekly_schedule'");
    expect(migration).toContain("'weekly_schedule', v_merged_schedule");
    expect(migration).toContain("format('result:%s:day:%s'");
    expect(migration).toContain("'generation_trigger', 'result_recovery'");
  });

  it('only exposes measured weaknesses through the legacy weak-skills RPC', () => {
    expect(migration).toContain('proficiency.practice_count >= 5');
    expect(migration).toContain('proficiency.confidence_level >= 0.40');
  });

  it('carries only verified evidence into regenerated plan activities', () => {
    expect(verifiedActivityMigration).toContain('completion_policy');
    expect(verifiedActivityMigration).toContain('evidence_key');
    expect(verifiedActivityMigration).toContain('left join lateral');
    expect(verifiedActivityMigration).toContain(
      "previous.activity_key = item.activity->>'activity_key'"
    );
    expect(verifiedActivityMigration).toContain(
      "'test_session', 'grammar_attempt', 'transfer', 'vocabulary_review'"
    );
    expect(verifiedActivityMigration).not.toContain("previous.completion_source in ('manual'");
  });
});
