import {
  captureProductEvent,
  captureProductPageView,
  identifyProductUser,
  syncProductAnalyticsConsent,
} from '@/lib/posthog';

export { CONSENT_STORAGE_KEY, CONSENT_VERSION } from '@/lib/trackingConfig';

const DEFAULT_IDS = {
  gtmId: 'GTM-TR6XQ2R3',
  pixelId: '991226963227159',
  /**
   * GA4 measurement id. The GA4 tags themselves live in GTM — this constant
   * exists only to locate the `_ga_<STREAM>` session cookie, whose name is
   * derived from the measurement id.
   */
  measurementId: 'G-GF63SJZ9ZJ',
};

/**
 * Whether the GA4 `purchase` event is owned by the server.
 *
 * GA4 does not deduplicate events, so exactly one producer may emit `purchase`.
 * Default (unset/false) keeps the historical behaviour: the browser pushes
 * `subscription_purchase`, the GTM "GA4 - Purchase" trigger picks it up. Set
 * `VITE_GA4_SERVER_PURCHASE=true` only once the Stripe webhook is configured
 * with GA4_MEASUREMENT_ID and GA4_API_SECRET; the browser then stops pushing
 * that event and the webhook becomes the single source of revenue truth.
 * Meta reporting is unaffected either way — it never used the dataLayer.
 */
const GA4_SERVER_PURCHASE =
  String(import.meta.env?.VITE_GA4_SERVER_PURCHASE ?? '').toLowerCase() === 'true';

const FBC_BACKUP_KEY = '_fbc_backup';
const SIGNUP_TRACKED_KEY = 'signup_tracked_for';
const PURCHASE_TRACKED_PREFIX = 'meta_purchase_tracked:';
const CAPI_ENDPOINT = '/api/meta-capi';
const COMMERCE_CURRENCIES = new Set(['USD', 'BDT']);

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
  // B2B institution application. SubmitApplication is deliberately not Lead:
  // Lead is the learner onboarding signal the BD campaign optimises against.
  institution_application_submitted: 'SubmitApplication',
};

/**
 * A second standard event fired alongside the primary one, for a signal Meta
 * cannot infer from the primary event alone.
 *
 * `subscription_purchase` only ever fires for a brand-new subscription — it's
 * reported once from the Stripe-checkout-return page and the upgrade-detection
 * effect, never on renewal (recurring charges happen silently via webhook with
 * no page visit). That makes it safe to mirror as Subscribe: every Purchase
 * sent from this event genuinely is a new subscription start. Meta's own
 * guidance for subscription businesses is to send both — Purchase alone reads
 * as a one-off sale and never lets the algorithm learn to optimise for
 * recurring revenue specifically.
 */
const COMPANION_PIXEL_EVENT = {
  subscription_purchase: 'Subscribe',
};

/** Meta events also mirrored server-side via the Conversions API. */
const CAPI_EVENTS = new Set([
  'CompleteRegistration',
  'Lead',
  'InitiateCheckout',
  'Purchase',
  'Subscribe',
  'SubmitApplication',
]);

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
const SHA256_HEX = /^[a-f0-9]{64}$/;

/** Hosts whose traffic is real. Must stay in sync with index.html. */
const MEASURED_HOSTS = new Set(['ieltsai.pro', 'www.ieltsai.pro']);

/**
 * Whether this page may report to Meta at all.
 *
 * index.html decides this before GTM loads and publishes the result, but the
 * Conversions API relay is called directly from here and would otherwise still
 * deliver dev and preview events server-side even with the Pixel blocked. The
 * hostname fallback keeps the check correct if this module somehow evaluates
 * before the bootstrap script.
 */
const measurementEnabled = () => {
  if (!isBrowser()) return false;
  if (typeof window.__TRACKING_ENABLED__ === 'boolean') return window.__TRACKING_ENABLED__;
  return MEASURED_HOSTS.has(window.location?.hostname);
};

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
 * GA4 client id, read from the `_ga` cookie.
 *
 * Format is `GA1.<domainDepth>.<clientId>` where the client id is itself
 * `<random>.<firstSeenSeconds>`. Taking everything after the second dot keeps
 * it correct regardless of the domain-depth digit.
 */
export const getGaClientId = () => {
  const raw = getCookie('_ga');
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length < 4) return null;
  const clientId = parts.slice(2).join('.');
  return /^\d{1,20}\.\d{1,20}$/.test(clientId) ? clientId : null;
};

/**
 * GA4 session id, read from the per-stream `_ga_<STREAM>` cookie.
 *
 * Google has shipped two encodings for this cookie and both are live in the
 * wild, so parse defensively rather than assuming either:
 *   GS1.1.<sessionId>.<sessionNumber>....   — dot separated
 *   GS2.1.s<sessionId>$o<n>$g<n>$t<n>...    — `$`-delimited, `s`-prefixed
 * Returning null only costs session-level attribution, never the purchase.
 */
export const getGaSessionId = () => {
  const streamId = String(DEFAULT_IDS.measurementId || '').replace(/^G-/, '');
  if (!streamId) return null;
  const raw = getCookie(`_ga_${streamId}`);
  if (!raw) return null;

  // GS2 style: the session id is the `s`-prefixed field.
  const gs2 = raw.match(/[.$]s(\d{6,20})(?:[$.]|$)/);
  if (gs2) return gs2[1];

  // GS1 style: third dot-separated segment.
  const parts = raw.split('.');
  if (parts.length >= 3 && /^\d{6,20}$/.test(parts[2])) return parts[2];

  return null;
};

/**
 * The GA4 session handle to carry through Stripe Checkout so the purchase can
 * be reported server-side against the session that produced it. Both fields
 * are optional — a missing value degrades attribution, never the payment.
 */
export const getGaSessionHandle = () => ({
  ga_client_id: getGaClientId(),
  ga_session_id: getGaSessionId(),
});

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

/**
 * Meta requires normalized SHA-256 identifiers. Hash at the browser boundary
 * so the CAPI relay never receives a raw email address or account identifier.
 * Missing Web Crypto is an analytics-quality degradation, not a reason to
 * expose plaintext identity or interrupt a learner flow.
 */
const hashMetaIdentifier = async (value) => {
  if (typeof value !== 'string' || !value.trim() || !window.crypto?.subtle) return null;

  try {
    const bytes = new TextEncoder().encode(value.trim().toLowerCase());
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  } catch {
    return null;
  }
};

const pushDataLayer = (payload) => {
  if (!isBrowser()) return false;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  return true;
};

// GTM can fan a dataLayer event out to any configured vendor. Keep direct
// identity and learner-authored content out of that shared bus even when a
// future call site accidentally includes it in an event payload.
const ANALYTICS_SENSITIVE_KEYS = new Set([
  'email',
  'user_id',
  'full_name',
  'first_name',
  'last_name',
  'name',
  'session_id',
  'transcript',
  'answer',
  'answers',
  'essay',
  'response',
]);

const sanitizeAnalyticsPayload = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([key]) => !ANALYTICS_SENSITIVE_KEYS.has(key.toLowerCase()))
  );

const normalizeCurrency = (value) => (value || 'USD').toUpperCase();

const normalizeValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const hasInvalidPurchaseValue = (value) => value === undefined || value <= 0;
const hasInvalidCurrency = (currency) => !COMMERCE_CURRENCIES.has(currency);
const isCommercePixelEvent = (pixelEvent) =>
  pixelEvent === 'Purchase' || pixelEvent === 'InitiateCheckout' || pixelEvent === 'Subscribe';
const isValuePixelEvent = (pixelEvent) => isCommercePixelEvent(pixelEvent);
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
  if (!measurementEnabled()) return;

  const dispatch = ({ em, externalId } = {}) => {
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
        ...(em && SHA256_HEX.test(em) ? { em } : {}),
        ...(externalId && SHA256_HEX.test(externalId) ? { external_id: externalId } : {}),
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

  // Preserve the synchronous dispatch for the common case. Identity-bearing
  // signup events wait only for Web Crypto, never falling back to plaintext.
  if (!payload.email && !payload.user_id) {
    dispatch();
    return;
  }

  void Promise.all([hashMetaIdentifier(payload.email), hashMetaIdentifier(payload.user_id)]).then(
    ([em, externalId]) => dispatch({ em, externalId })
  );
};

/** Shared by Purchase and its Subscribe companion — same commerce parameter shape. */
const trackCommerceEvent = (pixelEvent, payload, value, currency, eventId) => {
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
  window.fbq('track', pixelEvent, parameters, options);
};

export const refreshTrackingBootstrap = () => {
  if (!isBrowser()) return;

  // Keep a stable compatibility hook for consent flows that
  // expect a tracking refresh signal after preference changes.
  window.dispatchEvent(new Event('cookie-consent-updated'));
  void syncProductAnalyticsConsent();
};

export const trackPageView = (pathname = '/') => {
  if (!isBrowser()) return;

  void captureProductPageView(pathname);

  import('@/lib/marketingAttribution')
    .then(({ captureMarketingAttribution }) => captureMarketingAttribution())
    .catch(() => {});

  // Resolve the visitor's country while they browse, so the signup that may
  // follow can write it without waiting on a request.
  import('@/lib/geo').then(({ primeSignupCountry }) => primeSignupCountry()).catch(() => {});

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
  void captureProductEvent(eventName, payload);
  if (DROPPED_EVENTS.has(eventName)) return;

  const pixelEvent = PIXEL_EVENT_MAP[eventName];
  const normalizedValue = normalizeValue(payload.value);
  const normalizedCurrency = normalizeCurrency(payload.currency);
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

  const sanitizedPayload = sanitizeAnalyticsPayload(enrichedPayload);

  // When the server owns GA4 revenue, the browser must not also announce the
  // purchase: the GTM "GA4 - Purchase" trigger listens for exactly this event
  // name, and GA4 would count both copies. Meta is dispatched below through
  // fbq and the Conversions API, neither of which reads the dataLayer, so
  // suppressing this push costs nothing on the Meta side.
  const suppressGa4Purchase = GA4_SERVER_PURCHASE && eventName === 'subscription_purchase';
  if (!suppressGa4Purchase) {
    pushDataLayer({ event: eventName, ...sanitizedPayload });
  }

  if (purchaseMarker) writeStorage(purchaseMarker, '1');

  // Everything not in PIXEL_EVENT_MAP stays in the dataLayer for GTM/GA and is
  // never forwarded to Meta, so the optimisation signal stays clean.
  if (!pixelEvent) return;

  // Dispatches one Meta standard event (CAPI + Pixel). Called once for the
  // primary event, and again for a companion standard event when one exists
  // (e.g. Subscribe alongside Purchase) — same underlying conversion, same
  // value/currency/eventId, just a second name Meta can optimise against.
  const dispatchToMeta = (targetPixelEvent) => {
    // Server-side delivery is independent of the Pixel: it must still fire
    // when fbevents.js is blocked or has not loaded yet.
    void sendToConversionsApi(targetPixelEvent, {
      eventId,
      value: normalizedValue,
      currency: normalizedCurrency,
      payload,
    });

    if (typeof window.fbq !== 'function') return;

    if (targetPixelEvent === 'Purchase' || targetPixelEvent === 'Subscribe') {
      trackCommerceEvent(targetPixelEvent, payload, normalizedValue, normalizedCurrency, eventId);
      return;
    }

    if (targetPixelEvent === 'InitiateCheckout') {
      window.fbq(
        'track',
        targetPixelEvent,
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
      targetPixelEvent,
      {
        ...sanitizeAnalyticsPayload(payload),
        ...(normalizedValue !== undefined ? { value: normalizedValue } : {}),
        ...(isValuePixelEvent(targetPixelEvent) ? { currency: normalizedCurrency } : {}),
        fbc: getFbc(),
        fbp: getFbp(),
      },
      { eventID: String(eventId) }
    );
  };

  dispatchToMeta(pixelEvent);

  const companionPixelEvent = COMPANION_PIXEL_EVENT[eventName];
  if (companionPixelEvent) dispatchToMeta(companionPixelEvent);
};

/**
 * Attach the authenticated account identity to a funnel event at the private
 * CAPI boundary. trackAppEvent hashes these values before transmission and
 * strips them from the Pixel and shared dataLayer payloads.
 */
export const trackAuthenticatedAppEvent = (eventName, payload = {}, actor = null) => {
  trackAppEvent(eventName, {
    ...payload,
    email: actor?.email || null,
    user_id: actor?.id || actor?.auth_id || null,
  });
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
  if (!isBrowser() || !profile) return Promise.resolve();
  void identifyProductUser(profile).catch(() => {});

  // Identity goes to the product-analytics SDK through its own allowlist. If
  // GTM or the browser Pixel is present too, only stable SHA-256 identifiers
  // cross those boundaries; plaintext email, names, and account IDs never do.
  const dataLayerPromise = hashMetaIdentifier(profile.id)
    .then((userIdHash) => {
      pushDataLayer({
        event: 'user_identified',
        ...(userIdHash ? { user_id_hash: userIdHash } : {}),
        is_authenticated: true,
        subscription_tier: profile.subscription_tier || 'free',
        is_admin: profile.role === 'admin' || false,
      });
    })
    .catch(() => {});

  let pixelPromise = Promise.resolve();
  if (typeof window.fbq === 'function') {
    const names =
      typeof profile.full_name === 'string' ? profile.full_name.trim().split(/\s+/) : [];
    pixelPromise = Promise.all([
      hashMetaIdentifier(profile.email),
      hashMetaIdentifier(names[0]),
      hashMetaIdentifier(names.length > 1 ? names.slice(1).join(' ') : null),
      hashMetaIdentifier(profile.id),
    ])
      .then(([em, firstName, lastName, externalId]) => {
        const userData = {
          ...(em ? { em } : {}),
          ...(firstName ? { fn: firstName } : {}),
          ...(lastName ? { ln: lastName } : {}),
          ...(externalId ? { external_id: externalId } : {}),
        };

        // Re-init with Advanced Matching data, using Meta's normalized hashes.
        window.fbq('init', TRACKING_IDS.pixelId, userData);
      })
      .catch(() => {});
  }

  // Callers that immediately report a signup can await this short-lived
  // browser hashing step, ensuring the Pixel's advanced-matching init lands
  // before CompleteRegistration without ever making analytics load-bearing.
  return Promise.all([dataLayerPromise, pixelPromise]).then(() => undefined);
};
