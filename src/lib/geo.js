const STORAGE_KEY = 'signup_country';
const GEO_ENDPOINT = '/api/geo';
const LOOKUP_TIMEOUT_MS = 2000;

const ISO_COUNTRY = /^[A-Z]{2}$/;

const isBrowser = () => typeof window !== 'undefined';

/** In-flight lookup, so a prime + a signup racing each other share one request. */
let pendingLookup = null;

const readStored = () => {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return ISO_COUNTRY.test(value || '') ? value : null;
  } catch {
    return null;
  }
};

const writeStored = (country) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, country);
  } catch {
    /* private mode can reject writes; the lookup simply repeats next time */
  }
};

const lookupCountry = async () => {
  if (!isBrowser()) return null;

  // A signup must never hang on a measurement lookup. If the edge is slow or
  // the endpoint is unreachable, the profile is created with a null country —
  // the same state every existing row is already in.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await window.fetch(GEO_ENDPOINT, {
      signal: controller.signal,
      credentials: 'same-origin',
    });
    if (!response.ok) return null;

    const { country } = await response.json();
    if (!ISO_COUNTRY.test(country || '')) return null;

    writeStored(country);
    return country;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Country for the visitor, resolved at the edge from the IP the request already
 * carried. Cached per browser: the answer does not change between a landing and
 * the signup that follows it, and a returning user keeps the country they were
 * first seen in, which is what first-touch attribution wants.
 */
export const resolveSignupCountry = async () => {
  const stored = readStored();
  if (stored) return stored;

  if (!pendingLookup) {
    pendingLookup = lookupCountry().finally(() => {
      pendingLookup = null;
    });
  }

  return pendingLookup;
};

/**
 * Warm the cache during the visit so the signup itself never waits on a
 * network round trip. Fire-and-forget by design.
 */
export const primeSignupCountry = () => {
  if (!isBrowser() || readStored()) return;
  resolveSignupCountry().catch(() => {});
};

export const getStoredCountry = readStored;
