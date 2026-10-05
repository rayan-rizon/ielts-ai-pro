vi.mock('@/features/subscription/services/signupOffer', () => ({
  getSignupOffer: vi.fn(() => Promise.resolve(null)),
  getAppliedPromo: vi.fn(() => Promise.resolve(null)),
}));
import React from 'react';
import { supabase } from '@/lib/supabase';
import { getSignupOffer, getAppliedPromo } from '@/features/subscription/services/signupOffer';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pricingState = vi.hoisted(() => ({ user: null }));

vi.mock('@/features/subscription/hooks/usePricing', () => ({
  usePricing: (plans) => ({
    user: pricingState.user,
    plans,
    detectedCountry: 'US',
    isLoading: false,
    refetchUser: vi.fn(),
  }),
}));
vi.mock('@/features/marketing/services/MarketingDelivery', () => ({
  default: { recordSubscriptionFunnel: vi.fn(() => Promise.resolve()), record: vi.fn() },
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

const learner = (testDate, testDateSource = 'confirmed') => ({
  id: 'user-1',
  auth_id: 'auth-1',
  subscription_tier: 'free',
  test_date: testDate,
  test_date_source: testDateSource,
});

const proCard = () => screen.getByRole('heading', { name: 'Pro' }).closest('div.flex.h-full');

describe('pricing page picks the plan length from the exam date', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 27, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
    pricingState.user = null;
  });

  it('defaults to the 3-Month Pass when the exam is more than 45 days away', async () => {
    pricingState.user = learner('2026-12-10');
    render(<Pricing />);

    // One line under the toggle: the exam date wins over the billing note.
    expect(screen.getByText('Covers you until your exam on 10 Dec')).toBeInTheDocument();
    expect(screen.queryByText(/no auto-renewal/)).not.toBeInTheDocument();
    expect(screen.getByText('Save 25%')).toBeInTheDocument();
    // $9.99 × 3 × 0.75 = $22.48, shown as $7.49 a month.
    const pro = within(proCard());
    expect(pro.getByText('$7.49')).toBeInTheDocument();
    expect(pro.getByText('$22.48 paid once for 3 months')).toBeInTheDocument();
  });

  it('keeps monthly when the exam is close, and says a month covers it', async () => {
    pricingState.user = learner('2026-10-15');
    render(<Pricing />);

    expect(screen.queryByText(/no auto-renewal/)).not.toBeInTheDocument();
    expect(screen.getByText('Covers you until your exam on 15 Oct')).toBeInTheDocument();
    const pro = within(proCard());
    expect(pro.getByText('$9.99')).toBeInTheDocument();
    // The note slot is never empty on a paid card, so switching cannot resize it.
    expect(pro.getByText('Paid month to month')).toBeInTheDocument();
    expect(screen.queryByText(/paid once/)).not.toBeInTheDocument();
  });

  it('calls a study target a target date, not an exam', async () => {
    pricingState.user = learner('2026-12-10', 'estimated');
    render(<Pricing />);
    expect(screen.getByText('Covers you until your target date, 10 Dec')).toBeInTheDocument();
    expect(screen.queryByText(/your exam on/)).not.toBeInTheDocument();
  });

  it('stays on monthly with no line when there is no exam date', async () => {
    pricingState.user = learner(null);
    render(<Pricing />);

    expect(screen.queryByText(/Covers/)).not.toBeInTheDocument();
    expect(screen.getByText('Pay month to month')).toBeInTheDocument();
    expect(within(proCard()).getByText('$9.99')).toBeInTheDocument();
  });

  it('explains the pass under the toggle when there is no exam date', async () => {
    pricingState.user = learner(null);
    render(<Pricing />);

    fireEvent.click(screen.getByRole('button', { name: /3-Month Pass/ }));
    await waitFor(() =>
      expect(screen.getByText('One payment for 3 months · no auto-renewal')).toBeInTheDocument()
    );
    await waitFor(() => expect(screen.queryByText('Pay month to month')).not.toBeInTheDocument());
    expect(within(proCard()).getByText('$7.49')).toBeInTheDocument();
  });

  it('never overrides a plan length the learner picked', async () => {
    pricingState.user = learner('2026-12-10');
    const { rerender } = render(<Pricing />);

    expect(screen.getAllByText(/paid once/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    await waitFor(() => expect(screen.queryByText(/paid once/)).not.toBeInTheDocument());

    pricingState.user = { ...learner('2026-12-10'), updated_at: 'refetched' };
    rerender(<Pricing />);
    await waitFor(() => expect(screen.queryByText(/paid once/)).not.toBeInTheDocument());
    await waitFor(() => expect(within(proCard()).getByText('$9.99')).toBeInTheDocument());
  });
});

describe('explicit marketing offer priority', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => {
    pricingState.user = null;
    window.localStorage.clear();
    vi.restoreAllMocks();
  });
  const setup = () => {
    pricingState.user = {
      ...learner(null),
      promo_discount: { code: 'START20-PERSONAL', discount_type: 'percentage', discount_value: 20 },
    };
    window.localStorage.setItem('pending_promo_code', 'FIRST30');
  };
  it('checks an explicit marketing code without replacing the account offer when rejected', async () => {
    setup();
    const redeem = vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        success: false,
        error: 'Only one promo code can be used per account.',
      },
      error: null,
    });
    render(<Pricing />);
    await waitFor(() =>
      expect(redeem).toHaveBeenCalledWith('redeem_promo_code', { code_lookup: 'FIRST30' })
    );
    await waitFor(() => expect(within(proCard()).getByText('$7.99')).toBeInTheDocument());
    expect(getSignupOffer).not.toHaveBeenCalled();
  });
  it('keeps the starter discount when the marketing code is rejected', async () => {
    setup();
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: { success: false, error: 'Expired offer' },
      error: null,
    });
    render(<Pricing />);
    await waitFor(() => expect(window.localStorage.getItem('pending_promo_code')).toBeNull());
    expect(within(proCard()).getByText('$7.99')).toBeInTheDocument();
    expect(getSignupOffer).not.toHaveBeenCalled();
  });
});

describe('payment offer validation', () => {
  afterEach(() => {
    pricingState.user = null;
    vi.clearAllMocks();
    window.localStorage.clear();
  });
  it('drops an expired discount before showing payment instructions', async () => {
    window.localStorage.clear();
    pricingState.user = {
      ...learner(null),
      promo_discount: { code: 'START20-PERSONAL', discount_type: 'percentage', discount_value: 20 },
    };
    getAppliedPromo.mockResolvedValue(null);
    render(<Pricing />);
    await waitFor(() => expect(within(proCard()).getByText('$7.99')).toBeInTheDocument());
    fireEvent.click(within(proCard()).getByRole('button'));
    await waitFor(() => expect(getAppliedPromo).toHaveBeenCalled());
    await waitFor(() => expect(within(proCard()).getByText('$9.99')).toBeInTheDocument());
    expect(screen.queryByText('Manual Payment Portal')).not.toBeInTheDocument();
  });
});
