import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read(
  'supabase/migrations/20261002191209_distinguish_prepaid_passes_from_cancellations.sql'
);

describe('prepaid passes are not subscription cancellations', () => {
  it('guards both analytics counters and customer billing against legacy flags', () => {
    expect(migration).toContain('public.get_admin_overview_actions()');
    expect(migration).toContain('public.get_revenue_intelligence(text)');
    expect(migration).toContain(
      'cancel_at_period_end IS TRUE AND stripe_subscription_id IS NOT NULL'
    );
    expect(migration).toContain(
      'v_user.stripe_subscription_id IS NOT NULL AND COALESCE(v_user.cancel_at_period_end, false)'
    );
  });

  it('normalizes old writes and repairs only one-time quarterly access', () => {
    expect(migration).toContain(
      'p_subscription_id IS NOT NULL AND COALESCE(p_cancel_at_period_end, false)'
    );
    const repair = migration.slice(migration.indexOf('UPDATE public.users'));
    expect(repair).toContain("billing_interval = 'quarterly'");
    expect(repair).toContain('stripe_subscription_id IS NULL');
    expect(repair).not.toContain('subscription_end_date =');
    expect(repair).not.toContain('subscription_tier =');
  });

  it('does not flag successful one-time checkout as cancellation on either sync path', () => {
    for (const name of ['stripe-webhook', 'sync-stripe-session']) {
      const source = read(`supabase/functions/${name}/index.ts`);
      expect(source).not.toContain("p_cancel_at_period_end: session.mode === 'payment'");
      expect(source).toContain('p_cancel_at_period_end: false');
    }
    expect(read('src/features/auth/services/User.ts')).toContain(
      ".not('stripe_subscription_id', 'is', null)"
    );
  });
});
