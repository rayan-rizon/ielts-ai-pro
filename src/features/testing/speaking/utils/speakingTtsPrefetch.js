import { supabase } from '@/lib/supabase';
import { callEdgeFunctionStream } from '@/utils/api';
import { formatIeltsQuestion } from './speakingTestUtils';
import { getSpeakingVoice } from './speakingAccents';

// Practice uses the original British fallback. Exam voice selection comes from
// the catalog below and uses the same key for prefetch and playback.
export const SPEAKING_TTS_VOICE = 'en-GB-Neural2-C';

const MAX_CACHED_REQUESTS = 40;
const requestCache = new Map();

// Practice and exam stream Gemini when enabled. Exam uses four regional voices.
const PRACTICE_OVERRIDE_MODEL_KEY = 'ielts.practiceTts.model';
const PRACTICE_OVERRIDE_VOICE_KEY = 'ielts.practiceTts.voice';
const PRACTICE_DEBUG_KEY = 'ielts.practiceTts.debug';
// Server answers that will not change during this page's lifetime.
const STICKY_LEGACY_REASONS = new Set(['rollout', 'not_configured', 'profile_missing']);

let ttsProfile = 'exam';
let examVoiceId = 'british-female';
const routeDisabled = { practice: false, exam: false };

export function setSpeakingTtsProfile(mode) {
  ttsProfile = mode === 'practice' ? 'practice' : 'exam';
}

export function setSpeakingTtsVoice(voiceId) {
  examVoiceId = getSpeakingVoice(voiceId).id;
}

export function getActiveSpeakingVoice() {
  return getSpeakingVoice(ttsProfile === 'exam' ? examVoiceId : 'british-female');
}

function isPracticeTtsBuildEnabled() {
  return import.meta.env.VITE_PRACTICE_TTS !== 'off';
}

function isExamTtsBuildEnabled() {
  return import.meta.env.VITE_EXAM_TTS !== 'off';
}

function readLocalSetting(key) {
  try {
    return globalThis.localStorage?.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

export function normalizeSpeakingTtsText(text) {
  return formatIeltsQuestion(String(text || ''))
    .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, 'Why, or why not?')
    .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, 'Why, or why not?')
    .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not')
    .replace(/Why,?\s+or\s+why\s+not\?/gi, 'Why, or why not?')
    .trim();
}

function shouldUseR2Route() {
  return (
    !routeDisabled[ttsProfile] &&
    (ttsProfile === 'exam' ? isExamTtsBuildEnabled() : isPracticeTtsBuildEnabled())
  );
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

/** A fresh phrase streams PCM; an R2 hit returns an audio URL. */
async function requestPracticeTts(cleanText, legacyVoice, mode, examVoice) {
  // Admin-only on the server; ignored for everyone else.
  const model = readLocalSetting(PRACTICE_OVERRIDE_MODEL_KEY);
  const voice = readLocalSetting(PRACTICE_OVERRIDE_VOICE_KEY);
  const startedAt = globalThis.performance?.now?.() ?? Date.now();
  const elapsed = () => Math.round((globalThis.performance?.now?.() ?? Date.now()) - startedAt);

  try {
    const response = await callEdgeFunctionStream('synthesizePracticeSpeech', {
      text: cleanText,
      stream: true,
      mode,
      ...(mode === 'exam' ? { examVoice } : {}),
      ...(model ? { model } : {}),
      ...(voice ? { voice } : {}),
    });
    const contentType = response.headers.get('Content-Type') || '';
    const expectedGeminiVoice = mode === 'exam' ? getSpeakingVoice(examVoice).geminiVoice : null;
    if (response.ok && contentType.startsWith('audio/pcm') && response.body) {
      if (
        mode === 'exam' &&
        (response.headers.get('X-TTS-Model') !== 'google/gemini-3.8-flash-lite-tts' ||
          response.headers.get('X-TTS-Voice') !== expectedGeminiVoice)
      ) {
        await response.body.cancel();
        return { data: null, error: new Error('Exam Gemini voice did not match selection') };
      }
      const sampleRate = Number(/rate=(\d+)/.exec(contentType)?.[1]) || 24000;
      logPracticeTts({
        streamed: true,
        headersMs: elapsed(),
        server: response.headers.get('Server-Timing'),
      });
      return { data: { success: true, stream: response.body, sampleRate }, error: null };
    }
    const data = await response.json().catch(() => null);
    const matchesExamVoice =
      mode !== 'exam' ||
      (data?.model === 'google/gemini-3.8-flash-lite-tts' && data?.voice === expectedGeminiVoice);
    if (response.ok && data?.success && data?.audioUrl && matchesExamVoice) {
      logPracticeTts({
        model: data.model,
        voice: data.voice,
        cached: data.cached,
        clientMs: elapsed(),
        server: data.timings,
      });
      return { data, error: null };
    }
    if (STICKY_LEGACY_REASONS.has(data?.reason)) routeDisabled[mode] = true;
  } catch (error) {
    console.warn('[PracticeTTS] Speech request failed:', error?.message || error);
  }
  if (mode === 'exam') return { data: null, error: new Error('Gemini exam voice unavailable') };
  return requestLegacyTts(cleanText, legacyVoice);
}

/**
 * Practice results are single-use: a stream can be read only once. A
 * prefetch parks the request for the one playback that follows; playback
 * takes it (removing it) or asks afresh without caching.
 */
function requestPracticeOnce(key, cleanText, voice, { prefetch, mode, examVoice }) {
  const parked = requestCache.get(key);
  if (parked) {
    if (!prefetch) requestCache.delete(key);
    return parked;
  }
  const request = requestPracticeTts(cleanText, voice, mode, examVoice);
  if (prefetch) {
    if (requestCache.size >= MAX_CACHED_REQUESTS) evictOldestRequest();
    requestCache.set(key, request);
    request.catch(() => {
      if (requestCache.get(key) === request) requestCache.delete(key);
    });
  }
  return request;
}

export function requestSpeakingTts(text, voice, options = {}) {
  const cleanText = normalizeSpeakingTtsText(text);
  if (!cleanText) return Promise.resolve({ data: null, error: null });

  const selectedVoice = getActiveSpeakingVoice();
  const legacyVoice = voice || selectedVoice.voice;
  const useR2 = shouldUseR2Route();
  const key = cacheKey(
    cleanText,
    legacyVoice,
    useR2 ? `${ttsProfile}:${selectedVoice.id}` : 'standard'
  );
  if (useR2) {
    return requestPracticeOnce(key, cleanText, legacyVoice, {
      prefetch: Boolean(options.prefetch),
      mode: ttsProfile,
      examVoice: selectedVoice.id,
    });
  }

  if (ttsProfile === 'exam') {
    return Promise.resolve({ data: null, error: new Error('Gemini exam voice unavailable') });
  }

  const cached = requestCache.get(key);
  if (cached) return cached;

  if (requestCache.size >= MAX_CACHED_REQUESTS) evictOldestRequest();

  const request = requestLegacyTts(cleanText, legacyVoice)
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

export function prefetchSpeakingTts(text, voice) {
  requestSpeakingTts(text, voice, { prefetch: true }).catch(() => {});
}

export function clearSpeakingTtsRequestCache() {
  requestCache.clear();
}

/** Test hook: restore module state between cases. */
export function resetSpeakingTtsRoutingForTests() {
  ttsProfile = 'exam';
  examVoiceId = 'british-female';
  routeDisabled.practice = false;
  routeDisabled.exam = false;
  requestCache.clear();
}
