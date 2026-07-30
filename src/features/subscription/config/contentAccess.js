export const CONTENT_TIER_ORDER = {
  free: 0,
  pro: 1,
  premium: 2,
  admin: 3,
};

export function normalizeSubscriptionTier(tier) {
  const value = String(tier || 'free').toLowerCase();
  return Object.hasOwn(CONTENT_TIER_ORDER, value) ? value : 'free';
}

export function hasContentAccess(user, requiredTier = 'free') {
  const userTier = normalizeSubscriptionTier(user?.subscription_tier);
  const minimumTier = normalizeSubscriptionTier(requiredTier);
  return CONTENT_TIER_ORDER[userTier] >= CONTENT_TIER_ORDER[minimumTier];
}

export function contentTierLabel(tier) {
  const normalizedTier = normalizeSubscriptionTier(tier);
  return normalizedTier === 'free' ? 'Free' : normalizedTier === 'pro' ? 'Pro' : 'Premium';
}

export function getContentStatus({ user, requiredTier = 'free', completed = false }) {
  const tier = normalizeSubscriptionTier(requiredTier);
  if (!hasContentAccess(user, tier)) return { label: contentTierLabel(tier), tone: 'locked' };
  if (completed) return { label: 'Completed', tone: 'completed' };
  return {
    label: tier === 'free' ? 'Free' : 'Available',
    tone: tier === 'free' ? 'free' : 'included',
    visible: tier === 'free',
  };
}
