export const CONSENT_STORAGE_KEY = 'ielts_cookie_consent';
export const CONSENT_VERSION = '1.0';

const DEFAULT_IDS = {
  gtmId: 'GTM-TR6XQ2R3',
  pixelId: '991226963227159',
};

const PIXEL_EVENT_MAP = {
  signup_completed: 'CompleteRegistration',
  checkout_started: 'InitiateCheckout',
  subscription_purchase: 'Purchase',
  test_completed: 'ViewContent',
  onboarding_completed: 'Lead',
};

const isBrowser = () => typeof window !== 'undefined';

const isPlaceholder = (value) =>
  typeof value === 'string' && /^%VITE_[A-Z0-9_]+%$/i.test(value.trim());

const resolveTrackingIds = () => {
  const envGtm = import.meta.env?.VITE_GTM_ID;
  const envPixel = import.meta.env?.VITE_META_PIXEL_ID;

  return {
    gtmId: !envGtm || isPlaceholder(envGtm) ? DEFAULT_IDS.gtmId : envGtm,
    pixelId: !envPixel || isPlaceholder(envPixel) ? DEFAULT_IDS.pixelId : envPixel,
  };
};

export const TRACKING_IDS = resolveTrackingIds();

const readConsent = () => {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getConsentState = () => {
  const consent = readConsent();

  return {
    analytics: consent?.analytics === true,
    marketing: consent?.marketing === true,
    functional: consent?.functional === true,
  };
};

export const hasAnalyticsConsent = () => getConsentState().analytics;
export const hasMarketingConsent = () => getConsentState().marketing;

export const refreshTrackingBootstrap = () => {
  // No-op: tracking fires unconditionally. Kept for call-site compatibility.
};

const pushDataLayer = (payload) => {
  if (!isBrowser()) return false;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  return true;
};

const normalizeCurrency = (value) => (value || 'USD').toUpperCase();

const normalizeValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const trackPageView = (pathname = '/') => {
  if (!isBrowser()) return;

  pushDataLayer({
    event: 'pageview',
    page: pathname,
    page_path: pathname,
    page_title: document.title,
  });

  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

export const trackAppEvent = (eventName, payload = {}) => {
  if (!isBrowser() || !eventName) return;

  const enrichedPayload = {
    ...payload,
    event_name: eventName,
    event_time: new Date().toISOString(),
  };

  pushDataLayer({ event: eventName, ...enrichedPayload });

  if (typeof window.fbq !== 'function') return;

  const pixelEvent = PIXEL_EVENT_MAP[eventName];
  if (pixelEvent === 'Purchase') {
    window.fbq('track', pixelEvent, {
      value: normalizeValue(payload.value) || 0,
      currency: normalizeCurrency(payload.currency),
      content_name: payload.plan_tier || payload.plan_name || 'subscription',
    });
    return;
  }

  if (pixelEvent === 'InitiateCheckout') {
    window.fbq('track', pixelEvent, {
      value: normalizeValue(payload.value),
      currency: normalizeCurrency(payload.currency),
      content_name: payload.plan_tier || payload.plan_name || 'subscription',
    });
    return;
  }

  if (pixelEvent) {
    window.fbq('track', pixelEvent, payload);
    return;
  }

  window.fbq('trackCustom', eventName, enrichedPayload);
};

export const pushUserIdentity = (profile) => {
  if (!isBrowser() || !profile) return;
  pushDataLayer({
    event: 'user_identified',
    user_id: profile.id || null,
    is_authenticated: true,
    subscription_tier: profile.subscription_tier || 'free',
    is_admin: profile.role === 'admin' || false,
  });
};
