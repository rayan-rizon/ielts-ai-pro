import { supabase } from '@/lib/supabase';
import { callEdgeFunctionStream } from '@/utils/api';

// Neural2-C is a natural-sounding British female voice at the standard TTS
// price tier. Keeping the voice in one constant keeps prefetch and playback
// requests on the same cache key.
export const SPEAKING_TTS_VOICE = 'en-GB-Neural2-C';

const MAX_CACHED_REQUESTS = 40;
const requestCache = new Map();

// Practice mode can use the practice voice (synthesizePracticeSpeech: Gemini,
// streamed) in practice mode only. The server decides per learner through
// PRACTICE_TTS_ROLLOUT (off by default), and a 'rollout' answer stops the
// browser asking again for the rest of the page. VITE_PRACTICE_TTS=off is a
// build-time kill switch. Exam mode always uses synthesizeSpeech.
const PRACTICE_OVERRIDE_MODEL_KEY = 'ielts.practiceTts.model';
const PRACTICE_OVERRIDE_VOICE_KEY = 'ielts.practiceTts.voice';
const PRACTICE_DEBUG_KEY = 'ielts.practiceTts.debug';
// Server answers that will not change during this page's lifetime.
const STICKY_LEGACY_REASONS = new Set(['rollout', 'not_configured', 'profile_missing']);

let ttsProfile = 'exam';
let practiceRouteDisabled = false;

export function setSpeakingTtsProfile(mode) {
  ttsProfile = mode === 'practice' ? 'practice' : 'exam';
}

function isPracticeTtsBuildEnabled() {
  return import.meta.env.VITE_PRACTICE_TTS !== 'off';
}

function readLocalSetting(key) {
  try {
    return globalThis.localStorage?.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

export function normalizeSpeakingTtsText(text) {
  return String(text || '')
    .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, 'Why, or why not?')
    .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, 'Why, or why not?')
    .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not')
    .trim();
}

function shouldUsePracticeRoute() {
  return ttsProfile === 'practice' && !practiceRouteDisabled && isPracticeTtsBuildEnabled();
}

function cacheKey(text, voice, route) {
  return `${route}::${voice}::${normalizeSpeakingTtsText(text)}`;
}

function evictOldestRequest() {
  const oldestKey = requestCache.keys().next().value;
  if (oldestKey) requestCache.delete(oldestKey);
}

function requestLegacyTts(cleanText, voice) {
  return supabase.functions.invoke('synthesizeSpeech', { body: { text: cleanText, voice } });
}

function logPracticeTts(details) {
  if (!readLocalSetting(PRACTICE_DEBUG_KEY)) return;
  console.info('[PracticeTTS]', details);
}

/**
 * Practice voice first; anything short of playable audio falls through to the
 * Neural2 examiner voice, so this route can only change the voice, never
 * silence it. A fresh phrase comes back as a live PCM stream
 * ({ stream, sampleRate }); a phrase already in the cache as { audioUrl }.
 */
async function requestPracticeTts(cleanText, legacyVoice) {
  // Admin-only on the server; ignored for everyone else.
  const model = readLocalSetting(PRACTICE_OVERRIDE_MODEL_KEY);
  const voice = readLocalSetting(PRACTICE_OVERRIDE_VOICE_KEY);
  const startedAt = globalThis.performance?.now?.() ?? Date.now();
  const elapsed = () => Math.round((globalThis.performance?.now?.() ?? Date.now()) - startedAt);

  try {
    const response = await callEdgeFunctionStream('synthesizePracticeSpeech', {
      text: cleanText,
      stream: true,
      ...(model ? { model } : {}),
      ...(voice ? { voice } : {}),
    });
    const contentType = response.headers.get('Content-Type') || '';
    if (response.ok && contentType.startsWith('audio/pcm') && response.body) {
      const sampleRate = Number(/rate=(\d+)/.exec(contentType)?.[1]) || 24000;
      logPracticeTts({
        streamed: true,
        headersMs: elapsed(),
        server: response.headers.get('Server-Timing'),
      });
      return { data: { success: true, stream: response.body, sampleRate }, error: null };
    }
    const data = await response.json().catch(() => null);
    if (response.ok && data?.success && data?.audioUrl) {
      logPracticeTts({
        model: data.model,
        voice: data.voice,
        cached: data.cached,
        clientMs: elapsed(),
        server: data.timings,
      });
      return { data, error: null };
    }
    if (STICKY_LEGACY_REASONS.has(data?.reason)) practiceRouteDisabled = true;
  } catch (error) {
    console.warn('[PracticeTTS] Falling back to the standard voice:', error?.message || error);
  }
  return requestLegacyTts(cleanText, legacyVoice);
}

/**
 * Practice results are single-use: a stream can be read only once. A
 * prefetch parks the request for the one playback that follows; playback
 * takes it (removing it) or asks afresh without caching.
 */
function requestPracticeOnce(key, cleanText, voice, { prefetch }) {
  const parked = requestCache.get(key);
  if (parked) {
    if (!prefetch) requestCache.delete(key);
    return parked;
  }
  const request = requestPracticeTts(cleanText, voice);
  if (prefetch) {
    if (requestCache.size >= MAX_CACHED_REQUESTS) evictOldestRequest();
    requestCache.set(key, request);
    request.catch(() => {
      if (requestCache.get(key) === request) requestCache.delete(key);
    });
  }
  return request;
}

export function requestSpeakingTts(text, voice = SPEAKING_TTS_VOICE, options = {}) {
  const cleanText = normalizeSpeakingTtsText(text);
  if (!cleanText) return Promise.resolve({ data: null, error: null });

  const usePractice = shouldUsePracticeRoute();
  const key = cacheKey(cleanText, voice, usePractice ? 'practice' : 'standard');
  if (usePractice) {
    return requestPracticeOnce(key, cleanText, voice, { prefetch: Boolean(options.prefetch) });
  }

  const cached = requestCache.get(key);
  if (cached) return cached;

  if (requestCache.size >= MAX_CACHED_REQUESTS) evictOldestRequest();

  const request = requestLegacyTts(cleanText, voice)
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
  requestSpeakingTts(text, voice, { prefetch: true }).catch(() => {});
}

export function clearSpeakingTtsRequestCache() {
  requestCache.clear();
}

/** Test hook: restore module state between cases. */
export function resetSpeakingTtsRoutingForTests() {
  ttsProfile = 'exam';
  practiceRouteDisabled = false;
  requestCache.clear();
}
