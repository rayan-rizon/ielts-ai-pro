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
      .select(
        '*, campaign:marketing_campaigns(id,name,status,starts_at,ends_at), intervention:marketing_interventions(id,status,playbook_key,expires_at)'
      )
      .eq('user_id', userId)
      .in('status', ['accepted', 'delivered', 'viewed'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error?.code === '42P01') return [];
    if (error) throw error;

    const now = Date.now();
    const deliveryIds = (data || []).map((delivery) => delivery.id);
    const { data: feedback } = deliveryIds.length
      ? await supabase
          .from('marketing_contact_feedback')
          .select('delivery_id,action,snoozed_until')
          .in('delivery_id', deliveryIds)
      : { data: [] };
    const hidden = new Set(
      (feedback || [])
        .filter(
          (item) =>
            ['dismissed', 'not_interested', 'not_useful'].includes(item.action) ||
            (item.action === 'snoozed' &&
              item.snoozed_until &&
              new Date(item.snoozed_until) > new Date())
        )
        .map((item) => item.delivery_id)
    );

    return (data || []).filter((delivery) => {
      const campaign = delivery.campaign;
      if (hidden.has(delivery.id)) return false;
      const activeIntervention =
        delivery.intervention &&
        ['approved', 'queued', 'sent'].includes(delivery.intervention.status);
      if (!campaign || (!activeIntervention && !['active', 'scheduled'].includes(campaign.status)))
        return false;
      if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now) return false;
      if (
        delivery.intervention?.expires_at &&
        new Date(delivery.intervention.expires_at).getTime() <= now
      )
        return false;
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

  async feedback(delivery, action, { snoozedUntil = null, metadata = {} } = {}) {
    if (!delivery?.id) return null;
    const { data, error } = await supabase.rpc('record_marketing_contact_feedback', {
      p_delivery_id: delivery.id,
      p_action: action,
      p_snoozed_until: snoozedUntil,
      p_metadata: metadata,
    });
    if (error) throw error;
    return data;
  },

  async getPreferences(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('learner_marketing_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error?.code === '42P01') return null;
    if (error) throw error;
    return data;
  },

  async savePreferences(userId, patch) {
    const { data, error } = await supabase
      .from('learner_marketing_preferences')
      .upsert(
        { user_id: userId, ...patch, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async enablePush(userId) {
    const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
    if (!publicKey) throw new Error('Push reminders are not configured yet');
    if (!('serviceWorker' in navigator) || !('PushManager' in window))
      throw new Error('Push reminders are not supported by this browser');
    const registration = await navigator.serviceWorker.register('/marketing-push-sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Push permission was not granted');
    const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
    const bytes = Uint8Array.from(
      atob((publicKey + padding).replace(/-/g, '+').replace(/_/g, '/')),
      (character) => character.charCodeAt(0)
    );
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytes,
    });
    const json = subscription.toJSON();
    const { error } = await supabase.rpc('replace_my_marketing_push_subscription', {
      p_endpoint: json.endpoint,
      p_p256dh: json.keys?.p256dh,
      p_auth_secret: json.keys?.auth,
      p_user_agent: navigator.userAgent.slice(0, 500),
    });
    if (error) throw error;
    return this.savePreferences(userId, { push_enabled: true });
  },

  async disablePush(userId) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/marketing-push-sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
    }
    const { error } = await supabase
      .from('marketing_push_subscriptions')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return this.savePreferences(userId, { push_enabled: false });
  },

  linkFor(delivery) {
    return appendCampaignParams(delivery?.content?.cta_url, delivery?.campaign_id, delivery?.id);
  },
};

export default MarketingDelivery;
