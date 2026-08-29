import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260829104115_speaking_v2_authoritative_state.sql'),
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
});
