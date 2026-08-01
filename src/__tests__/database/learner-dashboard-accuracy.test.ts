import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260801143759_fix_learner_dashboard_analytics_accuracy.sql'
  ),
  'utf8'
).toLowerCase();

describe('Learner dashboard accuracy migration', () => {
  it('uses measured elapsed seconds rather than initialized duration minutes', () => {
    expect(migration).toContain('get_session_duration_seconds');
    expect(migration).toContain('sum(duration_seconds)');
    expect(migration).not.toContain('select duration_minutes as duration');
  });

  it('groups descending consecutive dates correctly in the learner timezone', () => {
    expect(migration).toContain("study_availability ->> 'timezone'");
    expect(migration).toContain('at time zone v_timezone');
    expect(migration).toContain(
      'practice_date + (row_number() over (order by practice_date desc))::integer as grp'
    );
    expect(migration).not.toContain(
      'practice_date - (row_number() over (order by practice_date desc))::integer as grp'
    );
  });

  it('keeps weekly test counts separate and returns elapsed time for recent sessions', () => {
    const weeklySection = migration.slice(
      migration.indexOf('-- this metric is labelled tests'),
      migration.indexOf('-- the heatmap deliberately remains')
    );
    expect(weeklySection).toContain('public.test_sessions');
    expect(weeklySection).not.toContain('learning_path_activities');
    expect(migration).toContain('duration_seconds integer');
    expect(migration).toContain('test_mode text');
  });

  it('does not expose privileged dashboard functions to anonymous callers', () => {
    expect(migration).toContain(
      'revoke all on function public.get_dashboard_stats() from public, anon'
    );
    expect(migration).toContain(
      'grant execute on function public.get_recent_sessions(integer) to authenticated, service_role'
    );
  });
});
