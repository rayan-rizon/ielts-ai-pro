const LIVE_HOSTS = new Set(['ieltsai.pro', 'www.ieltsai.pro']);
const DEFAULT_HOST = 'https://us.i.posthog.com';
const SDK_DEFAULTS = '2026-05-30';

// Decision-grade lifecycle events only. Adding a call site is not enough to
// start collecting a new event: it must also be reviewed and added here.
const PRODUCT_EVENTS = new Set([
  'billing_portal_opened',
  'checkout_started',
  'manual_checkout_started',
  'manual_subscription_request_submitted',
  'onboarding_completed',
  'plan_selected',
  'signin_success',
  'signup_completed',
  'signup_verification_sent',
  'speaking_submitted',
  'subscription_purchase',
  'test_completed',
  'test_started',
  'writing_checker_feedback_revealed',
  'writing_checker_signup_gate_viewed',
  'writing_submitted',
]);

const SAFE_EVENT_PROPERTIES = new Set([
  'billing_interval',
  'channel',
  'currency',
  'current_tier',
  'has_test_date',
  'method',
  'overall_band',
  'page_title',
  'path',
  'payment_method',
  'plan_tier',
  'source',
  'study_hours_goal',
  'task_type',
  'test_mode',
  'test_type',
  'target_band_score',
  'value',
  'weak_area',
  'word_count',
]);

let clientPromise = null;
let activeClient = null;
let lastIdentity = null;

const isBrowser = () => typeof window !== 'undefined';

const getProjectToken = () =>
  String(
    import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || import.meta.env.VITE_POSTHOG_KEY || ''
  ).trim();

const isAllowedEnvironment = () => {
  if (!isBrowser()) return false;
  if (import.meta.env.VITE_POSTHOG_ENABLE_DEVELOPMENT === 'true') return true;
  return import.meta.env.PROD === true && LIVE_HOSTS.has(window.location.hostname);
};

const shouldCapture = () => Boolean(getProjectToken()) && isAllowedEnvironment();

const sanitizeProperties = (properties = {}) => {
  const safe = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!SAFE_EVENT_PROPERTIES.has(key) || value == null) continue;
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
    safe[key] = value;
  }

  return safe;
};

const loadClient = async () => {
  if (!shouldCapture()) return null;
  if (activeClient) return activeClient;
  if (clientPromise) return clientPromise;

  clientPromise = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(getProjectToken(), {
        api_host: String(import.meta.env.VITE_POSTHOG_HOST || DEFAULT_HOST),
        ui_host: String(import.meta.env.VITE_POSTHOG_UI_HOST || 'https://us.posthog.com'),
        defaults: SDK_DEFAULTS,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        // Product analytics uses explicit capture calls only. Do not fetch
        // config.js, flags, replay, surveys, or other optional remote bundles.
        disable_external_dependency_loading: true,
        disable_session_recording: true,
        advanced_disable_flags: true,
        person_profiles: 'identified_only',
        persistence: 'localStorage+cookie',
      });

      activeClient = posthog;
      posthog.opt_in_capturing();

      if (lastIdentity?.id) {
        posthog.identify(lastIdentity.id, lastIdentity.properties);
      }

      return posthog;
    })
    .catch((error) => {
      clientPromise = null;
      if (import.meta.env.DEV) console.warn('[PostHog] Initialization failed', error);
      return null;
    });

  return clientPromise;
};

export const captureProductPageView = async (pathname = '/') => {
  const client = await loadClient();
  if (!client || !shouldCapture()) return false;

  const path = typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/';
  client.capture('$pageview', {
    $current_url: `${window.location.origin}${path}`,
    path,
    page_title: document.title,
  });
  return true;
};

export const captureProductEvent = async (eventName, properties = {}) => {
  if (!eventName || typeof eventName !== 'string' || !PRODUCT_EVENTS.has(eventName)) return false;
  const client = await loadClient();
  if (!client || !shouldCapture()) return false;

  client.capture(eventName, sanitizeProperties(properties));
  return true;
};

export const identifyProductUser = async (profile) => {
  if (!profile?.id) return false;

  lastIdentity = {
    id: String(profile.id),
    properties: {
      is_admin: profile.role === 'admin',
      onboarding_completed: profile.onboarding_completed === true,
      subscription_tier: String(profile.subscription_tier || 'free').toLowerCase(),
    },
  };

  const client = await loadClient();
  if (!client || !shouldCapture()) return false;
  client.identify(lastIdentity.id, lastIdentity.properties);
  return true;
};

export const resetProductIdentity = () => {
  lastIdentity = null;
  activeClient?.reset?.();
};

export const syncProductAnalyticsConsent = async () => {
  // Kept as a compatibility bridge for the existing cookie-settings save flow.
  // PostHog follows the automatic production-host policy already used by GTM/Meta;
  // changing a cookie preference must not make lifecycle measurement disappear.
  const client = await loadClient();
  if (client && lastIdentity?.id) client.identify(lastIdentity.id, lastIdentity.properties);
  return Boolean(client);
};

export const __posthogTesting = {
  PRODUCT_EVENTS,
  sanitizeProperties,
  shouldCapture,
};
