import { supabase } from '@/lib/supabase';

const IGNORABLE_DB_CODES = new Set(['23505', '42P01']);
const DISMISSIVE_ACTIONS = new Set(['dismissed', 'not_interested', 'not_useful']);
const ACTIVE_INTERVENTIONS = new Set(['approved', 'queued', 'sent']);
const ACTIVE_CAMPAIGNS = new Set(['active', 'scheduled']);

const appendCampaignParams = (url, campaignId, deliveryId, promoCode) => {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('campaign_id', campaignId);
    parsed.searchParams.set('delivery_id', deliveryId);
    if (promoCode && !parsed.searchParams.has('promo')) parsed.searchParams.set('promo', promoCode);
    return parsed.origin === window.location.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.toString();
  } catch {
    return url;
  }
};

const isCompleteDelivery = (delivery) => {
  if (!delivery?.id) return false;
  if (!delivery.campaign_id) return false;
  return Boolean(delivery.user_id);
};

const isIgnorableDatabaseError = (error) => {
  if (!error) return true;
  return IGNORABLE_DB_CODES.has(error.code);
};

const isSnoozedFeedback = (item, now) => {
  if (item.action !== 'snoozed') return false;
  if (!item.snoozed_until) return false;
  return new Date(item.snoozed_until).getTime() > now;
};

const isSuppressedFeedback = (item, now) => {
  if (DISMISSIVE_ACTIONS.has(item.action)) return true;
  return isSnoozedFeedback(item, now);
};

const fetchSuppressedDeliveryIds = async (deliveryIds, now) => {
  if (!deliveryIds.length) return new Set();
  const { data: feedback } = await supabase
    .from('marketing_contact_feedback')
    .select('delivery_id,action,snoozed_until')
    .in('delivery_id', deliveryIds);

  const suppressed = (feedback || [])
    .filter((item) => isSuppressedFeedback(item, now))
    .map((item) => item.delivery_id);

  return new Set(suppressed);
};

const fetchDeliveriesForUser = async (userId) => {
  const { data, error } = await supabase
    .from('marketing_deliveries')
    .select(
      '*, campaign:marketing_campaigns(id,name,status,starts_at,ends_at,metadata), intervention:marketing_interventions(id,status,playbook_key,expires_at)'
    )
    .eq('user_id', userId)
    .in('status', ['accepted', 'delivered', 'viewed'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error?.code === '42P01') return [];
  if (error) throw error;
  return data || [];
};

const isInterventionActive = (intervention) => {
  return Boolean(intervention?.status && ACTIVE_INTERVENTIONS.has(intervention.status));
};

const isCampaignStatusActive = (campaign, hasActiveIntervention) => {
  if (!campaign?.status) return false;
  if (hasActiveIntervention) return true;
  if (campaign.metadata?.superseded_by_autopilot === true) return false;
  return ACTIVE_CAMPAIGNS.has(campaign.status);
};

const isTimingActive = (campaign, intervention, now) => {
  const startsAt = campaign.starts_at ? new Date(campaign.starts_at).getTime() : 0;
  if (startsAt > now) return false;

  const expiresAt = intervention?.expires_at
    ? new Date(intervention.expires_at).getTime()
    : Infinity;
  if (expiresAt <= now) return false;

  const endsAt = campaign.ends_at ? new Date(campaign.ends_at).getTime() : Infinity;
  return endsAt > now;
};

const isDeliveryPlayable = (delivery, hiddenIds, now) => {
  if (hiddenIds.has(delivery.id)) return false;
  const campaign = delivery.campaign;
  if (!campaign) return false;
  const activeIntervention = isInterventionActive(delivery.intervention);
  if (!isCampaignStatusActive(campaign, activeIntervention)) return false;
  return isTimingActive(campaign, delivery.intervention, now);
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const assertPushSupported = (publicKey) => {
  if (!publicKey) {
    throw new Error('Push reminders are not configured yet');
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push reminders are not supported by this browser');
  }
};

const createPushSubscription = async (registration, publicKey) => {
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
};

export const MarketingDelivery = {
  async recordSubscriptionFunnel(
    eventType,
    { planTier = null, billingInterval = null, dedupeKey = null, metadata = {} } = {}
  ) {
    const { data, error } = await supabase.rpc('record_subscription_funnel_event', {
      p_event_type: eventType,
      p_plan_tier: planTier,
      p_billing_interval: billingInterval,
      p_dedupe_key: dedupeKey,
      p_metadata: metadata,
    });
    // Keep pricing usable while the migration rolls out or when telemetry is
    // temporarily unavailable. Checkout is the product path; measurement is a
    // best-effort side effect.
    if (!isIgnorableDatabaseError(error) && !['42883', 'PGRST202'].includes(error?.code)) {
      throw error;
    }
    return data || null;
  },

  async listActive(userId) {
    if (!userId) return [];
    const deliveries = await fetchDeliveriesForUser(userId);
    if (!deliveries.length) return [];

    const now = Date.now();
    const deliveryIds = deliveries.map((delivery) => delivery.id);
    const hiddenIds = await fetchSuppressedDeliveryIds(deliveryIds, now);

    return deliveries.filter((delivery) => isDeliveryPlayable(delivery, hiddenIds, now));
  },

  async record(delivery, eventType, metadata = {}) {
    if (!isCompleteDelivery(delivery)) return;
    const dedupeKey = `${delivery.id}:${eventType}`;
    const { error } = await supabase.from('marketing_events').upsert(
      {
        campaign_id: delivery.campaign_id,
        delivery_id: delivery.id,
        user_id: delivery.user_id,
        event_type: eventType,
        channel: delivery.channel,
        dedupe_key: dedupeKey,
        metadata,
      },
      { onConflict: 'dedupe_key', ignoreDuplicates: true }
    );
    if (!isIgnorableDatabaseError(error)) {
      throw error;
    }
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
    assertPushSupported(publicKey);

    const registration = await navigator.serviceWorker.register('/marketing-push-sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Push permission was not granted');
    }

    const subscription = await createPushSubscription(registration, publicKey);
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
    return appendCampaignParams(
      delivery?.content?.cta_url,
      delivery?.campaign_id,
      delivery?.id,
      delivery?.content?.promo_code
    );
  },
};

export default MarketingDelivery;
