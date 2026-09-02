import { readMigrationSource } from '../helpers/migrationSource';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource('20260801172127_optimize_learning_path_data_rpc.sql');

describe('optimized Learning Path data RPC migration', () => {
  it('returns the evidence-aware activity contract in one authenticated function', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.get_learning_path_data()');
    expect(migration).toContain("'scheduled_date', activity.scheduled_date");
    expect(migration).toContain("'completion_policy', activity.completion_policy");
    expect(migration).toContain("'evidence_version', proficiency.evidence_version");
    expect(migration).toContain("RAISE EXCEPTION 'Authentication required'");
  });

  it('bounds session evidence, excludes abandoned attempts, and denies anonymous execution', () => {
    expect(migration).toContain('LIMIT 40');
    expect(migration).toContain('public.is_abandoned_test_session');
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.get_learning_path_data() FROM PUBLIC, anon'
    );
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.get_learning_path_data() TO authenticated, service_role'
    );
  });
});
