import { describe, expect, it } from 'vitest';
import { readMigrationSource } from '../helpers/migrationSource';

const migration = readMigrationSource('harden_security_advisor_rpc_boundaries');

describe('Security Advisor RPC boundaries', () => {
  it('pins mutable helper search paths', () => {
    expect(migration).toContain(
      "ALTER FUNCTION public.get_session_duration_seconds(text, integer, jsonb)\n  SET search_path TO '';"
    );
    expect(migration).toContain(
      "ALTER FUNCTION public.is_abandoned_test_session(text, numeric, integer, jsonb)\n  SET search_path TO '';"
    );
  });

  it('keeps email unsubscribe behind the service-role Edge Function', () => {
    expect(migration).toMatch(
      /unsubscribe_marketing_email\(uuid, uuid\)[\s\S]*FROM PUBLIC, anon, authenticated;[\s\S]*TO service_role;/
    );
  });

  it('authorizes every writing-session lookup against the caller', () => {
    expect(migration).toContain(
      'p_user_id IS NOT NULL AND NOT public.can_access_user_id(p_user_id)'
    );
    expect(migration).toContain('public.can_access_user_id(session_row.user_id)');
    expect(migration).toMatch(
      /get_writing_session_with_task\(uuid, text, uuid\)[\s\S]*FROM PUBLIC, anon;[\s\S]*TO authenticated, service_role;/
    );
  });

  it('removes direct access to trigger-only and retired helpers', () => {
    for (const signature of [
      'seed_skills_from_onboarding()',
      'get_session_counts(uuid[])',
      'redeem_subscription_promo(text)',
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION public.${signature}`);
    }
  });

  it('makes future function exposure explicit', () => {
    expect(migration).toContain('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public');
    expect(migration).toContain('REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;');
  });
});
