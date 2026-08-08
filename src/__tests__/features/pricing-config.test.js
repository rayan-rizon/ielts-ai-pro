import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { configurePricingPlans } from '@/features/subscription/hooks/usePricing';
import { calculateCheckoutAmount, getPriceData } from '@/lib/pricingUtils';

describe('pricing plan configuration', () => {
  it('only advertises learner features that are available in the product', () => {
    const catalog = DEFAULT_PRICING_PLANS.flatMap((plan) => [
      ...plan.features,
      ...(plan.limitations || []),
    ]).join(' ');

    expect(catalog).not.toMatch(
      /Deep Predictive AI Insights|Downloadable Study Packs|Exclusive Community Access/
    );
    expect(catalog).toContain('AI Study Plan Made for You');
    expect(catalog).toContain('Grammar Units 1–3 + 5 Questions/Day');
    expect(catalog).toContain('5 Vocabulary Starter Kits');
    expect(catalog).toContain('All Topic Kits + Band 8 & 9');
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'free').features).toContain(
      'Basic 30-Day Progress Analytics'
    );
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'pro').features).toContain(
      'Advanced Weakness & Readiness Analytics'
    );
  });

  it('applies the same admin limits to the shared pricing catalog', () => {
    const plans = configurePricingPlans(DEFAULT_PRICING_PLANS, {
      settings: {
        pricing_tiers: {
          pro: { price: 9.99, originalPrice: 15 },
          premium: { price: 14.99, originalPrice: 20 },
        },
      },
      pricingCountry: 'US',
      tierLimits: {
        free: { writing_monthly_limit: 3, speaking_monthly_limit: 2 },
        pro: { writing_monthly_limit: 50, speaking_monthly_limit: 25 },
        premium: { writing_monthly_limit: 100, speaking_monthly_limit: 50 },
      },
    });

    expect(plans.find(({ tier }) => tier === 'free').features).toContain(
      '3 AI Writing Evaluations/month'
    );
    expect(plans.find(({ tier }) => tier === 'free').features).toContain(
      '2 AI Speaking Sessions/month'
    );
    expect(plans.find(({ tier }) => tier === 'pro').features).toContain(
      '50 AI Writing Evaluations/month'
    );
    expect(plans.find(({ tier }) => tier === 'pro').features).toContain(
      '25 AI Speaking Sessions/month'
    );
    expect(plans.find(({ tier }) => tier === 'premium').features).toContain(
      '100 AI Writing Evaluations/month'
    );
    expect(plans.find(({ tier }) => tier === 'premium').features).toContain(
      '50 AI Speaking Sessions/month'
    );
  });

  it('uses the BDT regional price only for Bangladesh and retains the global USD book elsewhere', () => {
    const settings = {
      pricing_tiers: {
        pro: {
          price: 9.99,
          originalPrice: 15,
          currency: 'USD',
          regional: [{ country: 'BD', price: 999, currency: 'BDT', symbol: '৳' }],
        },
      },
    };

    expect(getPriceData('pro', 9.99, 15, settings, 'BD')).toMatchObject({
      price: 999,
      currency: 'BDT',
      symbol: '৳',
    });
    expect(getPriceData('pro', 9.99, 15, settings, 'CA')).toMatchObject({
      price: 9.99,
      currency: 'USD',
      symbol: '$',
    });
  });

  it('reports the amount charged rather than the monthly display rate for quarterly checkout', () => {
    expect(calculateCheckoutAmount(9.99, 'quarterly')).toBe(25.47);
    expect(calculateCheckoutAmount(999, 'quarterly')).toBe(2547.45);
    expect(
      calculateCheckoutAmount(9.99, 'quarterly', {
        discount_type: 'fixed',
        discount_value: 5,
      })
    ).toBe(20.47);
  });
});
