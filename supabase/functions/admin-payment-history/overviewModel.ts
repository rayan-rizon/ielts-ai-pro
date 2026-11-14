import type Stripe from 'npm:stripe@^14.14.0';
import { fromStripeAmount } from '../_shared/planPricing.ts';

export type BillingUser = {
  id: string;
  auth_id: string;
  full_name: string | null;
  email: string | null;
  subscription_tier: string;
  stripe_subscription_id?: string | null;
  subscription_end_date?: string | null;
  subscription_amount?: number | null;
  subscription_currency?: string | null;
  payment_failed_at?: string | null;
};
const iso = (value?: number | null) => (value ? new Date(value * 1000).toISOString() : null);
const learner = (user: BillingUser) => ({
  userId: user.id,
  authId: user.auth_id,
  name: user.full_name || 'Unnamed learner',
  email: user.email || '',
  tier: user.subscription_tier,
});
export const ATTENTION_STATUSES = ['past_due', 'unpaid', 'incomplete', 'paused'];

function invoiceDetails(invoice: Stripe.Invoice | string | null) {
  if (!invoice || typeof invoice === 'string') return null;
  const failure = invoiceFailure(invoice.payment_intent);
  return {
    id: invoice.id,
    status: invoice.status,
    amountDue: fromStripeAmount(invoice.amount_remaining, invoice.currency),
    currency: invoice.currency.toUpperCase(),
    attempts: invoice.attempt_count,
    nextRetryAt: iso(invoice.next_payment_attempt),
    failure,
  };
}

function invoiceFailure(intent: Stripe.Invoice['payment_intent']) {
  if (!intent || typeof intent === 'string') return null;
  const error = intent.last_payment_error;
  return error?.message || error?.code || null;
}

function subscriptionPrice(sub: Stripe.Subscription) {
  const price = sub.items.data[0]?.price;
  if (!price) return { amount: null, currency: sub.currency.toUpperCase(), interval: 'month' };
  const amount =
    price.unit_amount == null ? null : fromStripeAmount(price.unit_amount, price.currency);
  const recurring = price.recurring;
  const interval = recurring?.interval_count === 3 ? 'quarterly' : recurring?.interval || 'month';
  return { amount, currency: price.currency.toUpperCase(), interval };
}

function periodEnd(sub: Stripe.Subscription) {
  const item = sub.items.data[0] as unknown as { current_period_end?: number };
  return iso(sub.current_period_end ?? item?.current_period_end);
}

export function subscriptionRow(user: BillingUser, sub: Stripe.Subscription) {
  return {
    ...learner(user),
    ...subscriptionPrice(sub),
    id: sub.id,
    provider: 'stripe',
    status: sub.status,
    tier: sub.metadata?.tier || user.subscription_tier,
    periodEnd: periodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    invoice: invoiceDetails(sub.latest_invoice),
  };
}

export function manualSubscriptionRow(user: BillingUser, now: number) {
  if (user.subscription_tier === 'free') return null;
  if (!user.subscription_end_date) return null;
  if (Date.parse(user.subscription_end_date) <= now) return null;
  return {
    ...learner(user),
    id: `manual-${user.id}`,
    provider: 'manual',
    status: 'manual_active',
    amount: user.subscription_amount ?? null,
    currency: user.subscription_currency || 'BDT',
    interval: 'prepaid',
    periodEnd: user.subscription_end_date,
    cancelAtPeriodEnd: false,
    invoice: null,
  };
}
export type SubscriptionRow =
  ReturnType<typeof subscriptionRow> | NonNullable<ReturnType<typeof manualSubscriptionRow>>;

export function summarizeSubscriptions(rows: { status: string; cancelAtPeriodEnd?: boolean }[]) {
  return {
    active: rows.filter((r) => r.status === 'active').length,
    manual: rows.filter((r) => r.status === 'manual_active').length,
    attention: rows.filter((r) => ATTENTION_STATUSES.includes(r.status)).length,
    ending: rows.filter((r) => r.status === 'active' && r.cancelAtPeriodEnd).length,
    unverified: rows.filter((r) => r.status === 'unavailable').length,
  };
}
