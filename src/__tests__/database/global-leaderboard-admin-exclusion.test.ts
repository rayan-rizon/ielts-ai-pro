import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260908205336_exclude_admins_from_global_leaderboard.sql'
  ),
  'utf8'
).toLowerCase();

describe('global leaderboard admin exclusion migration', () => {
  it('filters admin accounts before ranking and pagination', () => {
    const filterStart = migration.indexOf("u.role is distinct from 'admin'");
    const limitStart = migration.indexOf('limit limit_count');

    expect(filterStart).toBeGreaterThanOrEqual(0);
    expect(limitStart).toBeGreaterThan(filterStart);
    expect(migration).toContain('join public.users u on u.id = up.user_id');
    expect(migration).toContain('count(*) over () as total_count');
  });

  it('keeps the public leaderboard function callable by learner clients', () => {
    expect(migration).toContain(
      'grant execute on function public.get_leaderboard(integer, integer, text) to authenticated, anon'
    );
  });
});
