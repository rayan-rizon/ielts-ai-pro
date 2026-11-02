import { callEdgeFunction } from '@/utils/api';
import { getSupabaseClient } from '@/lib/supabase';

const responseCache = new Map();
const inFlightRequests = new Map();
const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CLIENT_CACHE_VERSION = 5;
const STORAGE_KEY = `reading_assistant_cache_v${CLIENT_CACHE_VERSION}`;

// The session id stays in the key: two Reading tests can both be at passage 0,
// and a stale answer from the wrong passage is worse than a second lookup. What
// this cache saves is the round trip -- the shared server cache is what stops a
// second learner paying for the same explanation.
const cacheKey = (userId, payload) =>
  JSON.stringify([
    CLIENT_CACHE_VERSION,
    userId,
    payload.sessionId,
    payload.passageIndex,
    payload.source || 'passage',
    payload.selectionStart,
    payload.selectionEnd,
    String(payload.selectedText || '')
      .trim()
      .toLowerCase(),
    payload.action,
    payload.targetLanguage || '',
  ]);

/**
 * Session storage, so a reload mid-test does not re-ask for every explanation
 * the learner has already opened. It is scoped to the tab and cleared with it,
 * which matches how long these answers stay relevant.
 */
function storage() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    // Private-mode and blocked-storage browsers throw on access alone.
    return null;
  }
}

let restored = false;
function restore() {
  if (restored) return;
  restored = true;
  try {
    const saved = JSON.parse(storage()?.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return;
    const now = Date.now();
    for (const [key, entry] of saved.slice(-MAX_CACHE_ENTRIES)) {
      if (entry?.expiresAt > now) responseCache.set(key, entry);
    }
  } catch {
    // A corrupt or unreadable cache is simply an empty one.
  }
}

function persist() {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify([...responseCache]));
  } catch {
    // Over quota or unavailable: the in-memory cache still works.
  }
}

function readCached(key) {
  restore();
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    persist();
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value;
}

function remember(key, value) {
  restore();
  responseCache.delete(key);
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  persist();
}

export function createReadingAssistantRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    })
  );
}

export async function getReadingAssistantStatus(sessionId) {
  return callEdgeFunction('reading-assistant', { operation: 'status', sessionId });
}

export async function requestReadingAssistance(payload) {
  const client = await getSupabaseClient();
  const { data } = await client.auth.getSession();
  const key = cacheKey(data?.session?.user?.id || 'signed-out', payload);
  const cached = readCached(key);
  if (cached) return cached;
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const request = callEdgeFunction('reading-assistant', {
    operation: 'assist',
    requestId: createReadingAssistantRequestId(),
    ...payload,
  })
    .then((result) => {
      if (result?.state === 'complete' && result?.result) remember(key, result);
      return result;
    })
    .finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, request);
  return request;
}

export function clearReadingAssistantCache() {
  responseCache.clear();
  inFlightRequests.clear();
  restored = false;
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

export function isReadingAssistantAvailable({ session, testMode, isFinished, paired = false }) {
  return Boolean(session?.id && !paired && (testMode !== 'exam' || isFinished));
}
