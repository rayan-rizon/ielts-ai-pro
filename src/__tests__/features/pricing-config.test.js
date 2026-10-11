import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { configurePricingPlans } from '@/features/subscription/hooks/usePricing';
import {
  calculateCheckoutAmount,
  calculatePrice,
  EXAM_PASS_DISCOUNT,
  formatBillingNote,
  formatExamPassCharge,
  getPlanPriceAndMeta,
  getPriceData,
} from '@/lib/pricingUtils';
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
    // Vocabulary is not a plan differentiator on the pricing table.
    expect(catalog).not.toMatch(/Vocabulary|Kits/);
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

  it('reports the amount charged rather than the monthly display rate for the Exam Pass', () => {
    expect(calculateCheckoutAmount(9.99, 'quarterly')).toBe(22.48);
    // A round admin price is charged in round amounts, in any currency.
    expect(calculateCheckoutAmount(999, 'quarterly')).toBe(2248);
    expect(
      calculateCheckoutAmount(9.99, 'quarterly', {
        discount_type: 'fixed',
        discount_value: 5,
      })
    ).toBe(17.48);
    expect(calculatePrice(9.99, 'quarterly')).toBe('7.49');
  });

  it('charges and shows taka in whole units', () => {
    expect(calculateCheckoutAmount(699, 'quarterly', null, 'BDT')).toBe(1573);
    expect(calculateCheckoutAmount(999, 'quarterly', null, 'BDT')).toBe(2248);
    expect(calculatePrice(699, 'quarterly', null, 'BDT')).toBe('524');
    expect(calculatePrice(999, 'quarterly', null, 'BDT')).toBe('749');
    expect(calculatePrice(699, 'monthly', null, 'BDT')).toBe('699');
    // A 30% code on ৳699 is ৳489.30; bKash is asked for ৳489.
    const code = { discount_type: 'percentage', discount_value: 30 };
    expect(calculateCheckoutAmount(699, 'monthly', code, 'BDT')).toBe(489);
    // Other currencies keep cents.
    expect(calculateCheckoutAmount(9.99, 'quarterly', null, 'USD')).toBe(22.48);
  });

  it('bills the plan currency chosen for the card', () => {
    const plans = [{ tier: 'pro', basePrice: 699, currency: 'BDT' }];
    expect(
      getPlanPriceAndMeta({ plans, planTier: 'pro', billingInterval: 'quarterly' })
    ).toMatchObject({ displayPrice: '524', chargeAmount: 1573, currency: 'BDT' });
  });

  it('states the single Exam Pass charge next to the monthly rate', () => {
    expect(formatExamPassCharge({ basePrice: 9.99, currencySymbol: '$' })).toBe(
      '$22.48 paid once for 3 months'
    );
    expect(formatExamPassCharge({ basePrice: 699, currencySymbol: '৳', currency: 'BDT' })).toBe(
      '৳1,573 paid once for 3 months'
    );
    expect(formatExamPassCharge({ basePrice: 0 })).toBeNull();
  });

  it('gives every paid card a billing line in both plan lengths, and Free none', () => {
    const pro = { basePrice: 9.99, currencySymbol: '$' };
    expect(formatBillingNote(pro, 'monthly')).toBe('Paid month to month');
    expect(formatBillingNote(pro, 'quarterly')).toBe('$22.48 paid once for 3 months');
    expect(formatBillingNote({ basePrice: 0 }, 'quarterly')).toBeNull();
  });

  it('charges the card the same Exam Pass discount the cards advertise, once', () => {
    const checkout = readFileSync(
      resolve(process.cwd(), 'supabase/functions/create-checkout-session/index.ts'),
      'utf8'
    );
    // One module decides the price for both; neither keeps its own copy.
    expect(checkout).toMatch(/computePlanCharge\(priceBook\.price, interval, priceBook\.currency/);
    expect(checkout).toMatch(/mode: isExamPass \? 'payment' : 'subscription'/);
    expect(checkout).not.toMatch(/0\.85|EXAM_PASS_DISCOUNT = /);
    expect(EXAM_PASS_DISCOUNT).toBe(0.25);
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

describe('START20 checkout pricing', () => {
  const offer = {
    discount_type: 'percentage',
    discount_value: 20,
    applicable_plans: ['pro', 'premium'],
  };
  it.each([
    [9.99, 'USD', 7.99],
    [14.99, 'USD', 11.99],
    [699, 'BDT', 559],
    [999, 'BDT', 799],
  ])('discounts %s %s by 20 percent with provider rounding', (price, currency, expected) => {
    expect(calculateCheckoutAmount(price, 'monthly', offer, currency)).toBe(expected);
  });
  it('does not apply a Pro-only promo to Premium', () => {
    const meta = getPlanPriceAndMeta({
      plans: [{ tier: 'premium', basePrice: 14.99, currency: 'USD' }],
      planTier: 'premium',
      billingInterval: 'monthly',
      promoDiscount: { ...offer, applicable_plans: ['pro'] },
    });
    expect(meta.chargeAmount).toBe(14.99);
  });
});
