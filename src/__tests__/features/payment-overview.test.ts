import { describe, expect, it } from 'vitest';
import {
  subscriptionRow,
  manualSubscriptionRow,
  summarizeSubscriptions,
} from '../../../supabase/functions/admin-payment-history/overviewModel';
const user = {
  id: 'user-1',
  auth_id: 'auth-1',
  full_name: 'Learner',
  email: 'learner@example.com',
  subscription_tier: 'pro',
  subscription_end_date: '2026-12-08T00:00:00Z',
  stripe_subscription_id: 'sub_1',
};
const subscription = (status = 'active') => ({
  id: 'sub_1',
  status,
  cancel_at_period_end: false,
  current_period_end: 1796688000,
  items: {
    data: [
      {
        price: {
          unit_amount: 999,
          currency: 'usd',
          recurring: { interval: 'month', interval_count: 1 },
        },
      },
    ],
  },
});
describe('admin subscription overview', () => {
  it('separates past due renewals and exposes failure details', () => {
    const row = subscriptionRow(user, {
      ...subscription('past_due'),
      latest_invoice: {
        id: 'in_1',
        status: 'open',
        amount_remaining: 999,
        currency: 'usd',
        attempt_count: 3,
        next_payment_attempt: 1794791845,
        payment_intent: {
          last_payment_error: {
            code: 'incorrect_number',
            message: 'Your card number is incorrect.',
          },
        },
      },
    } as any);
    expect(row).toMatchObject({
      status: 'past_due',
      amount: 9.99,
      invoice: {
        id: 'in_1',
        amountDue: 9.99,
        attempts: 3,
        failure: 'Your card number is incorrect.',
        nextRetryAt: '2026-11-16T01:17:25.000Z',
      },
    });
    expect(
      summarizeSubscriptions([row, subscriptionRow(user, subscription() as any)])
    ).toMatchObject({ active: 1, attention: 1 });
  });
  it('keeps scheduled cancellation active until period end', () => {
    const row = subscriptionRow(user, { ...subscription(), cancel_at_period_end: true } as any);
    expect(summarizeSubscriptions([row])).toMatchObject({ active: 1, ending: 1, attention: 0 });
  });
  it('supports item period dates and quarterly prices', () => {
    const row = subscriptionRow(user, {
      ...subscription(),
      current_period_end: undefined,
      items: {
        data: [
          {
            current_period_end: 1796688000,
            price: {
              unit_amount: 3373,
              currency: 'usd',
              recurring: { interval: 'month', interval_count: 3 },
            },
          },
        ],
      },
    } as any);
    expect(row).toMatchObject({
      interval: 'quarterly',
      amount: 33.73,
      periodEnd: '2026-12-08T00:00:00.000Z',
    });
  });
  it('counts manual access separately and excludes expired access', () => {
    expect(
      manualSubscriptionRow({ ...user, stripe_subscription_id: null }, Date.parse('2026-11-14'))
    ).toMatchObject({ status: 'manual_active', provider: 'manual' });
    expect(
      manualSubscriptionRow(
        { ...user, subscription_end_date: '2026-11-01' },
        Date.parse('2026-11-14')
      )
    ).toBeNull();
  });
  it('never labels unknown or canceled subscriptions active', () => {
    expect(
      summarizeSubscriptions([
        { status: 'unavailable' },
        { status: 'canceled' },
        { status: 'unpaid' },
      ] as any)
    ).toMatchObject({ active: 0, attention: 1 });
  });
});
