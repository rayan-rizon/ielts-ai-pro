import { callEdgeFunction } from '@/utils/api';
import { getSupabaseClient } from '@/lib/supabase';

const responseCache = new Map();
const MAX_CACHE_ENTRIES = 100;

const cacheKey = (userId, payload) =>
  JSON.stringify([
    userId,
    payload.sessionId,
    payload.passageIndex,
    payload.selectionStart,
    payload.selectionEnd,
    payload.action,
    payload.targetLanguage || '',
  ]);

function remember(key, value) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value);
  }
  responseCache.set(key, value);
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
  if (responseCache.has(key)) return responseCache.get(key);
  const result = await callEdgeFunction('reading-assistant', {
    operation: 'assist',
    requestId: createReadingAssistantRequestId(),
    ...payload,
  });
  remember(key, result);
  return result;
}

export function clearReadingAssistantCache() {
  responseCache.clear();
}

export function isReadingAssistantAvailable({ session, testMode, isFinished, paired = false }) {
  return Boolean(session?.id && !paired && (testMode !== 'exam' || isFinished));
}
