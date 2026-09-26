const STORAGE_KEY = 'attribution_first_touch';

const isBrowser = () => typeof window !== 'undefined';

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'threads.net',
  'threads.com',
  'tiktok.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
  'pinterest.com',
];
const GOOGLE_AUTHENTICATION_HOST = /^accounts\.google\.[a-z.]+$/i;
const SENSITIVE_LANDING_PARAMS = [
  'token_hash',
  'code',
  'access_token',
  'refresh_token',
  'error_description',
];
const AI_PROVIDERS = [
  ['ChatGPT', ['chatgpt.com', 'chat.openai.com'], ['chatgpt', 'openai']],
  ['Claude', ['claude.ai'], ['claude', 'anthropic']],
  ['Gemini', ['gemini.google.com'], ['gemini']],
  ['Perplexity', ['perplexity.ai'], ['perplexity']],
  ['Copilot', ['copilot.microsoft.com'], ['copilot', 'microsoft-copilot']],
  ['Grok', ['grok.com'], ['grok']],
  ['DeepSeek', ['chat.deepseek.com'], ['deepseek']],
  ['Qwen', ['qwen.ai', 'chat.qwenlm.ai'], ['qwen']],
  ['Kimi', ['kimi.com', 'kimi.ai'], ['kimi']],
  ['Mistral', ['chat.mistral.ai'], ['mistral', 'le-chat']],
  ['Meta AI', ['meta.ai'], ['meta-ai']],
  ['Poe', ['poe.com'], ['poe']],
  ['You.com', ['you.com'], ['you.com']],
  ['Phind', ['phind.com'], ['phind']],
  ['Duck.ai', ['duck.ai'], ['duck.ai']],
];
const hostname = (value) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return '';
  }
};
const matchesHost = (host, domain) => host === domain || host.endsWith(`.${domain}`);
const hostMatches = (value, domains) =>
  domains.some((domain) => matchesHost(hostname(value), domain));
const sourceKey = (value) => (value || '').trim().toLowerCase().replace(/\s+/g, '-');
export const getAIProvider = (attribution = {}) => {
  const source = sourceKey(attribution.utm_source);
  const host = hostname(attribution.referrer);
  for (const [name, domains, aliases] of AI_PROVIDERS) {
    if (
      aliases.includes(source) ||
      domains.some((domain) => source === domain || matchesHost(host, domain))
    )
      return name;
  }
  try {
    const url = new URL(attribution.referrer);
    if (matchesHost(host, 'bing.com') && /^\/(chat|copilot)(\/|$)/.test(url.pathname))
      return 'Copilot';
    if (matchesHost(host, 'x.com') && /^\/i\/grok(\/|$)/.test(url.pathname)) return 'Grok';
    if (host === 'huggingface.co' && /^\/chat(\/|$)/.test(url.pathname)) return 'HuggingChat';
  } catch {
    /* source alone can still identify an AI tool */
  }
  return null;
};
const isSearchReferrer = (referrer) => {
  const host = hostname(referrer);
  return (
    /^(www\.)?google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host) ||
    host === 'com.google.android.googlequicksearchbox' ||
    [
      'bing.com',
      'search.yahoo.com',
      'duckduckgo.com',
      'search.brave.com',
      'baidu.com',
      'yandex.com',
      'yandex.ru',
      'ecosia.org',
    ].some((domain) => matchesHost(host, domain))
  );
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
  origin = isBrowser() ? window.location.origin : 'https://www.ieltsai.pro'
) => {
  if (!referrer || !origin) return false;
  try {
    const from = new URL(referrer);
    const to = new URL(origin);
    return (
      from.origin === to.origin ||
      (['ieltsai.pro', 'www.ieltsai.pro'].includes(from.hostname) &&
        ['ieltsai.pro', 'www.ieltsai.pro'].includes(to.hostname))
    );
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
export const getMissingSignupProfileFields = (profile, browserAttribution, options = {}) => {
  const now = options.now ?? Date.now();
  const created = Date.parse(profile.created_at);
  const captured = Date.parse(options.capturedAt ?? getStoredAttribution()?.captured_at);
  // Only finish an in-flight signup. Never turn a returning visit into signup evidence.
  if (
    profile.signup_attribution_recorded_at ||
    hasSignupAttributionSignal(profile) ||
    !Number.isFinite(created) ||
    !Number.isFinite(captured) ||
    now - created > 10 * 60 * 1000 ||
    created > now + 5000 ||
    captured > created + 5000 ||
    now - captured > 30 * 86400000
  )
    return {};
  return { ...browserAttribution, signup_attribution_recorded_at: new Date(now).toISOString() };
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
 * SPA router strips query params. A version-2 snapshot also records no-signal
 * landings so a later visit cannot replace the first touch.
 */
export const getStoredAttribution = () => {
  if (!isBrowser()) return null;
  try {
    let raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* blocked storage */
    }
    if (!raw && window.__signupAttribution) raw = JSON.stringify(window.__signupAttribution);
    const attribution = raw ? JSON.parse(raw) : null;
    const sanitized = withoutNonAcquisitionReferrer(attribution);

    // Remove bad legacy snapshots so a future genuine external first touch can
    // be captured rather than being blocked by navigation or authentication.
    if (attribution && !sanitized) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* blocked storage */
      }
    } else if (sanitized && JSON.stringify(sanitized) !== raw) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch {
        /* blocked storage */
      }
    }

    return sanitized;
  } catch {
    return null;
  }
};

/** Classify evidence, without treating social click IDs as proof of paid ads. */
export const classifyChannel = (attribution) => {
  const value = withoutNonAcquisitionReferrer(attribution);
  if (!value) return 'direct';
  const { fbclid, gclid, referrer } = value;
  const src = sourceKey(value.utm_source);
  const med = sourceKey(value.utm_medium).replace(/-/g, '_');
  const social =
    [
      'facebook',
      'fb',
      'meta',
      'instagram',
      'ig',
      'threads',
      'th',
      'tiktok',
      'linkedin',
      'twitter',
      'x',
      'reddit',
      'pinterest',
    ].includes(src) || SOCIAL_HOSTS.some((host) => src === host);
  const search = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'ecosia'].includes(
    src
  );
  const paid = [
    'cpc',
    'ppc',
    'paid',
    'ad',
    'ads',
    'paid_social',
    'paidsocial',
    'paid_search',
    'paidsearch',
    'cpm',
  ].includes(med);
  // Explicit campaign tags outrank a possibly incidental redirect referrer.
  if (med === 'email' || med === 'newsletter') return 'email';
  if (paid && (social || med === 'paid_social' || med === 'paidsocial')) return 'paid_social';
  if (gclid || (paid && (search || med === 'paid_search' || med === 'paidsearch')))
    return 'paid_search';
  if (paid && (fbclid || hostMatches(referrer, SOCIAL_HOSTS))) return 'paid_social';
  if (getAIProvider(value) || ['ai', 'llm', 'ai_referral', 'ai_assistant'].includes(med))
    return 'ai_referral';
  if (med === 'referral') return 'referral';
  if (social && ['organic', 'social', 'organic_social', 'social_network'].includes(med))
    return 'organic_social';
  if (search && med === 'organic') return 'organic_search';
  if (social || fbclid) return 'social';
  if (src || med) return med ? 'other' : 'referral';
  if (
    hostMatches(referrer, [
      'mail.google.com',
      'outlook.live.com',
      'outlook.office.com',
      'mail.yahoo.com',
    ]) ||
    hostname(referrer) === 'com.google.android.gm'
  )
    return 'email';
  if (isSearchReferrer(referrer)) return 'organic_search';
  if (hostMatches(referrer, SOCIAL_HOSTS)) return 'social';
  return referrer ? 'referral' : 'direct';
};

/**
 * Snapshot used when attaching attribution to a newly created profile row.
 * Field names match the `signup_*` columns on public.users.
 */
export const getSignupAttribution = () => {
  const attribution = getStoredAttribution();
  if (!attribution) {
    return { signup_channel: 'direct', signup_attribution_recorded_at: new Date().toISOString() };
  }

  return {
    signup_channel: classifyChannel(attribution),
    signup_attribution_recorded_at: new Date().toISOString(),
    signup_utm_source: attribution.utm_source || getAIProvider(attribution) || null,
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
