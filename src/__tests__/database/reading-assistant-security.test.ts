import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(
  path.resolve('supabase/migrations/20260910022530_reading_assistant.sql'),
  'utf8'
);

describe('Reading assistant database boundary', () => {
  it('keeps operations and unlocks private and service-role-only', () => {
    expect(migration).toMatch(/create schema if not exists reading_assistant_private/i);
    expect(migration).toMatch(
      /revoke all on schema reading_assistant_private from public, anon, authenticated/i
    );
    expect(migration).toMatch(
      /alter table reading_assistant_private\.operations enable row level security/i
    );
    expect(migration).toMatch(
      /grant execute on function public\.reading_assistant_reserve[\s\S]*to service_role/i
    );
  });

  it('enforces Exam mode, combined free quota, concurrency, and the spending ceiling', () => {
    expect(migration).toMatch(/not s\.is_completed and s\.test_mode = 'mock'/i);
    expect(migration).toMatch(/action in \('translate', 'breakdown'\)/i);
    expect(migration).toMatch(/cfg\.free_daily_assists/i);
    expect(migration).toMatch(/cfg\.concurrent_generations/i);
    expect(migration).toMatch(/spend \+ 0\.002 > cfg\.daily_budget/i);
  });

  it('does not charge cached or reopened results to the provider budget', () => {
    expect(migration).toMatch(/'reopened', true/i);
    expect(migration).toMatch(/p_cached_result, true, 0,[\s\S]*0, now\(\)/i);
  });
});
