import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  'supabase/migrations/20260927100000_exam_pass_paid_access_expiry.sql',
  'utf8'
);

const functionBody = (name) => {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION ${name}(`);
  expect(start).toBeGreaterThan(-1);
  return sql.slice(start, sql.indexOf('CREATE OR REPLACE FUNCTION', start + 1));
};

describe('paid access ends on its end date', () => {
  it('treats an ended pro/premium period as free, and a null end date as open-ended', () => {
    const helper = functionBody('public.entitled_subscription_tier');
    expect(helper).toMatch(/p_end_date IS NOT NULL/);
    expect(helper).toMatch(/p_end_date <= pg_catalog\.now\(\)/);
    expect(helper).toMatch(/THEN 'free'/);
  });

  it.each([
    [
      'public.check_user_rate_limit',
      /entitled_subscription_tier\(subscription_tier, subscription_end_date\)/,
    ],
    [
      'public.reserve_ai_api_usage',
      /entitled_subscription_tier\(v_user\.subscription_tier, v_user\.subscription_end_date\)/,
    ],
    [
      'public.current_subscription_tier',
      /entitled_subscription_tier\(u\.subscription_tier, u\.subscription_end_date\)/,
    ],
  ])('%s resolves the tier through the end date', (name, pattern) => {
    const body = functionBody(name);
    expect(body).toMatch(pattern);
    expect(body).toMatch(/SET search_path TO ''/);
  });

  it('only downgrades one-time plans; Stripe subscriptions end through their webhook', () => {
    const job = sql.slice(sql.indexOf('billing_private.expire_lapsed_paid_access()'));
    expect(job).toMatch(/stripe_subscription_id IS NULL/);
    expect(job).toMatch(/role <> 'admin'/);
    expect(job).toMatch(/subscription_end_date IS NOT NULL/);
    expect(job).toMatch(/app\.bypass_column_protection', 'on'/);
    expect(job).toMatch(/cron\.schedule\(\s*'expire-lapsed-paid-access'/);
  });
});

describe('Stripe and email keep paid access honest', () => {
  const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
  const scheduled = readFileSync('supabase/functions/scheduled-emails/index.ts', 'utf8');

  it('never ends a subscription "now" because the payload lacks current_period_end', () => {
    const handler = webhook.slice(webhook.indexOf('async function handleSubscriptionUpdated'));
    const body = handler.slice(0, handler.indexOf('\nasync function '));
    expect(body).toMatch(/items\?\.data\?\.\[0\]/);
    expect(body).toMatch(/periodEnd \? new Date\(periodEnd \* 1000\) : null/);
    expect(body).not.toMatch(/: new Date\(\);/);
  });

  it('sends no reminder to a subscription that renews automatically', () => {
    expect(scheduled).toMatch(
      /const renews = Boolean\(user\.stripe_subscription_id\) && !user\.cancel_at_period_end;\s*if \(renews\) continue;/
    );
  });
});

describe('renewals under the webhook API version (2025-08-27.basil)', () => {
  const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');

  it('finds the subscription on invoice.parent, not only the removed invoice.subscription', () => {
    const helper = webhook.slice(webhook.indexOf('function invoiceSubscriptionId'));
    expect(helper).toMatch(/parent\?\.subscription_details\?\.subscription/);
    const handler = webhook.slice(webhook.indexOf('async function handleInvoicePaid'));
    expect(handler.slice(0, 400)).toMatch(
      /const subscriptionId = invoiceSubscriptionId\(invoice\);/
    );
    expect(webhook).not.toMatch(/invoice\.subscription as string/);
  });
});
