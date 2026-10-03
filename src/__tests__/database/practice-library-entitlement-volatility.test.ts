import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve('supabase/migrations/20261003173732_repair_practice_library_entitlement_volatility.sql'),
  'utf8'
);

describe('Practice Lab entitlement reconciliation', () => {
  it('makes every catalogue tier caller writable, including cached and uncached dashboards', () => {
    for (const signature of [
      'practice_library_catalogue_version(uuid)',
      'practice_library_catalogue_static(uuid, boolean)',
      'practice_library_catalogue_for_sources(uuid, uuid[], boolean)',
      'practice_library_dashboard_groups_uncached(uuid)',
      'practice_library_dashboard_groups(uuid)',
    ]) {
      expect(migration).toContain(`alter function public.${signature} volatile;`);
    }
  });

  it('only alters volatility without changing permissions or learner records', () => {
    const statements = migration
      .replace(/--[^\n]*/g, '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(statements).toHaveLength(5);
    for (const statement of statements) {
      expect(statement).toMatch(/^alter function public\.practice_library_[\s\S]+ volatile$/);
    }
  });
});
