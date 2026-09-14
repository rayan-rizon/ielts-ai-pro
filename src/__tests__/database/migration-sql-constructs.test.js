import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * COALESCE, NULLIF, GREATEST and LEAST are SQL *constructs*, not functions in
 * pg_catalog, so they cannot be schema-qualified. Writing
 * `pg_catalog.coalesce(...)` raises 42883 at runtime.
 *
 * This is worth a test rather than a code review note because CREATE FUNCTION
 * does not resolve identifiers inside a plpgsql body: the function is created
 * without complaint and only fails when a real user first calls it. That is
 * exactly how 20260914130736 shipped a broken upsert_user_profile and a
 * record_onboarding_offer that silently recorded nothing.
 *
 * Qualifying genuine catalog functions (now, lower, to_jsonb) stays correct and
 * is how these functions remain safe under `SET search_path = ''`.
 */
const MIGRATIONS_DIR = 'supabase/migrations';
const UNQUALIFIABLE = /pg_catalog\.(coalesce|nullif|greatest|least)\s*\(/gi;

const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql'));

describe('migration SQL uses constructs unqualified', () => {
  it('has migrations to check', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it.each(migrationFiles)('%s does not schema-qualify a SQL construct', (file) => {
    const sql = readFileSync(`${MIGRATIONS_DIR}/${file}`, 'utf8');
    // Comments explaining the rule are allowed to name it; code is not.
    const code = sql
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');

    expect([...code.matchAll(UNQUALIFIABLE)].map((m) => m[0])).toEqual([]);
  });

  it('would catch the bug it was written for', () => {
    const offending = '  onboarding_offer_seen_at = pg_catalog.coalesce(a, pg_catalog.now()),';
    expect([...offending.matchAll(UNQUALIFIABLE)]).toHaveLength(1);
    expect([...'  x = coalesce(a, pg_catalog.now()),'.matchAll(UNQUALIFIABLE)]).toHaveLength(0);
  });
});
