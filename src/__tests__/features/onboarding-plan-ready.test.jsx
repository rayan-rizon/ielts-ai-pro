vi.mock('@/features/subscription/services/signupOffer', () => ({
  getSignupOffer: vi.fn(() => Promise.resolve(null)),
}));
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSignupOffer } from '@/features/subscription/services/signupOffer';
import CompleteStep from '@/features/onboarding/components/steps/CompleteStep';
import { buildOnboardingPlanPreview } from '@/features/onboarding/components/steps/onboardingPlanPreview';
import { loadPricingConfiguration } from '@/features/subscription/hooks/usePricing';

vi.mock('@/features/subscription/hooks/usePricing', async (importOriginal) => ({
  ...(await importOriginal()),
  loadPricingConfiguration: vi.fn(),
}));

const formData = {
  target_band_score: 7.5,
  estimated_weeks: 10,
  weak_area: 'writing',
  study_availability: {
    version: 1,
    timezone: 'Asia/Dhaka',
    days: { monday: 45, wednesday: 60, saturday: 90 },
  },
};

const bangladeshPricingConfig = {
  settings: {
    pricing_tiers: {
      pro: {
        price: 9.99,
        currency: 'USD',
        regional: [{ country: 'BD', price: 1100, currency: 'BDT', symbol: '\u09F3' }],
      },
      premium: {
        price: 15.99,
        currency: 'USD',
        regional: [{ country: 'BD', price: 1700, currency: 'BDT', symbol: '\u09F3' }],
      },
    },
  },
  userCountry: 'BD',
  pricingCountry: 'BD',
  tierLimits: {},
};

describe('onboarding plan-ready experience', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getSignupOffer.mockResolvedValue(null);
    loadPricingConfiguration.mockResolvedValue(bangladeshPricingConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("quotes the learner's regional price book instead of a hardcoded USD price", async () => {
    vi.useFakeTimers();
    render(<CompleteStep formData={formData} onUpgrade={vi.fn()} onContinue={vi.fn()} />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('\u09F31100')).toBeInTheDocument();
    expect(screen.getByText('\u09F31652')).toBeInTheDocument();
    expect(screen.getByText('\u09F31700')).toBeInTheDocument();
    expect(screen.getByText('\u09F337/day')).toBeInTheDocument();
    expect(screen.queryByText('$9.99')).not.toBeInTheDocument();
  });

  it('derives the preview from the learner answers without claiming a measured weakness', () => {
    expect(buildOnboardingPlanPreview(formData)).toMatchObject({
      focusLabel: 'Writing',
      targetBand: 7.5,
      weeklyMinutes: 195,
      studyDays: 3,
      timelineLabel: '10-week timeline',
    });
    expect(buildOnboardingPlanPreview(formData).planItems[0]).toEqual({
      label: 'Writing level check',
      detail: 'Starts by measuring your chosen focus before calling it a weakness.',
    });
  });

  it('moves from an engaging assembly state to the free learner subscription offer', async () => {
    vi.useFakeTimers();
    const onUpgrade = vi.fn();
    const onContinue = vi.fn();

    render(<CompleteStep formData={formData} onUpgrade={onUpgrade} onContinue={onContinue} />);

    expect(
      screen.getByRole('heading', { name: 'Building your Band 7.5 plan' })
    ).toBeInTheDocument();
    expect(screen.getByText(/matching 195 weekly minutes/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByRole('heading', { name: 'Your study plan preview is ready' })
    ).toBeInTheDocument();
    expect(screen.getByText('Band 7.5')).toBeInTheDocument();
    expect(screen.getByText('195 min')).toBeInTheDocument();
    expect(screen.queryByText(/see your starting plan/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /choose pro/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose premium/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue with free practice/i }));
    expect(onUpgrade).toHaveBeenNthCalledWith(1, 'pro', 'monthly');
    expect(onUpgrade).toHaveBeenNthCalledWith(2, 'premium', 'monthly');
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('leads paid cards with AI marking and shows Free as the limited baseline', async () => {
    vi.useFakeTimers();
    render(<CompleteStep formData={formData} onUpgrade={vi.fn()} onContinue={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    const card = (name) => screen.getByRole('heading', { name }).closest('article');
    const items = (name) =>
      [...card(name).querySelectorAll('li:not(.onboarding-plan-features__includes)')].map(
        (li) => li.textContent
      );

    expect(items('Pro')[0]).toMatch(/AI Writing Evaluation/);
    expect(items('Premium')[0]).toMatch(/AI Writing Evaluation/);
    expect(items('Pro').at(-1)).toMatch(/Practice Lab|Learning Path/);
    expect(card('Pro')).toHaveTextContent('Everything in Free, plus');
    expect(card('Free')).not.toHaveTextContent(/Unlimited/);
    expect(card('Free')).toHaveTextContent('Not included: AI Study Plan Made for You');
  });

  it('reports the plan offer only once the learner can actually see a price', async () => {
    vi.useFakeTimers();
    const onPlanOfferViewed = vi.fn();

    render(
      <CompleteStep
        formData={formData}
        onUpgrade={vi.fn()}
        onContinue={vi.fn()}
        onPlanOfferViewed={onPlanOfferViewed}
      />
    );

    // Still assembling: no price on screen, so no offer was seen.
    expect(onPlanOfferViewed).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onPlanOfferViewed).toHaveBeenCalledOnce();
  });

  it('shows a paid learner the prices with their own plan marked', async () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    const onUpgrade = vi.fn();
    const onPlanOfferViewed = vi.fn();

    render(
      <CompleteStep
        formData={formData}
        hasPaidPlan
        currentTier="premium"
        onUpgrade={onUpgrade}
        onContinue={onContinue}
        onPlanOfferViewed={onPlanOfferViewed}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('\u09F31100')).toBeInTheDocument();
    expect(screen.getByText('\u09F31700')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Included in your plan' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /switch to pro/i }));
    expect(onUpgrade).toHaveBeenCalledWith('pro', 'monthly');
    // A subscriber is never shown the offer, so it must not count as viewed.
    expect(onPlanOfferViewed).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /learning path/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Go to my dashboard' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('does not advance to the ready state after a failed profile save', () => {
    const source = readFileSync('src/features/onboarding/pages/Onboarding.jsx', 'utf8');

    expect(source).toContain('const saved = await submitData();');
    expect(source).toContain('if (saved) goNext();');
    expect(source).not.toContain('await submitData();\n      goNext();');
    expect(source).toContain(
      'if (hasPaidAccess(updatedUser)) triggerBackgroundPathGeneration(updatedUser);'
    );
    expect(source).not.toContain("toast.success('Preferences saved!'");
  });

  it('records how the onboarding gate was satisfied, not just that it was', () => {
    const source = readFileSync('src/features/onboarding/pages/Onboarding.jsx', 'utf8');

    // The questionnaire and the skip button both flip the routing gate; only
    // the outcome distinguishes real activation from a skip.
    expect(source).toContain("onboarding_outcome: 'answered'");
    expect(source).toContain("onboarding_outcome: 'skipped'");
    expect(source).toMatch(/onboarding_completed: true,\s*\n\s*onboarding_outcome: 'skipped',/);
    expect(source).toContain("trackAuthenticatedAppEvent('onboarding_plan_selected'");
    expect(source).toContain("trackAuthenticatedAppEvent('onboarding_free_continue'");
  });
});

describe('3-Month Exam Pass on the paywall', () => {
  beforeEach(() => {
    window.localStorage.clear();
    getSignupOffer.mockResolvedValue(null);
    loadPricingConfiguration.mockResolvedValue(bangladeshPricingConfig);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('defaults to the pass when the exam is far off, and carries the chosen length to checkout', async () => {
    vi.useFakeTimers();
    const onUpgrade = vi.fn();
    render(
      <CompleteStep
        formData={{ ...formData, timeline_type: 'estimated', estimated_weeks: 10 }}
        onUpgrade={onUpgrade}
        onContinue={vi.fn()}
      />
    );
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: /3-Month Pass/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('\u09F3825')).toBeInTheDocument();
    expect(screen.getByText('\u09F32,475 paid once for 3 months')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose Pro' }));
    expect(onUpgrade).toHaveBeenCalledWith('pro', 'quarterly');

    fireEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    expect(screen.getByText('\u09F31100')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose Premium' }));
    expect(onUpgrade).toHaveBeenLastCalledWith('premium', 'monthly');
  });
});

describe('personal signup offer on the paywall', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loadPricingConfiguration.mockResolvedValue(bangladeshPricingConfig);
    getSignupOffer.mockResolvedValue({
      available: true,
      code: 'START20-PERSONALTEST',
      discount_percent: 20,
      expires_at: new Date(Date.now() + 2 * 86400000 + 3 * 3600000).toISOString(),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
  });
  it('shows the personal code, discounts the same regional prices, and carries the code to checkout', async () => {
    vi.useFakeTimers();
    const onUpgrade = vi.fn();
    render(<CompleteStep formData={formData} onUpgrade={onUpgrade} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Your personal 20% signup offer')).toBeInTheDocument();
    expect(screen.getByText('START20-PERSONALTEST')).toBeInTheDocument();
    expect(screen.getByText('৳880')).toBeInTheDocument();
    expect(screen.getByText('৳1360')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Choose Pro' }));
    expect(onUpgrade).toHaveBeenCalledWith('pro', 'monthly');
    expect(window.localStorage.getItem('pending_promo_code')).toBe('START20-PERSONALTEST');
  });
  it('counts the offer down and drops the discount the moment it expires', async () => {
    vi.useFakeTimers();
    getSignupOffer.mockResolvedValue({
      available: true,
      code: 'START20-PERSONALTEST',
      discount_percent: 20,
      expires_at: new Date(Date.now() + 5000).toISOString(),
    });
    render(<CompleteStep formData={formData} onUpgrade={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Limited time')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Offer ends in' })).toBeInTheDocument();
    expect(screen.getByText('\u09F3880')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Limited time')).not.toBeInTheDocument();
    expect(screen.getByText('\u09F31100')).toBeInTheDocument();
  });

  it('preserves an explicit campaign code instead of issuing a signup offer', async () => {
    vi.useFakeTimers();
    window.localStorage.setItem('pending_promo_code', 'FIRST30');
    render(<CompleteStep formData={formData} />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(getSignupOffer).not.toHaveBeenCalled();
    expect(screen.queryByText('Your personal 20% signup offer')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('pending_promo_code')).toBe('FIRST30');
  });
  it('does not issue an offer to an existing paid learner', async () => {
    vi.useFakeTimers();
    render(<CompleteStep formData={formData} hasPaidPlan />);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(getSignupOffer).not.toHaveBeenCalled();
  });
});
