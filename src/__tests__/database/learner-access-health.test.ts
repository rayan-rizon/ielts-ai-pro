import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261004002500_monitor_learner_access_contracts.sql',
  'utf8'
);

describe('learner access health coverage', () => {
  it('checks missing schema and writable access before provider telemetry exists', () => {
    expect(migration).toContain("'grammar_guide_progress'");
    expect(migration).toContain('get_institution_learner_profile(uuid)');
    expect(migration).toContain('practice_library_dashboard_groups(uuid)');
    expect(migration).toContain("p.provolatile = 'v'");
    expect(migration).toContain("when failed_count>0 then 'down'");
    expect(migration).toContain("'failedChecks',failed_count");
  });

  it('keeps Health read-only and admin-only without paid AI probes or seat reconciliation', () => {
    expect(migration).toContain('language plpgsql stable security definer');
    expect(migration).toContain('if not public.is_admin()');
    expect(migration).toContain('from public, anon');
    expect(migration).toContain("not coalesce(has_function_privilege('authenticated'");
    expect(migration).not.toContain('institution_private.access(');
    expect(migration).not.toContain('select profile.*');
    expect(migration).not.toContain('http_post');
  });
});
