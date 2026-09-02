import { describe, expect, it } from 'vitest';
import { readMigrationSource } from '../helpers/migrationSource';

const migration = readMigrationSource('harden_low_risk_rpc_and_rls_performance');

describe('low-risk RPC and RLS hardening', () => {
  it('uses invoker rights only for RLS-equivalent read RPCs', () => {
    expect(migration).toContain(
      'ALTER FUNCTION public.get_cambridge_tests(integer) SECURITY INVOKER;'
    );
    expect(migration).toContain(
      'ALTER FUNCTION public.get_tier_rate_limits(text) SECURITY INVOKER;'
    );
    expect(migration).not.toContain(
      'ALTER FUNCTION public.get_test_taken_counts(text) SECURITY INVOKER;'
    );
    expect(migration).not.toContain(
      'ALTER FUNCTION public.increment_resource_view(uuid) SECURITY INVOKER;'
    );
  });

  it('keeps both read RPCs unavailable to anonymous callers', () => {
    for (const signature of ['get_cambridge_tests(integer)', 'get_tier_rate_limits(text)']) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon;`);
      expect(migration).toMatch(
        new RegExp(
          `GRANT EXECUTE ON FUNCTION public\\.${signature.replace(/[()]/g, '\\$&')}\\s+TO authenticated, service_role;`
        )
      );
    }
  });

  it('replaces overlapping campaign read policies with one OR predicate', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS marketing_campaigns_admin_all');
    expect(migration).toContain('DROP POLICY IF EXISTS marketing_campaigns_learner_select');
    expect(migration).toMatch(
      /CREATE POLICY marketing_campaigns_select[\s\S]*FOR SELECT[\s\S]*\(SELECT public\.is_admin\(\)\)[\s\S]*OR status IN \('active', 'scheduled'\)/
    );
  });

  it('preserves owner-or-admin delivery visibility and admin-only writes', () => {
    expect(migration).toMatch(
      /CREATE POLICY marketing_deliveries_select[\s\S]*\(SELECT public\.is_admin\(\)\)[\s\S]*OR user_id = \(SELECT public\.get_my_public_user_id\(\)\)/
    );

    for (const command of ['insert', 'update', 'delete']) {
      expect(migration).toContain(`CREATE POLICY marketing_deliveries_admin_${command}`);
    }
  });

  it('gives anonymous and authenticated resource reads one policy each', () => {
    expect(migration).toMatch(
      /CREATE POLICY resources_public_read[\s\S]*FOR SELECT[\s\S]*TO anon[\s\S]*is_published = true/
    );
    expect(migration).toMatch(
      /CREATE POLICY resources_authenticated_read[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*\(SELECT public\.is_admin\(\)\)[\s\S]*OR/
    );
  });
});
