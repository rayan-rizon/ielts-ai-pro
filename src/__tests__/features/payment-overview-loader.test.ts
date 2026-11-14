import { describe, expect, it, vi } from 'vitest';
import { loadPaymentOverview } from '../../../supabase/functions/admin-payment-history/overview';
function db(users: unknown[]) {
  const query = {
    select: () => query,
    or: () => query,
    order: () => query,
    range: async () => ({ data: users, error: null }),
  };
  return {
    from: (table: string) =>
      table === 'users'
        ? query
        : { select: () => ({ eq: async () => ({ count: 2, error: null }) }) },
  } as any;
}
const user = {
  id: '1',
  auth_id: 'auth-1',
  full_name: 'Learner',
  subscription_tier: 'pro',
  stripe_subscription_id: 'sub_1',
};
describe('payment overview provider boundary', () => {
  it('uses only locally associated subscriptions and sanitizes financial provider objects', async () => {
    const retrieve = vi.fn(async () => ({
      id: 'sub_1',
      status: 'active',
      currency: 'usd',
      cancel_at_period_end: false,
      items: { data: [] },
      latest_invoice: {
        id: 'in_1',
        status: 'paid',
        currency: 'usd',
        amount_remaining: 0,
        attempt_count: 1,
        payment_intent: { client_secret: 'must-not-leak' },
      },
    }));
    const result = await loadPaymentOverview({ subscriptions: { retrieve } } as any, db([user]));
    expect(retrieve).toHaveBeenCalledWith('sub_1', { expand: ['latest_invoice.payment_intent'] });
    expect(result).toMatchObject({ complete: true, summary: { active: 1, pending: 2 } });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });
  it('keeps a failed lookup visible and never marks the snapshot complete', async () => {
    const stripe = {
      subscriptions: {
        retrieve: async () => {
          throw new Error('provider unavailable');
        },
      },
    } as any;
    const result = await loadPaymentOverview(stripe, db([user]));
    expect(result).toMatchObject({ complete: false, summary: { active: 0, unverified: 1 } });
    expect(result.subscriptions[0]).toMatchObject({ status: 'unavailable', userId: '1' });
  });
});
