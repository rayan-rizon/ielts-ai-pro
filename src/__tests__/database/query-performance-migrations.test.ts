import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
const read = (file: string) => readFileSync(resolve(migrationsDir, file), 'utf8');

const timezoneMigration = read('20260915195911_resolve_study_timezone_without_catalog_scan.sql');
const catalogueMigration = read('20260915200133_narrow_practice_library_catalogue.sql');
const fkIndexMigration = read('20260915200546_index_reading_assistant_session_fks.sql');
const grantMigration = read('20260915203704_tighten_resolve_study_timezone_grant.sql');
const catalogueCacheMigration = read('20260919124902_cache_practice_library_catalogue.sql');
const materializedCatalogueMigration = read(
  '20260919192500_materialize_practice_library_catalogue.sql'
);
const minimizedDashboardCatalogueMigration = read(
  '20260919194000_minimize_practice_library_dashboard_catalogue.sql'
);
const minimizedListeningDashboardMigration = read(
  '20260919195000_minimize_listening_dashboard_metadata.sql'
);
const targetedCatalogueMigration = read('20260919200000_target_practice_library_payloads.sql');
const dashboardGroupCacheMigration = read(
  '20260919201000_materialize_practice_library_dashboard_groups.sql'
);

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

describe('Skill Lab targeted catalogue payloads', () => {
  it('pre-groups dashboard metadata and scopes full content to requested sources', () => {
    expect(targetedCatalogueMigration).toContain(
      'create or replace function public.practice_library_dashboard_groups(p_auth uuid)'
    );
    expect(targetedCatalogueMigration).toContain(
      'create or replace function public.practice_library_catalogue_for_sources('
    );
    expect(targetedCatalogueMigration).toContain('where p.id = any(p_sources)');
  });

  it('keeps both RPCs service-role only', () => {
    expect(targetedCatalogueMigration).toContain(
      'grant execute on function public.practice_library_dashboard_groups(uuid) to service_role'
    );
    expect(targetedCatalogueMigration).toContain(
      'grant execute on function public.practice_library_catalogue_for_sources(uuid, uuid[], boolean)'
    );
  });
});

describe('Skill Lab dashboard group cache', () => {
  it('materializes exact grouped metadata per tier', () => {
    expect(dashboardGroupCacheMigration).toContain(
      'create table if not exists skill_lab_private.practice_library_dashboard_cache'
    );
    expect(dashboardGroupCacheMigration).toContain(
      'public.practice_library_dashboard_groups_uncached(representative.auth_id)'
    );
    expect(dashboardGroupCacheMigration).toContain(
      'left join skill_lab_private.practice_library_dashboard_cache c'
    );
  });

  it('refreshes dashboard and catalogue caches from the same source triggers', () => {
    expect(dashboardGroupCacheMigration).toContain(
      'perform skill_lab_private.refresh_practice_library_catalogue_cache()'
    );
    expect(dashboardGroupCacheMigration).toContain(
      'perform skill_lab_private.refresh_practice_library_dashboard_cache()'
    );
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

describe('Skill Lab catalogue egress cache', () => {
  it('separates reusable static content from private learner history', () => {
    expect(catalogueCacheMigration).toContain(
      'create or replace function public.practice_library_catalogue_static'
    );
    expect(catalogueCacheMigration).toContain(
      'create or replace function public.practice_library_history(p_auth uuid)'
    );

    const staticFunction = catalogueCacheMigration.split(
      'create or replace function public.practice_library_history'
    )[0];
    expect(staticFunction).not.toContain("'history'");
    expect(staticFunction).not.toContain('public.test_sessions');
  });

  it('versions static data from tier, row counts and latest updates', () => {
    expect(catalogueCacheMigration).toContain(
      'create or replace function public.practice_library_catalogue_version(p_auth uuid)'
    );
    expect(catalogueCacheMigration).toContain('passage_stats.row_count');
    expect(catalogueCacheMigration).toContain('passage_stats.latest_update');
    expect(catalogueCacheMigration).toContain('question_stats.row_count');
    expect(catalogueCacheMigration).toContain('question_stats.latest_update');
    expect(catalogueCacheMigration).toContain(
      'create or replace function skill_lab_private.touch_catalogue_updated_at()'
    );
    expect(catalogueCacheMigration).toContain('create trigger practice_library_touch_passage');
    expect(catalogueCacheMigration).toContain('create trigger practice_library_touch_question');
  });

  it('keeps every new RPC service-role only', () => {
    for (const signature of [
      'public.practice_library_catalogue_version(uuid)',
      'public.practice_library_catalogue_static(uuid, boolean)',
      'public.practice_library_history(uuid)',
    ]) {
      expect(catalogueCacheMigration).toContain(
        `revoke all on function ${signature}\n  from public, anon, authenticated`
      );
      expect(catalogueCacheMigration).toContain(
        `grant execute on function ${signature} to service_role`
      );
    }
  });
});

describe('Skill Lab materialized catalogue cache', () => {
  it('serves static payloads from a private tier cache', () => {
    expect(materializedCatalogueMigration).toContain(
      'create table if not exists skill_lab_private.practice_library_catalogue_cache'
    );
    expect(materializedCatalogueMigration).toContain(
      'join skill_lab_private.practice_library_catalogue_cache c'
    );
    expect(materializedCatalogueMigration).toContain(
      'grant execute on function public.practice_library_catalogue_static(uuid, boolean) to service_role'
    );
  });

  it('refreshes the cache after source catalogue statements', () => {
    expect(materializedCatalogueMigration).toContain(
      'create or replace function skill_lab_private.refresh_practice_library_catalogue_cache()'
    );
    expect(materializedCatalogueMigration).toContain(
      'after insert or update or delete or truncate on public.passages'
    );
    expect(materializedCatalogueMigration).toContain(
      'after insert or update or delete or truncate on public.questions'
    );
  });
});

describe('Skill Lab dashboard catalogue payload', () => {
  it('removes only Reading passage text from the summary variant', () => {
    expect(minimizedDashboardCatalogueMigration).toContain(
      "case when p_include_explanations or p.test_type = 'listening'"
    );
    expect(minimizedDashboardCatalogueMigration).toContain(
      "jsonb_build_object('content', 'available')"
    );
    expect(minimizedDashboardCatalogueMigration).toContain(
      'select skill_lab_private.refresh_practice_library_catalogue_cache()'
    );
  });

  it('keeps Listening audio metadata while excluding transcripts from summaries', () => {
    expect(minimizedListeningDashboardMigration).toContain(
      'create or replace function skill_lab_private.dashboard_passage_content'
    );
    expect(minimizedListeningDashboardMigration).toContain(
      "'audio_url', section.value -> 'audio_url'"
    );
    expect(minimizedListeningDashboardMigration).toContain(
      "'duration_minutes', section.value -> 'duration_minutes'"
    );
    expect(minimizedListeningDashboardMigration).not.toContain("section.value -> 'transcript'");
    expect(minimizedListeningDashboardMigration).not.toContain("section.value -> 'srt_content'");
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
