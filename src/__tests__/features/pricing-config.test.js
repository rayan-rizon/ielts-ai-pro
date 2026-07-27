import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { configurePricingPlans } from '@/features/subscription/hooks/usePricing';

describe('pricing plan configuration', () => {
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
});
