import { describe, expect, it } from 'vitest';
import { matchesPaymentSearch, mergePaymentHistory } from '@/components/admin/paymentHistory';

const stripeCheckout = {
  id: 'stripe-checkout-cs_123',
  transaction_id: 'cs_123',
  payment_method: 'stripe',
  created_at: '2026-07-30T12:00:00.000Z',
  sender_phone: 'Stripe Checkout',
  user: { full_name: 'Stripe learner', email: 'learner@example.com' },
};

describe('admin payment history', () => {
  it('includes a Stripe checkout that is not yet persisted in payment_requests', () => {
    expect(mergePaymentHistory([], [stripeCheckout])).toEqual([stripeCheckout]);
  });

  it('does not show a duplicate when the Stripe transaction is already persisted', () => {
    const storedStripePayment = {
      ...stripeCheckout,
      id: 'payment-request-1',
      created_at: '2026-07-30T12:01:00.000Z',
    };

    expect(mergePaymentHistory([storedStripePayment], [stripeCheckout])).toEqual([
      storedStripePayment,
    ]);
  });

  it('searches Stripe records without assuming manual-payment fields are present', () => {
    expect(matchesPaymentSearch(stripeCheckout, 'stripe')).toBe(true);
    expect(matchesPaymentSearch(stripeCheckout, 'learner@example.com')).toBe(true);
    expect(matchesPaymentSearch({ user: null }, 'anything')).toBe(false);
  });
});
