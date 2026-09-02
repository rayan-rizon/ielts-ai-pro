import { supabase } from '@/lib/supabase';

const appendCampaignParams = (url, campaignId, deliveryId) => {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('campaign_id', campaignId);
    parsed.searchParams.set('delivery_id', deliveryId);
    return parsed.origin === window.location.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.toString();
  } catch {
    return url;
  }
};

export const MarketingDelivery = {
  async listActive(userId) {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('marketing_deliveries')
      .select('*, campaign:marketing_campaigns(id,name,status,starts_at,ends_at)')
      .eq('user_id', userId)
      .in('status', ['accepted', 'delivered', 'viewed'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error?.code === '42P01') return [];
    if (error) throw error;

    const now = Date.now();
    return (data || []).filter((delivery) => {
      const campaign = delivery.campaign;
      if (!campaign || !['active', 'scheduled'].includes(campaign.status)) return false;
      if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now) return false;
      return !campaign.ends_at || new Date(campaign.ends_at).getTime() > now;
    });
  },

  async record(delivery, eventType, metadata = {}) {
    if (!delivery?.id || !delivery?.campaign_id || !delivery?.user_id) return;
    const dedupeKey = `${delivery.id}:${eventType}`;
    const { error } = await supabase.from('marketing_events').insert({
      campaign_id: delivery.campaign_id,
      delivery_id: delivery.id,
      user_id: delivery.user_id,
      event_type: eventType,
      channel: delivery.channel,
      dedupe_key: dedupeKey,
      metadata,
    });
    if (error && error.code !== '23505' && error.code !== '42P01') throw error;
  },

  linkFor(delivery) {
    return appendCampaignParams(delivery?.content?.cta_url, delivery?.campaign_id, delivery?.id);
  },
};

export default MarketingDelivery;
