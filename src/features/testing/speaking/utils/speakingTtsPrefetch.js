import { supabase } from '@/lib/supabase';

export const SPEAKING_TTS_VOICE = 'en-GB-Neural2-B';

const MAX_CACHED_REQUESTS = 40;
const requestCache = new Map();

export function normalizeSpeakingTtsText(text) {
  return String(text || '')
    .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, 'Why, or why not?')
    .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, 'Why, or why not?')
    .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not')
    .trim();
}

function cacheKey(text, voice) {
  return `${voice}::${normalizeSpeakingTtsText(text)}`;
}

function evictOldestRequest() {
  const oldestKey = requestCache.keys().next().value;
  if (oldestKey) requestCache.delete(oldestKey);
}

export function requestSpeakingTts(text, voice = SPEAKING_TTS_VOICE) {
  const cleanText = normalizeSpeakingTtsText(text);
  if (!cleanText) return Promise.resolve({ data: null, error: null });

  const key = cacheKey(cleanText, voice);
  const cached = requestCache.get(key);
  if (cached) return cached;

  if (requestCache.size >= MAX_CACHED_REQUESTS) evictOldestRequest();

  const request = supabase.functions
    .invoke('synthesizeSpeech', { body: { text: cleanText, voice } })
    .then((result) => {
      if (result?.error || !result?.data?.success || !result?.data?.audioUrl) {
        if (requestCache.get(key) === request) requestCache.delete(key);
      }
      return result;
    })
    .catch((error) => {
      if (requestCache.get(key) === request) requestCache.delete(key);
      throw error;
    });

  requestCache.set(key, request);
  return request;
}

export function prefetchSpeakingTts(text, voice = SPEAKING_TTS_VOICE) {
  requestSpeakingTts(text, voice).catch(() => {});
}

export function clearSpeakingTtsRequestCache() {
  requestCache.clear();
}
