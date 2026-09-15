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
 * Three things fix that without any component needing to change:
 *
 *  - `inFlight` deduplicates concurrent callers onto one promise per key.
 *  - resolved translations persist to localStorage, so a reload is free.
 *  - `withSlot` caps how many requests are open at once, so a long list trickles
 *    instead of bursting and tripping the API's limiter.
 */

// Resolved translations only. `getCachedTranslation` is a synchronous read used
// during render, so a pending promise must never land in here.
const translationCache = new Map<string, string>();

// Key -> promise, for requests that have not resolved yet.
const inFlight = new Map<string, Promise<string>>();

const STORAGE_KEY = 'vocabularyTranslationCache:v1';
const MAX_PERSISTED = 500;
const MAX_CONCURRENT_REQUESTS = 4;

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

function persistToStorage(): void {
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

  const response = await fetch(url);
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
        persistToStorage();
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
