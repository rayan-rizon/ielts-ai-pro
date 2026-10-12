import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const migration = read(
  'supabase/migrations/20261003175457_repair_institution_profile_rpc_reads.sql'
);
const guideMigration = read(
  'supabase/migrations/20261003175524_restore_grammar_guide_progress.sql'
);

describe('institution-aware profile lookups', () => {
  it('keeps notification audience RLS safe in read-only requests', () => {
    const notificationMigration = read(
      'supabase/migrations/20261004000400_repair_notification_entitlement_reads.sql'
    );
    expect(notificationMigration).toContain('language sql stable security definer');
    expect(notificationMigration).toContain('public.entitled_subscription_tier');
    expect(notificationMigration).toContain("s.status = 'active' and s.access_until > now()");
    expect(notificationMigration).toContain("(select tier from institution) = 'premium'");
    expect(notificationMigration).not.toContain('institution_learner_profiles');
    expect(notificationMigration).not.toContain('institution_private.access(');
  });
  it('uses a writable service-only RPC without removing entitlement reconciliation', () => {
    expect(migration).toContain('returns setof public.institution_learner_profiles');
    expect(migration).toContain('language sql volatile security definer');
    expect(migration).toContain('where profile.auth_id = p_auth');
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
  });

  it('never reads the mutating profile view through GET in any Edge Function', () => {
    let callers = 0;
    const sharedWriting = read('supabase/functions/_shared/writingEvaluation.ts');
    expect(sharedWriting).not.toMatch(/\.from\(['"]institution_learner_profiles['"]\)/);
    callers += (
      sharedWriting.match(/\.rpc\('get_institution_learner_profile', \{ p_auth: [\w.]+ \}\)/g) || []
    ).length;
    for (const directory of readdirSync(resolve('supabase/functions'), { withFileTypes: true })) {
      if (!directory.isDirectory() || directory.name === '_shared') continue;
      let source: string;
      try {
        source = read(`supabase/functions/${directory.name}/index.ts`);
      } catch {
        continue;
      }
      expect(source, directory.name).not.toMatch(/\.from\(['"]institution_learner_profiles['"]\)/);
      const calls =
        source.match(/\.rpc\('get_institution_learner_profile', \{ p_auth: [\w.]+ \}\)/g) || [];
      callers += calls.length;
    }
    expect(callers).toBe(17);
  });
});

describe('grammar guide completion schema', () => {
  it('restores the learner-owned table and all four ownership policies', () => {
    expect(guideMigration).toContain('create table if not exists public.grammar_guide_progress');
    expect(guideMigration).toContain('primary key (user_id, guide_slug)');
    expect(guideMigration).toContain('enable row level security');
    for (const action of ['select', 'insert', 'update', 'delete']) {
      expect(guideMigration).toContain(`for ${action}`);
    }
    expect(guideMigration.match(/u\.auth_id = \(select auth.uid\(\)\)/g)).toHaveLength(5);
    expect(guideMigration).not.toContain('insert into public.grammar_guide_progress');
  });
});
