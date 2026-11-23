type Campaign = { cta_url?: string; cta_label?: string; metadata?: { lifecycle_stage?: string } };
type Offer = { code: string; expiresAt?: string | null; discountPercent?: number | null };
type CheckoutPlan = { tier?: string | null; interval?: string | null };

const PLAN_NAMES: Record<string, string> = { pro: 'Pro', premium: 'Premium' };
const INTERVALS = ['monthly', 'quarterly'];

const hasLiveTwentyPercentOffer = (offer: Offer | null, now: number) =>
  Boolean(
    offer?.code &&
    offer.discountPercent === 20 &&
    offer.expiresAt &&
    Date.parse(offer.expiresAt) > now
  );

// The plan page for the plan a learner chose, or null when it is not a plan we sell.
function checkoutPlanUrl(plan?: CheckoutPlan | null) {
  if (!plan?.tier || !PLAN_NAMES[plan.tier]) return null;
  const params = new URLSearchParams({ plan: plan.tier, checkout: '1' });
  if (plan.interval && INTERVALS.includes(plan.interval)) params.set('interval', plan.interval);
  return `/pricing?${params.toString()}`;
}

// Send a learner who left checkout straight back to the plan they chose. Without a
// recognised plan the learner lands on the plan page instead of a guessed one.
function checkoutRecoveryAction(
  campaign: Campaign,
  offer: Offer | null,
  now: number,
  plan?: CheckoutPlan | null
) {
  const url = checkoutPlanUrl(plan);
  if (!url) {
    return { url: campaign.cta_url || '/pricing', label: campaign.cta_label || 'Finish your plan' };
  }
  const label = `Continue with ${PLAN_NAMES[plan!.tier!]}`;
  return { url, label: hasLiveTwentyPercentOffer(offer, now) ? `${label} · 20% off` : label };
}

export function getCampaignAction(
  campaign: Campaign,
  offer: Offer | null,
  now = Date.now(),
  plan?: CheckoutPlan | null
) {
  if (campaign.metadata?.lifecycle_stage === 'checkout') {
    return checkoutRecoveryAction(campaign, offer, now, plan);
  }
  if (campaign.metadata?.lifecycle_stage === 'signup' && hasLiveTwentyPercentOffer(offer, now)) {
    return {
      url: '/pricing?plan=premium&interval=monthly&checkout=1',
      label: 'Premium monthly · 20% off',
    };
  }
  return { url: campaign.cta_url || '/pricing', label: campaign.cta_label || 'Learn more' };
}
