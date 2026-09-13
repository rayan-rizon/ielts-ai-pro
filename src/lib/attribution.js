const STORAGE_KEY = 'attribution_first_touch';

const isBrowser = () => typeof window !== 'undefined';

const SOCIAL_HOSTS = ['facebook.com', 'instagram.com', 'l.facebook.com', 'lm.facebook.com'];
const SEARCH_HOSTS = ['google.', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
const GOOGLE_AUTHENTICATION_HOST = /^accounts\.google\.[a-z.]+$/i;
const SENSITIVE_LANDING_PARAMS = [
  'token_hash',
  'code',
  'access_token',
  'refresh_token',
  'error_description',
];

const hostIncludes = (referrer, list) => {
  if (!referrer) return false;
  try {
    const host = new URL(referrer).hostname;
    return list.some((needle) => host.includes(needle));
  } catch {
    return false;
  }
};

export const sanitizeSignupLandingPage = (landingPage) => {
  if (!landingPage || typeof landingPage !== 'string') return landingPage || null;
  try {
    const url = new URL(landingPage, 'https://attribution.invalid');
    SENSITIVE_LANDING_PARAMS.forEach((key) => url.searchParams.delete(key));
    const search = url.searchParams.toString();
    return `${url.pathname}${search ? `?${search}` : ''}`;
  } catch {
    return null;
  }
};

/**
 * Navigation inside IELTS AI Pro is not an acquisition source. Browsers set
 * document.referrer when a visitor moves from a public page to /signup, so
 * treating every referrer as external incorrectly turns direct signups into
 * "referral" signups.
 */
export const isInternalReferrer = (
  referrer,
  origin = isBrowser() ? window.location.origin : ''
) => {
  if (!referrer || !origin) return false;
  try {
    return new URL(referrer).origin === new URL(origin).origin;
  } catch {
    return false;
  }
};

/** Authentication redirects identify the login provider, not acquisition. */
export const isAuthenticationReferrer = (referrer) => {
  if (!referrer) return false;
  try {
    return GOOGLE_AUTHENTICATION_HOST.test(new URL(referrer).hostname);
  } catch {
    return false;
  }
};

const ATTRIBUTION_DETAIL_FIELDS = [
  'signup_utm_source',
  'signup_utm_medium',
  'signup_utm_campaign',
  'signup_utm_content',
  'signup_utm_term',
  'signup_referrer',
  'signup_gclid',
  'signup_fbclid',
];

/** True only when a profile has evidence for an acquisition source. */
export const hasSignupAttributionSignal = (attribution) => {
  if (!attribution) return false;
  const channel = attribution.signup_channel;
  return (
    Boolean(channel && channel !== 'direct' && channel !== 'unknown') ||
    ATTRIBUTION_DETAIL_FIELDS.some((field) => Boolean(attribution[field]))
  );
};

/**
 * Enrich a trigger-created profile without replacing attribution already backed
 * by evidence. The Auth hook can win the race with the browser profile insert;
 * this patch makes the later profile read finish that synchronization.
 */
export const getMissingSignupProfileFields = (profile, browserAttribution) => {
  const patch = {};
  if (!hasSignupAttributionSignal(profile) && hasSignupAttributionSignal(browserAttribution)) {
    Object.assign(patch, browserAttribution);
  }

  return patch;
};

const withoutNonAcquisitionReferrer = (attribution) => {
  const safeAttribution = attribution
    ? {
        ...attribution,
        landing_page: sanitizeSignupLandingPage(attribution.landing_page),
      }
    : attribution;
  if (
    !safeAttribution ||
    (!isInternalReferrer(safeAttribution.referrer) &&
      !isAuthenticationReferrer(safeAttribution.referrer))
  ) {
    return safeAttribution;
  }

  const { referrer: _referrer, ...externalAttribution } = safeAttribution;
  const hasExternalSignal = [
    externalAttribution.utm_source,
    externalAttribution.utm_medium,
    externalAttribution.utm_campaign,
    externalAttribution.utm_content,
    externalAttribution.utm_term,
    externalAttribution.gclid,
    externalAttribution.fbclid,
  ].some(Boolean);

  return hasExternalSignal ? externalAttribution : null;
};

/**
 * Read the first-touch attribution snapshot captured in index.html before the
 * SPA router strips query params. Returns null if this browser has never
 * landed with any recognizable acquisition signal (utm_*, click id, referrer).
 */
export const getStoredAttribution = () => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const attribution = raw ? JSON.parse(raw) : null;
    const sanitized = withoutNonAcquisitionReferrer(attribution);

    // Remove bad legacy snapshots so a future genuine external first touch can
    // be captured rather than being blocked by navigation or authentication.
    if (attribution && !sanitized) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else if (sanitized && JSON.stringify(sanitized) !== raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch {
    return null;
  }
};

/**
 * Bucket a raw attribution snapshot into one channel for reporting.
 *
 * Order matters: a Meta/Google click id is the strongest signal (it means an
 * ad was actually clicked) and is checked before falling back to UTM medium
 * or bare referrer parsing, which are easier to spoof or omit.
 */
export const classifyChannel = (attribution) => {
  const sanitized = withoutNonAcquisitionReferrer(attribution);
  if (!sanitized) return 'direct';

  const { fbclid, gclid, utm_source: source, utm_medium: medium, referrer } = sanitized;
  const src = (source || '').toLowerCase();
  const med = (medium || '').toLowerCase();

  if (
    fbclid ||
    (['facebook', 'fb', 'meta', 'instagram', 'ig'].includes(src) && !med) ||
    (['facebook', 'fb', 'meta', 'instagram', 'ig'].includes(src) &&
      ['cpc', 'paid', 'ad', 'ads'].includes(med))
  ) {
    return 'paid_social';
  }

  if (gclid || (src === 'google' && ['cpc', 'paid', 'ad', 'ads'].includes(med))) {
    return 'paid_search';
  }

  if (med === 'email') return 'email';
  if (med === 'referral' || (source && !medium)) return 'referral';

  if (!source && !medium) {
    if (hostIncludes(referrer, SEARCH_HOSTS)) return 'organic_search';
    if (hostIncludes(referrer, SOCIAL_HOSTS)) return 'organic_social';
    if (referrer) return 'referral';
    return 'direct';
  }

  return 'other';
};

/**
 * Snapshot used when attaching attribution to a newly created profile row.
 * Field names match the `signup_*` columns on public.users.
 */
export const getSignupAttribution = () => {
  const attribution = getStoredAttribution();
  if (!attribution) {
    return { signup_channel: 'direct' };
  }

  return {
    signup_channel: classifyChannel(attribution),
    signup_utm_source: attribution.utm_source || null,
    signup_utm_medium: attribution.utm_medium || null,
    signup_utm_campaign: attribution.utm_campaign || null,
    signup_utm_content: attribution.utm_content || null,
    signup_utm_term: attribution.utm_term || null,
    signup_referrer: attribution.referrer || null,
    signup_landing_page: attribution.landing_page || null,
    signup_gclid: attribution.gclid || null,
    signup_fbclid: attribution.fbclid || null,
  };
};
