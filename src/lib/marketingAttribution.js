const STORAGE_KEY = 'marketing_campaign_attribution';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const captureMarketingAttribution = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id');
  const deliveryId = params.get('delivery_id');
  if (!UUID.test(campaignId || '') || !UUID.test(deliveryId || '')) return null;
  const value = {
    campaign_id: campaignId,
    delivery_id: deliveryId,
    captured_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* no-op */
  }
  return value;
};

export const getMarketingAttribution = () => {
  const captured = captureMarketingAttribution();
  if (captured) return captured;
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored || !UUID.test(stored.campaign_id || '') || !UUID.test(stored.delivery_id || ''))
      return null;
    if (Date.now() - new Date(stored.captured_at).getTime() > 30 * 86_400_000) return null;
    return stored;
  } catch {
    return null;
  }
};

export const clearMarketingAttribution = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
};
