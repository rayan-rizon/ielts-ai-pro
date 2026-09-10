import { callEdgeFunction } from '@/utils/api';
import { getSupabaseClient } from '@/lib/supabase';

const responseCache = new Map();
const inFlightRequests = new Map();
const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CLIENT_CACHE_VERSION = 3;

const cacheKey = (userId, payload) =>
  JSON.stringify([
    CLIENT_CACHE_VERSION,
    userId,
    payload.sessionId,
    payload.passageIndex,
    payload.selectionStart,
    payload.selectionEnd,
    String(payload.selectedText || '')
      .trim()
      .toLowerCase(),
    payload.action,
    payload.targetLanguage || '',
  ]);

function readCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value;
}

function remember(key, value) {
  responseCache.delete(key);
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
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
}

export function isReadingAssistantAvailable({ session, testMode, isFinished, paired = false }) {
  return Boolean(session?.id && !paired && (testMode !== 'exam' || isFinished));
}
