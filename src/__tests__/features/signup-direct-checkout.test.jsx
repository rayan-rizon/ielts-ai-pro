import React, { StrictMode } from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getAppliedPromo } from '@/features/subscription/services/signupOffer';

const state = vi.hoisted(() => ({ user: null, loading: false, country: 'US', refetch: vi.fn() }));
vi.mock('@/features/subscription/hooks/usePricing', () => ({
  usePricing: (plans) => ({
    user: state.user,
    plans,
    detectedCountry: state.country,
    pricingCountry: state.country,
    isLoading: state.loading,
    refetchUser: state.refetch,
    refetchPricing: state.refetch,
  }),
}));
vi.mock('@/features/subscription/services/signupOffer', () => ({
  getSignupOffer: vi.fn(async () => null),
  getAppliedPromo: vi.fn(),
}));
vi.mock('@/features/marketing/services/MarketingDelivery', () => ({
  default: { recordSubscriptionFunnel: vi.fn(async () => {}), record: vi.fn() },
}));
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/components/PromoCodeRedemption', () => ({ default: () => null }));
vi.mock('@/features/subscription/components/FAQSection', () => ({ default: () => null }));
vi.mock('@/lib/tracking', () => ({
  getGaSessionHandle: () => ({}),
  trackAppEvent: vi.fn(),
  trackAuthenticatedAppEvent: vi.fn(),
}));
const { default: Pricing } = await import('@/features/subscription/pages/Pricing');
const promo = {
  code: 'START20A7C4E92B',
  discount_type: 'percentage',
  discount_value: 20,
  applicable_plans: ['pro', 'premium'],
};
const link = '/pricing?plan=premium&interval=monthly&checkout=1&promo=START20A7C4E92B';
const checkoutCalls = (fetcher) =>
  fetcher.mock.calls.filter(([url]) => String(url).includes('/create-checkout-session'));

// Only the remote boundaries are mocked: exercise real promo resolution, pricing,
// checkout validation and request construction in the Pricing component.
describe('signup email direct checkout', () => {
  let fetcher;
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', link);
    localStorage.clear();
    state.user = {
      id: 'u1',
      auth_id: 'a1',
      subscription_tier: 'free',
      promo_discount: promo,
      test_date: '2099-12-10',
    };
    state.loading = false;
    state.country = 'US';
    getAppliedPromo.mockResolvedValue(promo);
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { access_token: 'session', user: { id: 'a1' } } },
    });
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { success: true, type: 'discount', ...promo },
      error: null,
    });
    // Stop after the server receives checkout; no live checkout or payment.
    fetcher = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Test checkout stopped' }),
    }));
    vi.stubGlobal('fetch', fetcher);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('opens Premium monthly at the discounted amount exactly once, including Strict Mode', async () => {
    render(
      <StrictMode>
        <Pricing />
      </StrictMode>
    );
    await waitFor(() => expect(checkoutCalls(fetcher)).toHaveLength(1));
    expect(JSON.parse(checkoutCalls(fetcher)[0][1].body)).toMatchObject({
      tier: 'premium',
      interval: 'monthly',
      expected_amount: 12.79,
      currency: 'usd',
    });
    expect(new URLSearchParams(window.location.search).has('checkout')).toBe(false);
  });
  it('waits for current pricing before checkout', async () => {
    state.loading = true;
    const { rerender } = render(<Pricing />);
    expect(checkoutCalls(fetcher)).toHaveLength(0);
    state.loading = false;
    rerender(<Pricing />);
    await waitFor(() => expect(checkoutCalls(fetcher)).toHaveLength(1));
  });
  it('applies the email code before starting checkout', async () => {
    let resolvePromo;
    state.user = { ...state.user, promo_discount: null };
    supabase.rpc.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromo = resolve;
        })
    );
    render(<Pricing />);
    await waitFor(() => expect(resolvePromo).toBeTypeOf('function'));
    expect(checkoutCalls(fetcher)).toHaveLength(0);
    resolvePromo({ data: { success: true, type: 'discount', ...promo }, error: null });
    await waitFor(() => expect(checkoutCalls(fetcher)).toHaveLength(1));
    expect(JSON.parse(checkoutCalls(fetcher)[0][1].body).expected_amount).toBe(12.79);
  });
  it('stops instead of starting full-price checkout when the discount has expired', async () => {
    getAppliedPromo.mockResolvedValue(null);
    render(<Pricing />);
    await waitFor(() => expect(getAppliedPromo).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('$15.99')).toBeInTheDocument());
    expect(checkoutCalls(fetcher)).toHaveLength(0);
  });
  it('does not start checkout for another account’s rejected offer', async () => {
    state.user = { ...state.user, promo_discount: null };
    supabase.rpc.mockResolvedValue({
      data: { success: false, error: 'Invalid or expired code' },
      error: null,
    });
    render(<Pricing />);
    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith('redeem_promo_code', { code_lookup: promo.code })
    );
    await waitFor(() => expect(localStorage.getItem('pending_promo_code')).toBeNull());
    expect(checkoutCalls(fetcher)).toHaveLength(0);
  });
  it('stops when the discount cannot be verified', async () => {
    getAppliedPromo.mockRejectedValue(new Error('Network unavailable'));
    render(<Pricing />);
    await waitFor(() => expect(getAppliedPromo).toHaveBeenCalled());
    expect(checkoutCalls(fetcher)).toHaveLength(0);
  });
  it('keeps existing paid subscribers out of a new subscription checkout', async () => {
    state.user = {
      ...state.user,
      subscription_tier: 'premium',
      stripe_subscription_id: 'sub_existing',
    };
    render(<Pricing />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument()
    );
    expect(checkoutCalls(fetcher)).toHaveLength(0);
  });
  it('preserves checkout when the session expires before the payment request', async () => {
    sessionStorage.clear();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    render(<Pricing />);
    await waitFor(() => expect(sessionStorage.getItem('auth_destination')).toContain('checkout=1'));
    const destination = new URL(
      sessionStorage.getItem('auth_destination'),
      'https://www.ieltsai.pro'
    );
    expect(Object.fromEntries(destination.searchParams)).toMatchObject({
      plan: 'premium',
      interval: 'monthly',
      promo: promo.code,
      checkout: '1',
    });
    expect(checkoutCalls(fetcher)).toHaveLength(0);
    sessionStorage.clear();
  });
  it('does not start checkout on an ordinary pricing link', async () => {
    window.history.replaceState({}, '', '/pricing?plan=premium');
    render(<Pricing />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument()
    );
    expect(checkoutCalls(fetcher)).toHaveLength(0);
  });
});
