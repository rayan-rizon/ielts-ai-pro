import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829104115_speaking_v2_authoritative_state.sql'),
  'utf8'
);
const conflictFastPathMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829134242_speaking_v2_conflict_fast_path.sql'),
  'utf8'
);
const transitionStateMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260829140225_speaking_v2_preserve_transition_state.sql'
  ),
  'utf8'
);

describe('Speaking V2 authoritative schema', () => {
  it('keeps learner state private and RPC mutation service-role-only', () => {
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain(
      'REVOKE ALL ON TABLE public.speaking_session_state FROM PUBLIC, anon, authenticated'
    );
    expect(migration).toContain("COALESCE(auth.jwt() ->> 'role', '') <> 'service_role'");
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.reserve_speaking_v2_turn');
  });

  it('atomically guards revision, replay, sequence, audio, turn, and shared burst budgets', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('idempotency_key');
    expect(migration).toContain('revision_conflict');
    expect(migration).toContain('turn_limit');
    expect(migration).toContain('audio_limit');
    expect(migration).toContain('burst_limit');
  });

  it('treats duplicate part advances as recoverable state conflicts, not database exceptions', () => {
    expect(conflictFastPathMigration).toContain("'reason', 'state_conflict'");
    expect(conflictFastPathMigration).not.toContain("RAISE EXCEPTION 'speaking state conflict'");
  });

  it('does not let Practice heartbeats, pause, or resume erase a completed-part boundary', () => {
    expect(transitionStateMigration).toContain("v_state.status = 'part_complete'");
    expect(transitionStateMigration).toContain("THEN 'part_complete'");
    expect(transitionStateMigration).toContain("v_state.status = 'ready_for_evaluation'");
  });
});
