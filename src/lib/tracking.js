export const CONSENT_STORAGE_KEY = 'ielts_cookie_consent';
export const CONSENT_VERSION = '1.0';

const DEFAULT_IDS = {
  gtmId: 'GTM-TR6XQ2R3',
  pixelId: '991226963227159',
};

const PIXEL_EVENT_MAP = {
  signup_completed: 'CompleteRegistration',
  checkout_started: 'InitiateCheckout',
  manual_checkout_started: 'InitiateCheckout',
  subscription_purchase: 'Purchase',
  test_completed: 'ViewContent',
  onboarding_completed: 'Lead',
};

// Keep these events in dataLayer for GTM/GA/product analytics,
// but suppress them from Meta Pixel to avoid optimization noise.
const META_SUPPRESSED_EVENTS = new Set([
  'signin_started',
  'signin_success',
  'signup_verification_sent',
  'auth_failed',
  'billing_portal_opened',
  'checkout_redirected',
  'checkout_failed',
  'test_started',
  'test_completed',
  'writing_submitted',
  'speaking_submitted',
  'subscription_activation_error',
  'premium_analysis_viewed',
  'premium_analysis_review_clicked',
  'premium_plan_saved',
  'premium_analysis_upgrade_clicked',
]);

const isBrowser = () => typeof window !== 'undefined';

const isPlaceholder = (value) =>
  typeof value === 'string' && /^%VITE_[A-Z0-9_]+%$/i.test(value.trim());

const resolveTrackingIds = () => {
  const envPixel = import.meta.env?.VITE_META_PIXEL_ID;

  const gtmId = DEFAULT_IDS.gtmId;
  const pixelId = !envPixel || isPlaceholder(envPixel) ? DEFAULT_IDS.pixelId : envPixel;

  // Sync back to window for index.html compatibility if it runs after React
  if (isBrowser()) {
    window.__TRACKING_CONFIG__ = window.__TRACKING_CONFIG__ || {};
    window.__TRACKING_CONFIG__.gtmId = gtmId;
    window.__TRACKING_CONFIG__.pixelId = pixelId;
  }

  return { gtmId, pixelId };
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

const hasInvalidPurchaseValue = (value) => value === undefined || value < 0;
const hasInvalidCurrency = (currency) => !/^[A-Z]{3}$/.test(currency);
const isCommercePixelEvent = (pixelEvent) =>
  pixelEvent === 'Purchase' || pixelEvent === 'InitiateCheckout';
const purchasePayloadIsInvalid = (value, currency) =>
  hasInvalidPurchaseValue(value) || hasInvalidCurrency(currency);

const buildEnrichedPayload = ({ eventName, pixelEvent, payload, value, currency, eventId }) => {
  const commerceData = isCommercePixelEvent(pixelEvent) ? { currency } : {};

  return {
    ...payload,
    ...(value !== undefined ? { value } : {}),
    ...commerceData,
    ...(eventId ? { event_id: String(eventId) } : {}),
    event_name: eventName,
    event_time: new Date().toISOString(),
  };
};

const trackPurchase = (payload, value, currency, eventId) => {
  const parameters = {
    value,
    currency,
    content_name: payload.plan_tier || payload.plan_name || 'subscription',
    transaction_id: payload.transaction_id || eventId,
    fbc: getFbc(),
    fbp: getFbp(),
  };
  const options = eventId ? { eventID: String(eventId) } : undefined;
  window.fbq('track', 'Purchase', parameters, options);
};

export const refreshTrackingBootstrap = () => {
  if (!isBrowser()) return;

  // Keep a stable compatibility hook for consent flows that
  // expect a tracking refresh signal after preference changes.
  window.dispatchEvent(new Event('cookie-consent-updated'));
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

  const pixelEvent = PIXEL_EVENT_MAP[eventName];
  const normalizedValue = normalizeValue(payload.value);
  const normalizedCurrency = normalizeCurrency(payload.currency);
  const eventId = payload.event_id || payload.transaction_id;

  // Never send a Purchase with a fabricated zero or malformed currency.
  // Meta uses these fields for ROAS and flags missing/invalid price data.
  if (pixelEvent === 'Purchase' && purchasePayloadIsInvalid(normalizedValue, normalizedCurrency)) {
    console.warn('[Tracking] Suppressed Purchase with invalid value or currency');
    return;
  }

  const enrichedPayload = buildEnrichedPayload({
    eventName,
    pixelEvent,
    payload,
    value: normalizedValue,
    currency: normalizedCurrency,
    eventId,
  });

  pushDataLayer({ event: eventName, ...enrichedPayload });

  // Keep analytics events in dataLayer while preventing Meta event overload.
  if (META_SUPPRESSED_EVENTS.has(eventName)) return;

  if (typeof window.fbq !== 'function') return;

  if (pixelEvent === 'Purchase') {
    trackPurchase(payload, normalizedValue, normalizedCurrency, eventId);
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
