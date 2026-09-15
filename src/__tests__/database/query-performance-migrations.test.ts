import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
const read = (file: string) => readFileSync(resolve(migrationsDir, file), 'utf8');

const timezoneMigration = read('20260915195911_resolve_study_timezone_without_catalog_scan.sql');
const catalogueMigration = read('20260915200133_narrow_practice_library_catalogue.sql');
const fkIndexMigration = read('20260915200546_index_reading_assistant_session_fks.sql');
const grantMigration = read('20260915203704_tighten_resolve_study_timezone_grant.sql');

describe('Grammar Lab timezone resolution', () => {
  it('replaces the pg_timezone_names scan with a reusable helper', () => {
    expect(timezoneMigration).toContain(
      'create or replace function public.resolve_study_timezone(p_timezone text)'
    );
    // The guarded cast is what makes this cheap; an EXISTS against the catalog
    // view costs ~900 ms per call.
    expect(timezoneMigration).toContain('at time zone v_name');
    expect(timezoneMigration).toContain("return 'UTC'");
  });

  it('is safe to apply twice', () => {
    // A second application finds the marker already replaced. That is the
    // "already done" state, not a failure — re-running must be a no-op.
    expect(timezoneMigration).toContain(
      'if v_hits = 0 and position(v_replacement in r.prosrc) > 0'
    );
    expect(timezoneMigration).toContain('continue;');
  });

  it('patches both callers in place and refuses to silently no-op', () => {
    expect(timezoneMigration).toContain("'get_grammar_dashboard', 'start_grammar_attempt'");
    expect(timezoneMigration).toContain('v_timezone := public.resolve_study_timezone(v_timezone);');
    // A missing or duplicated marker must abort the migration rather than leave
    // a caller on the slow path.
    expect(timezoneMigration).toContain('raise exception');
    expect(timezoneMigration).toMatch(/if v_hits <> 1 then/);
  });

  it('preserves the security posture of the functions it rewrites', () => {
    expect(timezoneMigration).toContain('security definer');
    expect(timezoneMigration).toContain("set search_path to ''");
    expect(timezoneMigration).toContain(
      'revoke all on function public.resolve_study_timezone(text) from public'
    );
  });

  it('leaves the helper callable only by its SECURITY DEFINER callers', () => {
    // Granted on creation, then revoked: the callers run as the definer, so no
    // end-user role needs to reach it over the REST API.
    expect(timezoneMigration).toContain(
      'grant execute on function public.resolve_study_timezone(text) to authenticated, service_role'
    );
    expect(grantMigration).toContain(
      'revoke execute on function public.resolve_study_timezone(text) from authenticated'
    );
  });

  it('asserts no public function still reaches the catalog view', () => {
    expect(timezoneMigration).toContain("p.prosrc like '%pg_timezone_names%'");
    expect(timezoneMigration).toContain('a public function still references pg_timezone_names');
  });
});

describe('Skill Lab catalogue narrowing', () => {
  it('lets the dashboard action skip question explanations', () => {
    expect(catalogueMigration).toContain('p_include_explanations boolean default true');
    expect(catalogueMigration).toContain("- 'explanation_data' - 'explanation'");
  });

  it('drops passage and question columns by denylist so new columns keep flowing', () => {
    expect(catalogueMigration).toContain(
      "to_jsonb(p) - 'transcript' - 'created_at' - 'updated_at'"
    );
    expect(catalogueMigration).toContain("to_jsonb(q) - 'created_at' - 'updated_at'");
  });

  it('returns only the history fields libraryHandler reads', () => {
    const handler = readFileSync(
      resolve(process.cwd(), 'supabase/functions/skill-lab/libraryHandler.ts'),
      'utf8'
    );

    for (const key of ['id', 'passage_id', 'test_type', 'completed_at', 'content_data']) {
      expect(catalogueMigration).toContain(`'${key}',`);
    }
    expect(catalogueMigration).toContain("t.content_data -> 'savedAnswers'");

    // The heavy sibling column was never read and must not come back. Compare
    // against the executable SQL only — the migration's comments discuss it by
    // name to explain why it was dropped.
    const sqlOnly = catalogueMigration
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');
    expect(sqlOnly).not.toContain('user_responses');
    expect(handler).not.toContain('user_responses');
  });

  it('keeps execute limited to service_role and removes the ambiguous 1-arg form', () => {
    expect(catalogueMigration).toContain(
      'revoke all on function public.practice_library_catalogue(uuid, boolean) from public, anon, authenticated'
    );
    expect(catalogueMigration).toContain(
      'grant execute on function public.practice_library_catalogue(uuid, boolean) to service_role'
    );
    expect(catalogueMigration).toContain(
      'drop function if exists public.practice_library_catalogue(uuid)'
    );
  });

  it('defaults to the full payload so an un-redeployed edge function is unaffected', () => {
    const defaultClause = catalogueMigration.match(
      /p_include_explanations boolean default (\w+)/
    )?.[1];
    expect(defaultClause).toBe('true');
  });
});

describe('Reading assistant foreign key indexes', () => {
  it('covers both cascading session_id columns', () => {
    expect(fkIndexMigration).toContain(
      'create index if not exists reading_assistant_operations_session_id'
    );
    expect(fkIndexMigration).toContain(
      'create index if not exists reading_assistant_unlocks_session_id'
    );
    expect(fkIndexMigration).toContain('(session_id)');
  });
});

describe('migration hygiene', () => {
  it('keeps the new migrations ordered after the existing history', () => {
    const versions = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => f.split('_')[0]);
    const sorted = [...versions].sort();
    expect(versions).toEqual(sorted);
  });

  it('has no duplicate migration versions', () => {
    const versions = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => f.split('_')[0]);
    expect(new Set(versions).size).toBe(versions.length);
  });
});
