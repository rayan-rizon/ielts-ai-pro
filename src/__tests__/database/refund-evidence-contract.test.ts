import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = read(
  'supabase/migrations/20260922175429_refund_evidence_and_six_month_retention.sql'
);
const sessionStartFix = read(
  'supabase/migrations/20260922182922_refund_evidence_ignores_session_start_markers.sql'
);
const foreignRefundGuard = read(
  'supabase/migrations/20260922193901_ignore_foreign_provider_refunds.sql'
);
const webhook = read('supabase/functions/stripe-webhook/index.ts');
const adminBilling = read('supabase/functions/admin-billing/index.ts');

const functionBody = (name: string) => {
  const start = migration.indexOf(`FUNCTION public.${name}(`);
  expect(start, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('$function$;', start));
};

describe('refund evidence migration', () => {
  it('lets a payment be refunded without widening what learners can insert', () => {
    expect(migration).toContain("'refunded'::text]))");
    expect(functionBody('guard_learner_payment_request_insert')).toContain(
      "NEW.status := 'pending'"
    );
    expect(migration).toMatch(/BEFORE INSERT ON public\.payment_requests/);
  });

  it('keeps payment records through account deletion by detaching them', () => {
    for (const constraint of [
      'payment_requests_auth_id_fkey',
      'billing_history_user_id_fkey',
      'billing_history_auth_id_fkey',
    ]) {
      const statement = migration.slice(migration.indexOf(`ADD CONSTRAINT ${constraint}`));
      expect(statement.slice(0, statement.indexOf(';'))).toContain('ON DELETE SET NULL');
    }
  });

  it('remembers the first purchase after its payment row is purged', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.customer_billing_facts');
    expect(functionBody('track_customer_payment_fact')).toContain(
      "OLD.status IN ('approved', 'refunded')"
    );
    // Facts are bookkeeping: a failure must never block a payment settling.
    expect(functionBody('track_customer_payment_fact')).toContain('EXCEPTION WHEN OTHERS');
  });

  it('decides eligibility from first purchase, the seven-day window, and delivered AI', () => {
    const evidence = functionBody('get_payment_refund_evidence');
    expect(evidence).toContain("v_paid_at + interval '7 days'");
    expect(evidence).toContain("WHEN NOT v_is_first THEN 'not_first_purchase'");
    expect(evidence).toContain("WHEN now() > v_window_ends THEN 'window_expired'");
    expect(evidence).toContain("WHEN v_learner_delivered > 0 THEN 'used'");
    // Failed AI requests are reported but never count as use.
    expect(evidence).toContain("cls = 'learner' AND NOT delivered");
    expect(functionBody('ai_usage_endpoint_class')).toContain("'admin'");
  });

  it('keeps every admin read and write behind is_admin()', () => {
    for (const name of [
      'get_admin_customer_billing_profile',
      'get_admin_refund_ledger',
      'admin_record_manual_refund',
    ]) {
      expect(functionBody(name)).toContain('IF NOT public.is_admin() THEN');
    }
    expect(migration).toContain(
      'REVOKE INSERT, UPDATE, DELETE ON public.payment_refunds FROM authenticated'
    );
  });

  it('restricts provider and access functions to the service role', () => {
    for (const name of [
      'service_end_paid_access',
      'service_open_provider_refund',
      'service_record_provider_refund',
    ]) {
      expect(functionBody(name)).toContain("<> 'service_role' THEN");
      expect(migration).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${name}\\([^)]*\\) FROM PUBLIC, anon, authenticated`
        )
      );
    }
  });

  it('only records manual refunds for non-Stripe payments, with the transfer reference', () => {
    const manual = functionBody('admin_record_manual_refund');
    expect(manual).toContain("= 'stripe' THEN");
    expect(manual).toContain('Enter the transaction ID of the money you sent back');
  });

  it('purges records after six months but never a pending manual payment', () => {
    const prune = migration.slice(migration.indexOf('billing_private.prune_expired_records()'));
    expect(prune).toContain("now() - interval '6 months'");
    expect(prune).toContain('DELETE FROM public.ai_api_usage WHERE created_at < v_cutoff');
    expect(prune).toContain(
      "DELETE FROM public.payment_requests WHERE created_at < v_cutoff AND status <> 'pending'"
    );
    expect(migration).toContain("'six-month-record-retention'");
  });

  it('stops revenue comparisons from reading past retention', () => {
    const revenue = functionBody('get_revenue_intelligence');
    expect(revenue).toContain("WHEN '6m' THEN 180");
    expect(revenue).toContain("'previousRetained',v_prev >= now() - interval '6 months'");
  });
});

describe('session start markers', () => {
  it('does not count a quota-only session start as a delivered AI result', () => {
    expect(sessionStartFix).toContain("WHEN p_endpoint ~ '_start$' THEN 'session'");
    // The class check runs before the learner fallback, so a start row never
    // reaches the learner_delivered count that decides "used".
    const classFn = sessionStartFix.slice(
      0,
      sessionStartFix.indexOf('get_payment_refund_evidence')
    );
    expect(classFn.indexOf("'session'")).toBeLessThan(classFn.indexOf("ELSE 'learner'"));
    expect(sessionStartFix).toContain("count(*) FILTER (WHERE cls = 'learner' AND delivered)");
    expect(sessionStartFix).toContain("OR v_sessions_opened > 0 THEN 'review'");
    expect(sessionStartFix).toContain("<> 'service_role' AND NOT public.is_admin() THEN");
  });
});

describe('shared Stripe account', () => {
  it('ignores refunds and disputes that match none of our payments or customers', () => {
    const guard = foreignRefundGuard.indexOf('IF v_payment.id IS NULL AND v_user_id IS NULL THEN');
    expect(guard).toBeGreaterThan(-1);
    // The guard must run before anything is written.
    expect(guard).toBeLessThan(foreignRefundGuard.indexOf('INSERT INTO public.payment_refunds'));
    expect(foreignRefundGuard).toContain("'ignored', true");
  });
});

describe('refund edge functions', () => {
  it('records failed renewals with supabase-js v2 syntax so dunning still runs', () => {
    expect(webhook).not.toMatch(/\.onConflict\('/);
    expect(webhook).toContain("{ onConflict: 'id', ignoreDuplicates: true }");
  });

  it('records Stripe refunds and disputes without claiming a payment stripe_events row', () => {
    expect(webhook).toContain("case 'charge.refunded':");
    expect(webhook).toContain("case 'charge.dispute.closed':");
    // charge.refund.updated only fires for some payment methods.
    expect(webhook).toContain("case 'refund.updated':");
    expect(webhook).toContain("rpc('service_record_provider_refund'");
    const refundSection = webhook.slice(webhook.indexOf('async function handleChargeRefunds'));
    expect(refundSection).not.toContain("from('stripe_events')");
  });

  it('opens the ledger row before calling Stripe and uses it as the idempotency key', () => {
    const open = adminBilling.indexOf("rpc('service_open_provider_refund'");
    const create = adminBilling.indexOf('stripe.refunds.create(');
    expect(open).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(open);
    expect(adminBilling).toContain('idempotencyKey: `admin-refund:${refundRow.id}`');
  });

  it('asks is_admin() as the caller, cancels Stripe before ending access, and checks CSRF', () => {
    expect(adminBilling).toContain("caller.rpc('is_admin')");
    expect(adminBilling).toContain('validateCsrfProtection(req)');
    const endAccess = adminBilling.slice(adminBilling.indexOf('const endAccess = async'));
    expect(endAccess.indexOf('cancelStripeSubscription(')).toBeLessThan(
      endAccess.indexOf("rpc('service_end_paid_access'")
    );
  });
});
