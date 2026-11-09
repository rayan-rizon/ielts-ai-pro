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

function effectiveSubscriptionTier(user) {
  const tier = normalizeSubscriptionTier(user?.subscription_tier);
  const endDate = user?.subscription_end_date;
  if (CONTENT_TIER_ORDER[tier] >= CONTENT_TIER_ORDER.pro && endDate != null) {
    const endTime = Date.parse(endDate);
    if (!Number.isFinite(endTime) || endTime <= Date.now()) return 'free';
  }
  return tier;
}

export function hasContentAccess(user, requiredTier = 'free') {
  const userTier = effectiveSubscriptionTier(user);
  const minimumTier = normalizeSubscriptionTier(requiredTier);
  return CONTENT_TIER_ORDER[userTier] >= CONTENT_TIER_ORDER[minimumTier];
}

export function hasPaidAccess(user) {
  // Learner monetisation follows the purchased tier only. Admin permissions
  // are enforced separately by protected admin routes and must not make a free
  // account render Pro badges or paid learner features.
  const subscriptionTier = effectiveSubscriptionTier(user);
  return CONTENT_TIER_ORDER[subscriptionTier] >= CONTENT_TIER_ORDER.pro;
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
