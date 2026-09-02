import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readMigrationSource } from '../helpers/migrationSource';

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('confirmed audit hardening contracts', () => {
  const migration = readMigrationSource('harden_audit_confirmed_invariants');

  it('serializes both the learner and promo capacity checks', () => {
    expect(migration).toMatch(
      /FROM public\.users[\s\S]*WHERE auth_id = v_auth_id[\s\S]*FOR UPDATE/
    );
    expect(migration).toMatch(/FROM public\.promo_codes[\s\S]*FOR UPDATE/);
    expect(migration.indexOf('FOR UPDATE')).toBeLessThan(migration.indexOf('v_promo.max_uses'));
  });

  it('claims a canonical Stripe event before applying subscription side effects', () => {
    const claimAt = migration.indexOf('INSERT INTO stripe_events');
    const subscriptionUpdateAt = migration.indexOf('UPDATE users', claimAt);

    expect(claimAt).toBeGreaterThan(-1);
    expect(subscriptionUpdateAt).toBeGreaterThan(claimAt);
    expect(migration).toContain("WHERE stripe_events.status = 'failed'");
    expect(migration).toContain("'claimed', false");
    expect(migration).toContain("'claimed', true");
  });

  it('uses the same checkout-scoped idempotency key in webhook and recovery paths', () => {
    const webhook = readProjectFile('supabase/functions/stripe-webhook/index.ts');
    const recovery = readProjectFile('supabase/functions/sync-stripe-session/index.ts');

    expect(webhook).toContain('`checkout_${session.id}`');
    expect(recovery).toContain('`checkout_${session.id}`');
    expect(webhook).toContain('status: 500');
    expect(webhook).not.toContain('Permanent error logged');
  });

  it('indexes the exact uncached quota lookup prefix', () => {
    expect(migration).toContain('(user_id, endpoint, created_at DESC)');
    expect(migration).toMatch(/WHERE cached = FALSE/i);
  });

  it('moves point awards behind a service-only, idempotent daily budget', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.user_point_award_events');
    expect(migration).toContain('UNIQUE (auth_id, action_key)');
    expect(migration).toContain('v_daily_points + p_points > 5000');
    expect(migration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.add_user_points(integer) FROM authenticated'
    );
  });

  it('rejects upload bodies without a bounded length before multipart parsing', () => {
    const upload = readProjectFile('supabase/functions/r2-upload/index.ts');
    const lengthCheckAt = upload.indexOf('A valid Content-Length header is required.');
    const formDataAt = upload.indexOf('await req.formData()');

    expect(lengthCheckAt).toBeGreaterThan(-1);
    expect(formDataAt).toBeGreaterThan(lengthCheckAt);
    expect(upload).toContain("await supabase.rpc('is_admin')");
    expect(upload).toContain('hasExpectedFileSignature');
  });
});
