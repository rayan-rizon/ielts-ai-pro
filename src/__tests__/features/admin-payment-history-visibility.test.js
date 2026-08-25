import { isVisibleIeltsCheckout } from '../../../supabase/functions/admin-payment-history/visibility.ts';

const validSession = {
  id: 'cs_live_real',
  mode: 'subscription',
  payment_status: 'paid',
  amount_total: 1499,
  metadata: {
    supabase_user_id: 'user-1',
    supabase_auth_id: 'auth-1',
    tier: 'premium',
    interval: 'monthly',
  },
};

describe('admin Stripe payment visibility', () => {
  it('keeps future paid IELTS subscriptions with valid provenance', () => {
    expect(isVisibleIeltsCheckout(validSession)).toBe(true);
  });

  it('excludes unrelated, zero-value, and test-promo sessions', () => {
    expect(isVisibleIeltsCheckout({ ...validSession, amount_total: 0 })).toBe(false);
    expect(isVisibleIeltsCheckout({ ...validSession, metadata: {} })).toBe(false);
    expect(
      isVisibleIeltsCheckout({
        ...validSession,
        metadata: { ...validSession.metadata, promo_code: 'TEST100' },
      })
    ).toBe(false);
  });

  it('keeps the legacy cleanup list narrow and reversible', () => {
    expect(isVisibleIeltsCheckout(validSession, new Set(['cs_live_other']))).toBe(true);
    expect(isVisibleIeltsCheckout(validSession, new Set([validSession.id]))).toBe(false);
  });
});
