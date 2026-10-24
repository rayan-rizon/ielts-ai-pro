import { callEdgeFunction } from '@/utils/api';
import { SUPPORTED_LANGUAGES } from './translateService';

/**
 * Client for the `vocab-define` Edge Function: one AI word card per word,
 * language and saved sense.
 *
 * The server enforces the real limits (per-minute burst, a daily allowance of
 * fresh generations per plan, a shared provider budget). This module's job is to
 * not walk into them needlessly:
 *
 *  - results are cached for the session and in localStorage, so a word looked up
 *    once is never requested again from this browser;
 *  - concurrent callers for the same card share one request;
 *  - once the server says "wait", no further request is sent until that time has
 *    passed -- the caller gets the same refusal immediately, for free.
 */

/**
 * Every language the vocabulary page offers except English: the server writes the
 * card in any of them (see DEFINE_LANGUAGES in vocab-define).
 */
export const AI_DEFINE_LANGUAGES = new Set(
  SUPPORTED_LANGUAGES.map((language) => language.code).filter((code) => code !== 'en')
);

/** An unknown code still gets the English card instead of an error. */
export const resolveDefineLanguage = (language) =>
  AI_DEFINE_LANGUAGES.has(language) ? language : 'en';

const CACHE_KEY = 'vocabDefineCache:v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHED_CARDS = 300;
const REQUEST_TIMEOUT_MS = 25_000;
const BUDGET_PAUSE_MS = 5 * 60 * 1000;

export class VocabDefineError extends Error {
  /**
   * kind: not_a_word | invalid | quota | burst | busy | budget | unavailable | offline | auth
   */
  constructor(kind, message, details = {}) {
    super(message);
    this.name = 'VocabDefineError';
    this.kind = kind;
    this.retryAfterSeconds = details.retryAfterSeconds ?? null;
    this.quotaResetsAt = details.quotaResetsAt ?? null;
  }
}

/** Refusals that mean "do not ask again until later", as opposed to one-off failures. */
const BLOCKING_KINDS = new Set(['quota', 'burst', 'budget']);

const cards = new Map();
const inFlight = new Map();
let hydrated = false;
let persistTimer = null;
let block = null; // { kind, until, error }
let latestQuota = { remaining: null, resetsAt: null };

const cardKey = (word, hint, language) =>
  [word.trim().toLowerCase(), (hint || '').trim().toLowerCase(), language].join('|');

function storage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const saved = JSON.parse(storage()?.getItem(CACHE_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    const now = Date.now();
    for (const [key, entry] of saved.slice(-MAX_CACHED_CARDS)) {
      if (entry?.expiresAt > now && entry.value?.meaning) cards.set(key, entry);
    }
  } catch {
    // A corrupt or unreadable cache is an empty one.
  }
}

function persistSoon() {
  if (persistTimer !== null || typeof window === 'undefined') return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const entries = [...cards].slice(-MAX_CACHED_CARDS);
      storage()?.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch {
      // Over quota or unavailable: the in-memory cache still works.
    }
  }, 250);
}

function remember(key, value) {
  cards.delete(key);
  if (cards.size >= MAX_CACHED_CARDS) cards.delete(cards.keys().next().value);
  cards.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  persistSoon();
}

/** Last quota the server reported, for the "N lookups left today" hint. */
export function getLatestQuota() {
  return latestQuota;
}

/** Seconds until lookups are allowed again, or 0 when they are. */
export function getBlockedSeconds(now = Date.now()) {
  if (!block || block.until <= now) return 0;
  return Math.ceil((block.until - now) / 1000);
}

export function getCachedCard(word, { hint = '', language = 'bn' } = {}) {
  hydrate();
  const entry = cards.get(cardKey(word, hint, language));
  return entry && entry.expiresAt > Date.now() ? entry.value : null;
}

/** For tests and sign-out. */
export function resetDefineState() {
  cards.clear();
  inFlight.clear();
  block = null;
  latestQuota = { remaining: null, resetsAt: null };
  hydrated = true;
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = null;
  try {
    storage()?.removeItem(CACHE_KEY);
  } catch {
    // Nothing to clean.
  }
}

export function toDefineError(error) {
  if (error instanceof VocabDefineError) return error;
  const details = error?.details || {};
  const message = details.error || error?.message || 'Lookup failed';
  if (error?.isNetworkError || error?.name === 'NetworkError')
    return new VocabDefineError('offline', 'Check your connection and try again.');
  if (error?.status === 401)
    return new VocabDefineError('auth', 'Please sign in again to look up words.');
  if (error?.status === 422 || details.code === 'not_a_word')
    return new VocabDefineError('not_a_word', message);
  if (error?.status === 429) {
    const type = details.rateLimitType || error.rateLimitType;
    const kind = type === 'quota' ? 'quota' : type === 'capacity' ? 'busy' : 'burst';
    return new VocabDefineError(kind, message, {
      retryAfterSeconds: details.retryAfterSeconds ?? error.retryAfterSeconds ?? 30,
      quotaResetsAt: details.quotaResetsAt,
    });
  }
  if (details.code === 'budget') return new VocabDefineError('budget', message);
  if (error?.status === 400) return new VocabDefineError('invalid', message);
  return new VocabDefineError('unavailable', 'AI lookup is unavailable right now.');
}

function noteRefusal(error, now = Date.now()) {
  if (!BLOCKING_KINDS.has(error.kind)) return;
  const seconds =
    error.kind === 'budget' ? BUDGET_PAUSE_MS / 1000 : Math.max(1, error.retryAfterSeconds || 30);
  block = { kind: error.kind, until: now + seconds * 1000, error };
}

function withTimeout(promise, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new VocabDefineError('unavailable', 'The lookup took too long. Try again.')),
      REQUEST_TIMEOUT_MS
    );
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    });
  });
}

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

/**
 * Get the card for a word. Resolves to { card, source, remainingDailyQuota,
 * quotaResetsAt }; rejects with a VocabDefineError.
 *
 * `hint` is the English sense a learner already saved, so enrichment translates
 * that sense instead of picking a new one.
 */
export async function defineWord(word, { hint = '', language = 'bn', signal } = {}) {
  const entry = String(word || '').trim();
  if (!entry) throw new VocabDefineError('invalid', 'Enter a word to look up.');

  hydrate();
  const key = cardKey(entry, hint, language);
  const cached = cards.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      card: cached.value,
      source: 'local',
      remainingDailyQuota: latestQuota.remaining,
      quotaResetsAt: latestQuota.resetsAt,
    };
  }

  const wait = getBlockedSeconds();
  if (wait > 0) {
    const refusal = block.error;
    throw new VocabDefineError(refusal.kind, refusal.message, {
      retryAfterSeconds: wait,
      quotaResetsAt: refusal.quotaResetsAt,
    });
  }

  let pending = inFlight.get(key);
  if (!pending) {
    pending = callEdgeFunction('vocab-define', {
      requestId: newRequestId(),
      word: entry,
      hint,
      language,
    })
      .then((data) => {
        if (!data?.result?.meaning)
          throw new VocabDefineError('unavailable', 'Empty lookup result.');
        remember(key, data.result);
        if (data.remainingDailyQuota != null || data.quotaResetsAt) {
          latestQuota = {
            remaining: data.remainingDailyQuota ?? null,
            resetsAt: data.quotaResetsAt ?? null,
          };
        }
        return {
          card: data.result,
          source: data.source,
          remainingDailyQuota: data.remainingDailyQuota ?? null,
          quotaResetsAt: data.quotaResetsAt ?? null,
        };
      })
      .catch((error) => {
        const mapped = toDefineError(error);
        noteRefusal(mapped);
        if (mapped.kind === 'quota') latestQuota = { remaining: 0, resetsAt: mapped.quotaResetsAt };
        throw mapped;
      })
      .finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, pending);
  }
  return withTimeout(pending, signal);
}
