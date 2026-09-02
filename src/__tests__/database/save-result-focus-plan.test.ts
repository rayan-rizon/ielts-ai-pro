import { readMigrationSource } from '../helpers/migrationSource';
import { describe, expect, it } from 'vitest';

const migration = readMigrationSource('20260722043357_save_result_focus_plan.sql').toLowerCase();

describe('save_result_focus_plan migration', () => {
  it('runs with caller permissions and verifies source-test ownership', () => {
    expect(migration).toContain('security invoker');
    expect(migration).toContain('auth.uid() is null');
    expect(migration).toContain('session.user_id = public.get_my_public_user_id()');
    expect(migration).toContain("session.test_type in ('reading', 'listening')");
  });

  it('requires exactly seven activities and writes them in the same transaction', () => {
    expect(migration).toContain('jsonb_array_length(p_activities) <> 7');
    expect(migration).toContain('insert into public.learning_paths');
    expect(migration).toContain('insert into public.learning_path_activities');
    expect(migration).toContain("format('result:%s:day:%s'");
  });

  it('exposes execution only to authenticated users', () => {
    expect(migration).toContain('revoke all on function public.save_result_focus_plan');
    expect(migration).toContain('from anon');
    expect(migration).toContain('grant execute on function public.save_result_focus_plan');
    expect(migration).toContain('to authenticated');
  });
});
