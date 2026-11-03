type Campaign = { cta_url?: string; cta_label?: string; metadata?: { lifecycle_stage?: string } };
type Offer = { code: string; expiresAt?: string | null; discountPercent?: number | null };

export function getCampaignAction(campaign: Campaign, offer: Offer | null, now = Date.now()) {
  if (
    campaign.metadata?.lifecycle_stage === 'signup' &&
    offer?.code &&
    offer.discountPercent === 20 &&
    offer.expiresAt &&
    Date.parse(offer.expiresAt) > now
  ) {
    return {
      url: '/pricing?plan=premium&interval=monthly&checkout=1',
      label: 'Premium monthly · 20% off',
    };
  }
  return { url: campaign.cta_url || '/pricing', label: campaign.cta_label || 'Learn more' };
}
