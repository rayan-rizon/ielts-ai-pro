import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260908212014_harden_library_view_and_index_foreign_keys.sql'
  ),
  'utf8'
);

describe('library passage view hardening', () => {
  it('uses caller permissions for the public catalogue view', () => {
    expect(migration).toContain('security_invoker = true');
    expect(migration).toContain('from objective_private.library_passage_catalog');
  });

  it('never copies protected Reading or Listening content into the safe catalogue', () => {
    for (const column of ['content', 'audio_url', 'transcript']) {
      expect(migration).toContain(
        `case when test_type in ('reading', 'listening') then null else ${column} end`
      );
      expect(migration).toContain(
        `case when new.test_type in ('reading', 'listening') then null else new.${column} end`
      );
    }
  });

  it('keeps browser access signed-in and read-only', () => {
    expect(migration).toContain(
      'revoke all on objective_private.library_passage_catalog from public, anon, authenticated;'
    );
    expect(migration).toContain(
      'grant select on objective_private.library_passage_catalog to authenticated, service_role;'
    );
    expect(migration).toContain(
      'to authenticated\nusing ((select auth.uid()) is not null and is_active);'
    );
  });

  it('uses short production lock and statement limits', () => {
    expect(migration).toContain("set lock_timeout = '2s';");
    expect(migration).toContain("set statement_timeout = '30s';");
    expect(migration).toContain('reset lock_timeout;');
    expect(migration).toContain('reset statement_timeout;');
  });
});
