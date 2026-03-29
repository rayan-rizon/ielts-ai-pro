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

const getCookie = (name) => {
  if (!isBrowser()) return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const getFbp = () => getCookie('_fbp');

const getFbc = () => {
  const cookieFbc = getCookie('_fbc');
  if (cookieFbc) return cookieFbc;

  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    // Format: fb.1.<timestamp>.<fbclid>
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  return null;
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
    window.fbq('track', 'PageView', {
      fbc: getFbc(),
      fbp: getFbp(),
    });
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
      fbc: getFbc(),
      fbp: getFbp(),
    });
    return;
  }

  if (pixelEvent === 'InitiateCheckout') {
    window.fbq('track', pixelEvent, {
      value: normalizeValue(payload.value),
      currency: normalizeCurrency(payload.currency),
      content_name: payload.plan_tier || payload.plan_name || 'subscription',
      fbc: getFbc(),
      fbp: getFbp(),
    });
    return;
  }

  if (pixelEvent) {
    window.fbq('track', pixelEvent, {
      ...payload,
      fbc: getFbc(),
      fbp: getFbp(),
    });
    return;
  }

  window.fbq('trackCustom', eventName, {
    ...enrichedPayload,
    fbc: getFbc(),
    fbp: getFbp(),
  });
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

  if (typeof window.fbq === 'function') {
    const userData = {};
    if (profile.email) userData.em = profile.email.toLowerCase().trim();
    if (profile.full_name) {
      const names = profile.full_name.trim().split(/\s+/);
      userData.fn = names[0].toLowerCase();
      if (names.length > 1) userData.ln = names.slice(1).join(' ').toLowerCase();
    }
    userData.external_id = profile.id;

    // Re-init with Advanced Matching data
    window.fbq('init', TRACKING_IDS.pixelId, userData);
  }
};
