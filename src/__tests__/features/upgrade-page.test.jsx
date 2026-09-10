import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Upgrade from '@/features/subscription/pages/Upgrade';
import * as usePricingModule from '@/features/subscription/hooks/usePricing';

vi.mock('@/features/subscription/hooks/usePricing');

function renderWithProviders(ui) {
  return render(
    <HelmetProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </HelmetProvider>
  );
}

describe('Upgrade Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Bangladesh localization with BDT (৳) pricing in plan cards without numbers in capability cards or MFS mentions', () => {
    usePricingModule.usePricing.mockReturnValue({
      plans: [
        {
          tier: 'pro',
          basePrice: 499,
          oldPrice: 750,
          currencySymbol: '৳',
          currency: 'BDT',
          features: ['50 AI Writing Evaluations/month', '25 AI Speaking Sessions/month'],
        },
        {
          tier: 'premium',
          basePrice: 799,
          oldPrice: 1200,
          currencySymbol: '৳',
          currency: 'BDT',
          features: ['100 AI Writing Evaluations/month', '50 AI Speaking Sessions/month'],
        },
      ],
      pricingConfig: {
        userCountry: 'BD',
        pricingCountry: 'BD',
        tierLimits: {
          pro: { writing_monthly_limit: 50, speaking_monthly_limit: 25 },
          premium: { writing_monthly_limit: 100, speaking_monthly_limit: 50 },
        },
      },
      pricingCountry: 'BD',
      isLoading: false,
    });

    const { container } = renderWithProviders(<Upgrade />);

    // Header & Badges
    expect(screen.getByText('MEMBERSHIP UPGRADE')).toBeInTheDocument();
    expect(screen.getByText('Pro & Premium')).toBeInTheDocument();
    expect(screen.getAllByText('Cancel Anytime').length).toBeGreaterThanOrEqual(1);

    // Global web app neutrality: No bKash, Nagad or regional currency badges
    expect(screen.queryByText(/bkash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nagad/i)).not.toBeInTheDocument();
    expect(screen.queryByText('BDT Pricing (৳)')).not.toBeInTheDocument();

    // Capability cards are qualitative: NO "50 (Pro) or 100 (Premium)" in capability card
    expect(screen.getByText('EXAMINER-GRADE')).toBeInTheDocument();
    expect(screen.getByText('Detailed Writing Task 1 & Task 2 evaluations')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time Speaking mock scoring & fluency feedback')
    ).toBeInTheDocument();
    expect(screen.queryByText(/50 \(Pro\) or 100 \(Premium\)/i)).not.toBeInTheDocument();

    // Pro Plan Card in BDT with exact quota numbers
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('৳499')).toBeInTheDocument();
    expect(screen.getByText('৳750')).toBeInTheDocument();
    expect(screen.getByText('50 AI Writing Evaluations / month')).toBeInTheDocument();
    expect(screen.getByText('25 AI Speaking Sessions / month')).toBeInTheDocument();

    // Premium Plan Card in BDT with exact quota numbers
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    expect(screen.getByText('৳799')).toBeInTheDocument();
    expect(screen.getByText('৳1200')).toBeInTheDocument();
    expect(screen.getByText('100 AI Writing Evaluations / month')).toBeInTheDocument();
    expect(screen.getByText('50 AI Speaking Sessions / month')).toBeInTheDocument();

    // Trust badge is clean and global
    expect(screen.getByText('Instant Activation')).toBeInTheDocument();
    expect(screen.getByText('Official IELTS Standards')).toBeInTheDocument();

    // Dot grid and no neon glow
    expect(container.querySelector('.bg-size-\\[20px_20px\\]')).toBeInTheDocument();
    expect(container.querySelector('.h-112.w-112')).not.toBeInTheDocument();
  });

  it('renders Global/US configuration with USD ($) pricing and global evaluation limits in plan cards', () => {
    usePricingModule.usePricing.mockReturnValue({
      plans: [
        {
          tier: 'pro',
          basePrice: 9.99,
          oldPrice: 15,
          currencySymbol: '$',
          currency: 'USD',
          features: ['100 AI Writing Evaluations/month', '50 AI Speaking Sessions/month'],
        },
        {
          tier: 'premium',
          basePrice: 15.99,
          oldPrice: 25,
          currencySymbol: '$',
          currency: 'USD',
          features: ['200 AI Writing Evaluations/month', '100 AI Speaking Sessions/month'],
        },
      ],
      pricingConfig: {
        userCountry: 'US',
        pricingCountry: 'US',
        tierLimits: {
          pro: { writing_monthly_limit: 100, speaking_monthly_limit: 50 },
          premium: { writing_monthly_limit: 200, speaking_monthly_limit: 100 },
        },
      },
      pricingCountry: 'US',
      isLoading: false,
    });

    renderWithProviders(<Upgrade />);

    // Pro Plan in USD
    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('100 AI Writing Evaluations / month')).toBeInTheDocument();
    expect(screen.getByText('50 AI Speaking Sessions / month')).toBeInTheDocument();

    // Premium Plan in USD
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('200 AI Writing Evaluations / month')).toBeInTheDocument();
    expect(screen.getByText('100 AI Speaking Sessions / month')).toBeInTheDocument();

    // Navigation links
    const proLink = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(proLink).toHaveAttribute('href', expect.stringContaining('/pricing?plan=pro'));

    const premiumLink = screen.getByRole('link', { name: /get premium/i });
    expect(premiumLink).toHaveAttribute('href', expect.stringContaining('/pricing?plan=premium'));
  });
});
