/**
 * Stripe Configuration
 *
 * Contains Stripe publishable key and price ID mappings for subscription tiers.
 * Price IDs should be updated after creating prices in Stripe Dashboard.
 */

import { optionalPublicEnv } from '@/lib/publicEnv';

// Stripe publishable key (test mode)
export const STRIPE_PUBLISHABLE_KEY = optionalPublicEnv('VITE_STRIPE_PUBLISHABLE_KEY') || '';

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
 * Only the monthly prices are used as a fallback. The `quarterly` interval is
 * the one-time 3-Month Exam Pass, which create-checkout-session always prices
 * inline (Stripe payment mode) — a recurring quarterly price cannot be charged
 * once, so the IDs below are legacy.
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
