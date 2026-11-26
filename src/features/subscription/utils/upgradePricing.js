import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { createPageUrl } from '@/utils';

export const TIER_DEFAULTS = {
  BD: {
    pro: { writing: 50, speaking: 25, price: 499, symbol: '৳' },
    premium: { writing: 100, speaking: 50, price: 799, symbol: '৳' },
  },
  GLOBAL: {
    pro: { writing: 100, speaking: 50, price: 9.99, symbol: '$' },
    premium: { writing: 200, speaking: 100, price: 15.99, symbol: '$' },
  },
};

function getDetectedCountry(pricingCountry, pricingConfig) {
  if (pricingCountry) return pricingCountry.trim().toUpperCase();
  if (pricingConfig?.userCountry) return pricingConfig.userCountry.trim().toUpperCase();
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('user_country');
    if (saved) return saved.trim().toUpperCase();
  }
  return '';
}

export function detectIsBangladesh(pricingCountry, pricingConfig) {
  const country = getDetectedCountry(pricingCountry, pricingConfig);
  if (country === 'BD' || country === 'BANGLADESH') {
    return true;
  }
  if (!country && typeof Intl !== 'undefined') {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === 'Asia/Dhaka' || tz === 'Asia/Chittagong';
  }
  return false;
}

function findTierPlan(tier, plans) {
  if (Array.isArray(plans)) {
    const matched = plans.find((p) => p.tier === tier);
    if (matched) return matched;
  }
  return DEFAULT_PRICING_PLANS.find((p) => p.tier === tier);
}

export function resolvePlanConfig(tier, plans, pricingConfig, isBD) {
  const plan = findTierPlan(tier, plans);
  const region = isBD ? TIER_DEFAULTS.BD[tier] : TIER_DEFAULTS.GLOBAL[tier];
  const limits = pricingConfig?.tierLimits?.[tier] || {};

  return {
    writingLimit: limits.writing_monthly_limit ?? region.writing,
    speakingLimit: limits.speaking_monthly_limit ?? region.speaking,
    symbol: plan.currencySymbol || region.symbol,
    price: plan.basePrice ?? region.price,
    oldPrice: plan.oldPrice,
  };
}

export function pricingDestination(search, tier) {
  const incoming = new URLSearchParams(search);
  const params = new URLSearchParams();
  if (tier) params.set('plan', tier);
  ['campaign_id', 'delivery_id', 'promo'].forEach((key) => {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  });
  return `${createPageUrl('Pricing')}${params.size ? `?${params}` : ''}`;
}
