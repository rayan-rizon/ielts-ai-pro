import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { configurePricingPlans } from '@/features/subscription/hooks/usePricing';
import { calculateCheckoutAmount, getPlanPriceAndMeta, getPriceData } from '@/lib/pricingUtils';
import { getWritingPartCapacity, getWritingQuotaUsage } from '@/lib/tierLimitsUtils';

const adminLimitsSource = readFileSync(
  resolve(process.cwd(), 'src/components/admin/settings/TierRateLimitsSettings.jsx'),
  'utf8'
);

describe('pricing plan configuration', () => {
  it('treats any two Writing part reviews as one configured evaluation', () => {
    expect(getWritingPartCapacity(3)).toBe(6);
    expect(getWritingQuotaUsage(1)).toBe(0.5);
    expect(getWritingQuotaUsage(2)).toBe(1);
    expect(getWritingQuotaUsage(6)).toBe(3);
  });

  it('refreshes learner and pricing quota data after an admin saves limits', () => {
    expect(adminLimitsSource).toContain('clearLimitsCache()');
    expect(adminLimitsSource).toContain("queryKey: ['tier-rate-limits']");
    expect(adminLimitsSource).toContain("queryKey: ['subscription', 'pricingConfig']");
  });

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
    const practiceLabels = [
      '2 Practice Lab AI Tests/Day',
      '10 Practice Lab AI Tests/Day',
      '20 Practice Lab AI Tests/Day',
    ];
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'free').features).toContain(
      practiceLabels[0]
    );
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'pro').features).toContain(
      practiceLabels[1]
    );
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'premium').features).toContain(
      practiceLabels[2]
    );

    const readingAiFeatures = DEFAULT_PRICING_PLANS.flatMap((plan) => plan.features).filter(
      (feature) => feature.toLowerCase().includes('ai reading assistant')
    );
    expect(readingAiFeatures).toEqual([
      '5 AI Reading Assistant requests/day',
      'Unlimited AI Reading Assistant',
      'Unlimited AI Reading Assistant',
    ]);
    expect(DEFAULT_PRICING_PLANS.find(({ tier }) => tier === 'pro').features).toContain(
      'Simplify, translate & break down sentences'
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
        free: {
          writing_monthly_limit: 3,
          speaking_monthly_limit: 2,
          reading_daily_limit: 1,
          reading_monthly_limit: 4,
          listening_daily_limit: 2,
          listening_monthly_limit: 6,
        },
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
    expect(plans.find(({ tier }) => tier === 'free').features).toContain(
      'Reading tests: 1/day, 4/month'
    );
    expect(plans.find(({ tier }) => tier === 'free').features).toContain(
      'Listening tests: 2/day, 6/month'
    );
    expect(plans.find(({ tier }) => tier === 'pro').features).toContain(
      'Unlimited Reading & Listening tests'
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

  it('keeps plan-selection tracking safe while prices are still loading', () => {
    expect(
      getPlanPriceAndMeta({
        plans: undefined,
        planTier: 'pro',
        billingInterval: 'monthly',
        promoDiscount: null,
        currentTier: undefined,
      })
    ).toMatchObject({
      plan: undefined,
      displayPrice: '0',
      chargeAmount: 0,
      currency: 'USD',
      tier: 'free',
    });
  });
});
