export const CONSENT_STORAGE_KEY = 'ielts_cookie_consent';
export const CONSENT_VERSION = '1.0';

const DEFAULT_IDS = {
  gtmId: 'GTM-TR6XQ2R3',
  pixelId: '991226963227159',
};

const FBC_BACKUP_KEY = '_fbc_backup';
const SIGNUP_TRACKED_KEY = 'signup_tracked_for';
const PURCHASE_TRACKED_PREFIX = 'meta_purchase_tracked:';
const CAPI_ENDPOINT = '/api/meta-capi';
const COMMERCE_CURRENCIES = new Set(['USD', 'BDT']);
// This is deliberately an optimisation proxy, not revenue. Purchases continue
// to carry the exact settled USD/BDT charge and are the only ROAS source.
const REGISTRATION_PROXY_VALUE = 1;
const REGISTRATION_PROXY_CURRENCY = 'USD';

/**
 * Events forwarded to the Meta Pixel.
 *
 * Keep this list short and funnel-shaped. Meta optimises against the event a
 * campaign is configured for, and every extra event dilutes the signal on a
 * low-volume account. `writing_checker_signup_gate_viewed` is included because
 * it is the only high-intent action an *unauthenticated* ad visitor can take,
 * which makes it the one usable upper-funnel event while conversion volume is
 * too low to optimise for CompleteRegistration directly.
 */
const PIXEL_EVENT_MAP = {
  signup_completed: 'CompleteRegistration',
  onboarding_completed: 'Lead',
  checkout_started: 'InitiateCheckout',
  manual_checkout_started: 'InitiateCheckout',
  subscription_purchase: 'Purchase',
  writing_checker_signup_gate_viewed: 'ViewContent',
};

/** Meta events also mirrored server-side via the Conversions API. */
const CAPI_EVENTS = new Set(['CompleteRegistration', 'Lead', 'InitiateCheckout', 'Purchase']);

/**
 * Events dropped entirely — not sent to the Pixel, GTM, or the dataLayer.
 *
 * These are diagnostic or micro-interaction events that produced reporting
 * noise without ever informing a decision. Failures belong in Sentry, which
 * already captures them with a stack trace; funnel micro-steps are recoverable
 * from the events that remain. Dropping them centrally keeps a single audited
 * list rather than scattering the policy across ~15 call sites.
 */
const DROPPED_EVENTS = new Set([
  // Redundant — the paired success/completion event already covers this step.
  'signin_started',
  'checkout_redirected',
  'checkout_login_redirect',
  'test_started',
  // Error paths — Sentry owns these and reports them with far more context.
  'auth_failed',
  'checkout_failed',
  'subscription_activation_error',
  'manual_subscription_request_failed',
  // Post-auth micro-interactions with no acquisition or retention decision
  // attached to them.
  'premium_analysis_viewed',
  'premium_analysis_review_clicked',
  'premium_analysis_upgrade_clicked',
  'premium_plan_saved',
  'writing_checker_demo_loaded',
  'writing_checker_feedback_preview_requested',
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

const readStorage = (key) => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable in private mode; never break tracking on it */
  }
};

const getFbp = () => getCookie('_fbp');

/**
 * Resolve the Meta click id.
 *
 * The cookie set by index.html is the primary source. The localStorage backup
 * covers browsers that reject the cookie write (Safari ITP), and the live URL
 * is checked last as a safety net — by the time most calls reach here the
 * router has already stripped `?fbclid=`, which is precisely why the value is
 * captured and persisted during the first paint instead.
 */
const getFbc = () => {
  const cookieFbc = getCookie('_fbc');
  if (cookieFbc) return cookieFbc;

  const stored = readStorage(FBC_BACKUP_KEY);
  if (stored) return stored;

  if (!isBrowser()) return null;
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    writeStorage(FBC_BACKUP_KEY, fbc);
    return fbc;
  }
  return null;
};

const createEventId = () => {
  if (isBrowser() && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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

const hasInvalidPurchaseValue = (value) => value === undefined || value <= 0;
const hasInvalidCurrency = (currency) => !COMMERCE_CURRENCIES.has(currency);
const isCommercePixelEvent = (pixelEvent) =>
  pixelEvent === 'Purchase' || pixelEvent === 'InitiateCheckout';
const isValuePixelEvent = (pixelEvent) =>
  isCommercePixelEvent(pixelEvent) || pixelEvent === 'CompleteRegistration';
const purchasePayloadIsInvalid = (value, currency) =>
  hasInvalidPurchaseValue(value) || hasInvalidCurrency(currency);

const buildEnrichedPayload = ({ eventName, pixelEvent, payload, value, currency, eventId }) => {
  const valueData = isValuePixelEvent(pixelEvent) ? { currency } : {};

  return {
    ...payload,
    ...(value !== undefined ? { value } : {}),
    ...valueData,
    ...(eventId ? { event_id: String(eventId) } : {}),
    event_name: eventName,
    event_time: new Date().toISOString(),
  };
};

/**
 * Mirror a conversion to the Conversions API.
 *
 * Browser-only Pixel delivery loses a large share of events to iOS/ITP,
 * ad blockers, and in-app browsers — which is most of this account's ad
 * traffic. `eventId` is shared with the Pixel call so Meta deduplicates the
 * two into a single conversion rather than double-counting.
 */
const sendToConversionsApi = (pixelEvent, { eventId, value, currency, payload }) => {
  if (!isBrowser() || !CAPI_EVENTS.has(pixelEvent)) return;

  const body = JSON.stringify({
    event_name: pixelEvent,
    event_id: String(eventId),
    event_source_url: window.location.href,
    fbp: getFbp(),
    fbc: getFbc(),
    ...(value !== undefined ? { value } : {}),
    ...(isValuePixelEvent(pixelEvent) ? { currency } : {}),
    ...(isCommercePixelEvent(pixelEvent)
      ? {
          content_ids: payload.plan_tier ? [String(payload.plan_tier)] : undefined,
          content_name: payload.plan_tier || payload.plan_name || 'subscription',
          content_type: 'product',
          num_items: 1,
        }
      : {}),
    user: {
      email: payload.email || null,
      external_id: payload.user_id || null,
    },
  });

  // keepalive lets the request survive the navigation that often follows a
  // conversion (checkout redirect, post-signup route change).
  try {
    window
      .fetch(CAPI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'same-origin',
      })
      ?.catch?.(() => {});
  } catch {
    /* measurement must never surface an error to the user */
  }
};

const trackPurchase = (payload, value, currency, eventId) => {
  const parameters = {
    value,
    currency,
    content_name: payload.plan_tier || payload.plan_name || 'subscription',
    content_ids: payload.plan_tier ? [String(payload.plan_tier)] : undefined,
    content_type: 'product',
    num_items: 1,
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

  import('@/lib/marketingAttribution')
    .then(({ captureMarketingAttribution }) => captureMarketingAttribution())
    .catch(() => {});

  // PageView to Meta is owned entirely by GTM's FB-Base-Tag (All Pages
  // trigger, with its own browser+server pairing). Sending it again here
  // duplicated every single PageView, since this call shares no event ID
  // with GTM's tag for Meta to deduplicate against.
  pushDataLayer({
    event: 'pageview',
    page: pathname,
    page_path: pathname,
    page_title: document.title,
  });
};

export const trackAppEvent = (eventName, payload = {}) => {
  if (!isBrowser() || !eventName) return;
  if (DROPPED_EVENTS.has(eventName)) return;

  const pixelEvent = PIXEL_EVENT_MAP[eventName];
  const normalizedValue =
    pixelEvent === 'CompleteRegistration' && payload.value === undefined
      ? REGISTRATION_PROXY_VALUE
      : normalizeValue(payload.value);
  const normalizedCurrency = normalizeCurrency(
    pixelEvent === 'CompleteRegistration' && !payload.currency
      ? REGISTRATION_PROXY_CURRENCY
      : payload.currency
  );
  const eventId = payload.event_id || payload.transaction_id || createEventId();

  // Never send commercial events with fabricated zero prices, a display-only
  // rate, or a currency the checkout provider cannot charge. Meta uses these
  // fields for ROAS and flags missing or malformed commerce data.
  if (
    isCommercePixelEvent(pixelEvent) &&
    purchasePayloadIsInvalid(normalizedValue, normalizedCurrency)
  ) {
    console.warn(`[Tracking] Suppressed ${pixelEvent} with invalid value or currency`);
    return;
  }

  const purchaseMarker =
    pixelEvent === 'Purchase' && payload.transaction_id
      ? `${PURCHASE_TRACKED_PREFIX}${String(payload.transaction_id)}`
      : null;
  if (purchaseMarker && readStorage(purchaseMarker)) return;

  const enrichedPayload = buildEnrichedPayload({
    eventName,
    pixelEvent,
    payload,
    value: normalizedValue,
    currency: normalizedCurrency,
    eventId,
  });

  pushDataLayer({ event: eventName, ...enrichedPayload });

  if (purchaseMarker) writeStorage(purchaseMarker, '1');

  // Everything not in PIXEL_EVENT_MAP stays in the dataLayer for GTM/GA and is
  // never forwarded to Meta, so the optimisation signal stays clean.
  if (!pixelEvent) return;

  // Server-side delivery is independent of the Pixel: it must still fire when
  // fbevents.js is blocked or has not loaded yet.
  sendToConversionsApi(pixelEvent, {
    eventId,
    value: normalizedValue,
    currency: normalizedCurrency,
    payload,
  });

  if (typeof window.fbq !== 'function') return;

  if (pixelEvent === 'Purchase') {
    trackPurchase(payload, normalizedValue, normalizedCurrency, eventId);
    return;
  }

  if (pixelEvent === 'InitiateCheckout') {
    window.fbq(
      'track',
      pixelEvent,
      {
        value: normalizedValue,
        currency: normalizedCurrency,
        content_name: payload.plan_tier || payload.plan_name || 'subscription',
        content_ids: payload.plan_tier ? [String(payload.plan_tier)] : undefined,
        content_type: 'product',
        num_items: 1,
        fbc: getFbc(),
        fbp: getFbp(),
      },
      { eventID: String(eventId) }
    );
    return;
  }

  window.fbq(
    'track',
    pixelEvent,
    {
      ...payload,
      ...(normalizedValue !== undefined ? { value: normalizedValue } : {}),
      ...(isValuePixelEvent(pixelEvent) ? { currency: normalizedCurrency } : {}),
      fbc: getFbc(),
      fbp: getFbp(),
    },
    { eventID: String(eventId) }
  );
};

/**
 * Report a completed registration exactly once per user.
 *
 * Called from the single point where a brand-new profile row is created, so it
 * covers every provider (Google, email, and anything added later) rather than
 * only the email/password branch. Google accounts for the large majority of
 * real signups, and none of them previously reached Meta at all.
 *
 * For email signups with confirmation enabled, this naturally fires when the
 * user returns from the verification link and the profile is created — which
 * is the point a registration is actually real.
 */
export const trackSignupCompleted = ({
  userId = null,
  method = 'unknown',
  email = null,
  channel = null,
} = {}) => {
  if (!isBrowser()) return false;

  // A profile insert can be retried after a transient failure, and the auth
  // listener can re-run on token refresh. Deduplicate so Meta never sees the
  // same registration twice.
  const marker = userId ? String(userId) : 'anonymous';
  if (readStorage(SIGNUP_TRACKED_KEY) === marker) return false;
  writeStorage(SIGNUP_TRACKED_KEY, marker);

  trackAppEvent('signup_completed', {
    method,
    user_id: userId || null,
    email: email || null,
    channel: channel || 'direct',
    path: window.location?.pathname || '/',
  });

  return true;
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
