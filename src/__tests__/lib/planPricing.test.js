import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computePlanCharge,
  fromStripeAmount,
  resolvePriceBook,
  toStripeAmount,
} from '../../../supabase/functions/_shared/planPricing.ts';
import { configurePricingPlans } from '@/features/subscription/hooks/usePricing';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { getPlanPriceAndMeta } from '@/lib/pricingUtils';

// An admin configuration exercising every rule: two countries sharing a
// currency at different prices, a zero-decimal currency, a three-decimal one,
// a round-number price, and a row the admin left without a price.
const PRICING_TIERS = {
  pro: {
    price: 9.99,
    originalPrice: 15,
    currency: 'USD',
    regional: [
      { country: 'BD', price: 699, currency: 'BDT', symbol: '৳' },
      { country: 'IN', price: 499, currency: 'INR', symbol: '₹' },
      { country: 'DE', price: 8.99, currency: 'EUR', symbol: '€' },
      { country: 'FR', price: 7.99, currency: 'EUR', symbol: '€' },
      { country: 'JP', price: 1200, currency: 'JPY', symbol: '¥' },
      { country: 'KW', price: 2.5, currency: 'KWD', symbol: 'KD' },
      { country: 'PK', price: null, currency: 'PKR', symbol: '₨' },
    ],
  },
  premium: { price: 14.99, originalPrice: 20, currency: 'USD', regional: [] },
};

describe('resolvePriceBook', () => {
  it('applies a regional row to its country only, never by currency', () => {
    expect(resolvePriceBook(PRICING_TIERS, 'pro', 'DE')).toMatchObject({
      price: 8.99,
      currency: 'EUR',
    });
    expect(resolvePriceBook(PRICING_TIERS, 'pro', 'FR')).toMatchObject({
      price: 7.99,
      currency: 'EUR',
    });
  });

  it('falls back to the global price for other countries and for a row with no price', () => {
    expect(resolvePriceBook(PRICING_TIERS, 'pro', 'CA')).toMatchObject({
      price: 9.99,
      currency: 'USD',
      country: null,
    });
    expect(resolvePriceBook(PRICING_TIERS, 'pro', 'PK')).toMatchObject({
      price: 9.99,
      currency: 'USD',
    });
    expect(resolvePriceBook(PRICING_TIERS, 'pro', null)).toMatchObject({ currency: 'USD' });
  });

  it('scales the "was" price with the regional price', () => {
    expect(resolvePriceBook(PRICING_TIERS, 'pro', 'IN').originalPrice).toBe(
      Math.round((15 / 9.99) * 499)
    );
  });
});

describe('Stripe minor units', () => {
  it.each([
    [22.48, 'USD', 2248],
    [1573, 'BDT', 157300],
    [2700, 'JPY', 2700],
    [5.625, 'KWD', 5630],
  ])('%s %s is sent as %s', (amount, currency, minor) => {
    expect(toStripeAmount(amount, currency)).toBe(minor);
  });

  it('reads amounts back in major units', () => {
    expect(fromStripeAmount(2248, 'usd')).toBe(22.48);
    expect(fromStripeAmount(2700, 'jpy')).toBe(2700);
    expect(fromStripeAmount(5630, 'kwd')).toBe(5.63);
  });
});

/**
 * Replays what create-checkout-session does — list price on the line item,
 * promo as an exact amount_off coupon — and returns what Stripe collects.
 */
function stripeCollects(country, tier, interval, promo) {
  const book = resolvePriceBook(PRICING_TIERS, tier, country);
  const charge = computePlanCharge(book.price, interval, book.currency, promo);
  const unitAmount = toStripeAmount(charge.listAmount, book.currency);
  const amountOff = promo ? unitAmount - toStripeAmount(charge.amount, book.currency) : 0;
  return {
    currency: book.currency,
    amount: fromStripeAmount(unitAmount - amountOff, book.currency),
  };
}

describe('the pricing page and Stripe agree', () => {
  const plans = configurePricingPlans(DEFAULT_PRICING_PLANS, {
    settings: { pricing_tiers: PRICING_TIERS },
    tierLimits: {},
  });
  const planFor = (country) =>
    configurePricingPlans(DEFAULT_PRICING_PLANS, {
      settings: { pricing_tiers: PRICING_TIERS },
      pricingCountry: country,
      tierLimits: {},
    });

  const promos = [
    null,
    { code: 'SAVE30', discount_type: 'percentage', discount_value: 30 },
    { code: 'FIVE', discount_type: 'fixed', discount_value: 5 },
  ];
  const cases = [];
  for (const country of ['US', 'BD', 'IN', 'DE', 'FR', 'JP', 'KW', 'PK']) {
    for (const tier of ['pro', 'premium']) {
      for (const interval of ['monthly', 'quarterly']) {
        for (const promo of promos) cases.push([country, tier, interval, promo]);
      }
    }
  }

  it('has a plan catalog to price', () => {
    expect(plans.length).toBeGreaterThan(0);
  });

  it.each(cases)('%s %s %s promo=%o', (country, tier, interval, promo) => {
    const page = getPlanPriceAndMeta({
      plans: planFor(country),
      planTier: tier,
      billingInterval: interval,
      promoDiscount: promo,
    });
    const stripe = stripeCollects(country, tier, interval, promo);

    expect(page.currency).toBe(stripe.currency);
    expect(page.chargeAmount).toBe(stripe.amount);
  });
});

describe('create-checkout-session prices from the shared module', () => {
  const checkout = readFileSync('supabase/functions/create-checkout-session/index.ts', 'utf8');

  it('takes the currency from the admin row, never from the request', () => {
    expect(checkout).toMatch(/from '\.\.\/_shared\/planPricing\.ts'/);
    expect(checkout).not.toMatch(/ALLOWED_CURRENCIES/);
    expect(checkout).toMatch(/const validatedCurrency = \(priceBook\?\.currency \|\| 'USD'\)/);
  });

  it('refuses to charge an amount the page did not show', () => {
    expect(checkout).toMatch(/code: 'price_changed'/);
    expect(checkout).toMatch(/amount_off: String\(promoAmountOff\)/);
    expect(checkout).not.toMatch(/percent_off\s*[:=]/);
  });
});
