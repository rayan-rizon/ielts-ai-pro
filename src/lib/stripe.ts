/**
 * Stripe Configuration
 *
 * Contains Stripe publishable key and price ID mappings for subscription tiers.
 * Price IDs should be updated after creating prices in Stripe Dashboard.
 */

// Stripe publishable key (test mode)
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Stripe Product IDs (created in sandbox)
export const STRIPE_PRODUCTS = {
  pro: 'prod_ToFAjZLkwiAPQT',
  premium: 'prod_ToFA5ewtshwYhq',
} as const;

/**
 * Price IDs mapping
 *
 * IMPORTANT: Update these after creating prices in Stripe Dashboard:
 * https://dashboard.stripe.com/test/products
 *
 * Create recurring prices for each product:
 * - Pro Monthly: $9.99/month
 * - Pro Quarterly: $24.99/quarter (15% off)
 * - Premium Monthly: $15.99/month
 * - Premium Quarterly: $40.99/quarter (15% off)
 */
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1Sqcr88v1EFv86ZYkhjuTH9p',
    quarterly: 'price_1Sqcr98v1EFv86ZYPbIkARmI',
  },
  premium: {
    monthly: 'price_1Sqcr98v1EFv86ZY6mZ4Ir1O',
    quarterly: 'price_1Sqcr98v1EFv86ZYqyzAHUFb',
  },
} as const;

// Tier display names
export const TIER_NAMES = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
} as const;

export type SubscriptionTier = keyof typeof TIER_NAMES;
export type BillingInterval = 'monthly' | 'quarterly';

/**
 * Get the Stripe Price ID for a given tier and billing interval
 */
export function getPriceId(tier: SubscriptionTier, interval: BillingInterval): string | null {
  if (tier === 'free') return null;
  return STRIPE_PRICES[tier]?.[interval] || null;
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PUBLISHABLE_KEY) && !STRIPE_PUBLISHABLE_KEY.includes('REPLACE');
}
