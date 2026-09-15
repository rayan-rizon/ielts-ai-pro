// Translation Service using MyMemory API (free, no API key required)
// https://mymemory.translated.net/doc/spec.php

export interface Language {
  code: string;
  name: string;
}

export type LanguageCode = string;

// Supported languages (commonly used)
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'id', name: 'Indonesian' },
];

/**
 * Translation caching and request control.
 *
 * Every vocabulary row renders its own definition cell, and each cell asked for
 * its own translation on mount. A 30-row page therefore opened 30 parallel
 * cross-origin requests to a free, rate-limited public API, repeated in full on
 * every reload because the cache lived only in memory. Two rows sharing a
 * definition both fetched it, because nothing was written to the cache until a
 * response came back.
 *
 * Four things fix that without any component needing to change:
 *
 *  - `inFlight` deduplicates concurrent callers onto one promise per key.
 *  - resolved translations persist to localStorage, so a reload is free. Those
 *    writes are coalesced, because serialising the cache is O(cache size) and
 *    doing it per row would just move the cost rather than remove it.
 *  - `withSlot` caps how many requests are open at once, so a long list trickles
 *    instead of bursting and tripping the API's limiter.
 *  - each request is time-bounded, so a stalled connection cannot hold a slot
 *    and starve everything queued behind it.
 */

// Resolved translations only. `getCachedTranslation` is a synchronous read used
// during render, so a pending promise must never land in here.
const translationCache = new Map<string, string>();

// Key -> promise, for requests that have not resolved yet.
const inFlight = new Map<string, Promise<string>>();

const STORAGE_KEY = 'vocabularyTranslationCache:v1';
const MAX_PERSISTED = 500;
const MAX_CONCURRENT_REQUESTS = 4;
// Long enough to absorb a page's worth of rows resolving, short enough that a
// reader who closes the tab straight away still keeps what loaded.
const PERSIST_DEBOUNCE_MS = 250;
// Upper bound on one translation request, so a stalled connection cannot hold a
// concurrency slot indefinitely.
const REQUEST_TIMEOUT_MS = 10_000;

function buildCacheKey(text: string, sourceLang: LanguageCode, targetLang: LanguageCode): string {
  return `${text}_${sourceLang}_${targetLang}`;
}

let hydrated = false;

/** Web Storage throws outright in some privacy modes, so every access is guarded. */
function hydrateFromStorage(): void {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') translationCache.set(key, value);
    }
  } catch {
    // Corrupt or unavailable storage is not worth failing a render over.
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Write the cache out now.
 *
 * Serialising the whole cache costs O(cache size), so this must not run once per
 * resolved translation — a 30-row page would rewrite the entire cache 30 times
 * on the main thread. `schedulePersist` coalesces a burst into one write;
 * this is the barrier that write goes through, and the one `pagehide` takes so
 * a batch that resolved inside the debounce window is not lost.
 */
export function flushTranslationCache(): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (typeof window === 'undefined') return;

  try {
    // Keep the newest entries; Map preserves insertion order.
    const entries = Array.from(translationCache.entries());
    const trimmed = entries.slice(Math.max(0, entries.length - MAX_PERSISTED));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // Quota or disabled storage: the in-memory cache stays authoritative.
  }
}

function schedulePersist(): void {
  if (typeof window === 'undefined' || persistTimer !== null) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushTranslationCache();
  }, PERSIST_DEBOUNCE_MS);
}

if (typeof window !== 'undefined') {
  // `pagehide` is the event that actually fires on mobile Safari when a tab is
  // discarded; `beforeunload` is a supplement, not the primary hook.
  window.addEventListener('pagehide', flushTranslationCache);
  window.addEventListener('beforeunload', flushTranslationCache);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushTranslationCache();
  });
}

let activeRequests = 0;
const waiting: Array<() => void> = [];

/** Minimal semaphore: run `task` once a request slot frees up. */
async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  activeRequests += 1;
  try {
    return await task();
  } finally {
    activeRequests -= 1;
    waiting.shift()?.();
  }
}

async function fetchFromMyMemory(
  text: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode
): Promise<string> {
  const langPair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

  // Requests now queue behind a concurrency cap, so one stalled connection to a
  // third-party API would hold a slot and block every row behind it. An upper
  // bound turns that into a normal failure, which the caller already handles by
  // showing the original text.
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

  let response: Response;
  try {
    response = await fetch(url, controller ? { signal: controller.signal } : undefined);
  } finally {
    if (timeout !== null) clearTimeout(timeout);
  }

  if (!response.ok) {
    console.warn(`[Translate] API returned ${response.status}`);
    return text;
  }

  const data = await response.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  console.warn('[Translate] No translation found:', data);
  return text;
}

/**
 * Get saved language preference
 * @returns Language code
 */
export function getSavedLanguage(): LanguageCode {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vocabularyTargetLanguage') || 'en';
  }
  return 'en';
}

/**
 * Save language preference
 * @param langCode - Language code to save
 */
export function saveLanguagePreference(langCode: LanguageCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vocabularyTargetLanguage', langCode);
  }
}

/**
 * Translate text using MyMemory API
 * @param text - Text to translate
 * @param targetLang - Target language code (e.g., 'es', 'fr')
 * @param sourceLang - Source language code (default: 'en')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: LanguageCode,
  sourceLang: LanguageCode = 'en'
): Promise<string> {
  const shouldSkipTranslation = !text || !targetLang || sourceLang === targetLang;
  if (shouldSkipTranslation) {
    return text;
  }

  hydrateFromStorage();

  const cacheKey = buildCacheKey(text, sourceLang, targetLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey) || text;
  }

  // A second caller for the same definition joins the request already open
  // rather than starting its own.
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const request = withSlot(() => fetchFromMyMemory(text, sourceLang, targetLang))
    .then((translatedText) => {
      if (translatedText !== text) {
        translationCache.set(cacheKey, translatedText);
        schedulePersist();
      }
      return translatedText;
    })
    .catch((error: any) => {
      console.error('[Translate] Translation failed:', error?.message);
      // Unchanged contract: callers get the original text back on failure, and
      // nothing is cached, so a later attempt can still succeed.
      return text;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request;
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  inFlight.clear();
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing actionable — the in-memory cache is already cleared.
  }
}

/**
 * Get language name by code
 * @param code - Language code
 * @returns Language name
 */
export function getLanguageName(code: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Get cached translation if available
 * @param text - Original text
 * @param targetLang - Target language
 * @param sourceLang - Source language
 * @returns Cached translation or null
 */
export function getCachedTranslation(
  text: string,
  targetLang: LanguageCode,
  sourceLang: LanguageCode = 'en'
): string | null {
  hydrateFromStorage();
  const cacheKey = buildCacheKey(text, sourceLang, targetLang);
  return translationCache.get(cacheKey) || null;
}
