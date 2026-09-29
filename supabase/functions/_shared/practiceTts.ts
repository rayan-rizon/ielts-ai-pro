// Practice-mode coach voice: model catalog, rollout, cache keys, request
// shape and cost estimate for OpenRouter's /api/v1/audio/speech endpoint.
// Google's streaming endpoint (geminiSpeechStream.ts) is the primary path.
//
// Pure module (no Deno or npm imports) so the Edge Function, the latency
// benchmark and the unit tests share one definition.

import { estimateTokenCostUsd } from './aiModelRegistry.ts';

export const OPENROUTER_SPEECH_URL = 'https://openrouter.ai/api/v1/audio/speech';

/** Bump when the audio for the same (model, voice, style, text) should change. */
export const PRACTICE_TTS_CACHE_VERSION = 'v1';
export const PRACTICE_TTS_CACHE_PREFIX = `tts-cache/practice/${PRACTICE_TTS_CACHE_VERSION}`;
export const EXAM_NEURAL2_CACHE_PREFIX = `tts-cache/exam-neural2/${PRACTICE_TTS_CACHE_VERSION}`;
export const PRACTICE_TTS_MAX_CHARACTERS = 1500;
/**
 * Only short, shared lines are worth caching: the greeting, bank questions,
 * part intros and retry prompts (all under ~160 characters). A coach reply is
 * unique to one learner's answer, so looking it up in R2 only delays the voice
 * and storing it only fills the bucket.
 */
export const PRACTICE_TTS_CACHEABLE_MAX_CHARACTERS = 200;

export function isPracticeTtsCacheable(text: string) {
  return text.length <= PRACTICE_TTS_CACHEABLE_MAX_CHARACTERS;
}

/** Exam lines are shared across learners, including longer introductions. */
export function isSpeakingTtsCacheable(text: string, mode: 'practice' | 'exam') {
  return mode === 'exam' || isPracticeTtsCacheable(text);
}
/** Real audio of even a one-word reply is larger than this. */
export const PRACTICE_TTS_MIN_AUDIO_BYTES = 512;

/**
 * Delivery direction for Gemini TTS. Sent as speech_metadata.style, never in
 * the input text: Gemini 3.8 TTS reads `input` verbatim.
 */
export const PRACTICE_TTS_STYLE =
  'A warm, encouraging IELTS speaking coach with a clear British English accent, speaking at a natural conversational pace.';

export type SpeakingAccent = 'british' | 'australian' | 'american';
export const SPEAKING_ACCENT_STYLES: Record<SpeakingAccent, string> = {
  // Keep the original wording so existing British audio retains its R2 key.
  british: PRACTICE_TTS_STYLE,
  australian:
    'A warm, encouraging IELTS speaking coach with a clear Australian English accent, speaking at a natural conversational pace.',
  american:
    'A warm, encouraging IELTS speaking coach with a clear American English accent, speaking at a natural conversational pace.',
};

export function resolveSpeakingAccent(value: unknown, mode: 'practice' | 'exam'): SpeakingAccent {
  if (mode === 'exam' && (value === 'australian' || value === 'american')) return value;
  return 'british';
}

export const EXAM_NEURAL2_VOICES = {
  'british-female': 'en-GB-Neural2-C',
  'british-male': 'en-GB-Neural2-D',
  'australian-female': 'en-AU-Neural2-A',
  'australian-male': 'en-AU-Neural2-B',
  'american-female': 'en-US-Neural2-C',
  'american-male': 'en-US-Neural2-D',
} as const;

export function resolveExamNeural2Voice(value: unknown, accent?: unknown) {
  const voiceId = typeof value === 'string' ? value : '';
  const legacyAccent = resolveSpeakingAccent(accent, 'exam');
  return (
    EXAM_NEURAL2_VOICES[voiceId as keyof typeof EXAM_NEURAL2_VOICES] ||
    EXAM_NEURAL2_VOICES[`${legacyAccent}-female` as keyof typeof EXAM_NEURAL2_VOICES]
  );
}

type PracticeTtsModel = {
  voices: readonly string[];
  defaultVoice: string;
  /** Provider options key that accepts speech_metadata.style, when supported. */
  styleProviderKey?: string;
};

export const PRACTICE_TTS_MODELS: Record<string, PracticeTtsModel> = {
  'google/gemini-3.8-flash-lite-tts': {
    voices: [
      'Sulafat',
      'Achernar',
      'Vindemiatrix',
      'Aoede',
      'Kore',
      'Leda',
      'Autonoe',
      'Despina',
      'Erinome',
      'Laomedeia',
      'Pulcherrima',
      'Zephyr',
      'Callirrhoe',
      'Gacrux',
      'Puck',
      'Charon',
      'Fenrir',
      'Orus',
      'Enceladus',
      'Iapetus',
      'Umbriel',
      'Algieba',
      'Algenib',
      'Rasalgethi',
      'Alnilam',
      'Schedar',
      'Achird',
      'Zubenelgenubi',
      'Sadachbia',
      'Sadaltager',
    ],
    // Google describes Sulafat as a warm voice; the style sets the accent.
    defaultVoice: 'Sulafat',
    styleProviderKey: 'google-ai-studio',
  },
};

// Gemini: the most natural of the tested voices, and streamed from Google it
// starts in ~1.2s. Kokoro (cheaper, but flat and 7-13s on 2026-09-28),
// Orpheus (5-15s) and Sesame CSM (~29s) were tested and dropped.
export const DEFAULT_PRACTICE_TTS_MODEL = 'google/gemini-3.8-flash-lite-tts';

export type PracticeTtsRollout = 'off' | 'admin' | 'all';

/** Unknown or missing values mean off, so a typo can never widen the rollout. */
export function parsePracticeTtsRollout(value: unknown): PracticeTtsRollout {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return normalized === 'admin' || normalized === 'all' ? normalized : 'off';
}

export function isPracticeTtsAllowed(rollout: PracticeTtsRollout, isAdmin: boolean) {
  if (rollout === 'all') return true;
  return rollout === 'admin' && isAdmin;
}

export type PracticeTtsSelection = { model: string; voice: string; accent?: SpeakingAccent };

/**
 * Choose the model and voice. The server default comes from environment
 * configuration; only admins may override it per request, and only with a
 * listed model and one of that model's voices.
 */
export function resolvePracticeTtsSelection(params: {
  configuredModel?: string | null;
  configuredVoice?: string | null;
  requestedModel?: unknown;
  requestedVoice?: unknown;
  isAdmin: boolean;
}): PracticeTtsSelection {
  const configuredModel =
    params.configuredModel && PRACTICE_TTS_MODELS[params.configuredModel]
      ? params.configuredModel
      : DEFAULT_PRACTICE_TTS_MODEL;
  const requestedModel = typeof params.requestedModel === 'string' ? params.requestedModel : '';
  const model =
    params.isAdmin && PRACTICE_TTS_MODELS[requestedModel] ? requestedModel : configuredModel;
  const entry = PRACTICE_TTS_MODELS[model];

  const requestedVoice = typeof params.requestedVoice === 'string' ? params.requestedVoice : '';
  const configuredVoice = model === configuredModel ? params.configuredVoice || '' : '';
  const voice =
    params.isAdmin && entry.voices.includes(requestedVoice)
      ? requestedVoice
      : entry.voices.includes(configuredVoice)
        ? configuredVoice
        : entry.defaultVoice;

  return { model, voice };
}

/** Collapse whitespace and cap the length. Case is kept: it can change prosody. */
export function normalizePracticeTtsText(text: unknown) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PRACTICE_TTS_MAX_CHARACTERS);
}

export function styleForModel(model: string, accent: SpeakingAccent = 'british') {
  return PRACTICE_TTS_MODELS[model]?.styleProviderKey ? SPEAKING_ACCENT_STYLES[accent] : '';
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Content address of one rendition: every input that changes the audio is in the hash. */
export async function computePracticeTtsCacheKey(selection: PracticeTtsSelection, text: string) {
  const material = JSON.stringify([
    PRACTICE_TTS_CACHE_VERSION,
    selection.model,
    selection.voice,
    styleForModel(selection.model, selection.accent),
    text,
  ]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const neural2 = selection.model === 'google-tts-neural2';
  return `${neural2 ? EXAM_NEURAL2_CACHE_PREFIX : PRACTICE_TTS_CACHE_PREFIX}/${toHex(digest)}.${neural2 ? 'mp3' : 'wav'}`;
}

export function buildOpenRouterSpeechRequest(selection: PracticeTtsSelection, text: string) {
  const body: Record<string, unknown> = {
    model: selection.model,
    input: text,
    voice: selection.voice,
    // Gemini TTS only returns raw PCM (400 on mp3, verified 2026-09-28); the
    // server wraps it in a WAV header.
    response_format: 'pcm',
  };
  const styleProviderKey = PRACTICE_TTS_MODELS[selection.model]?.styleProviderKey;
  if (styleProviderKey) {
    body.provider = {
      options: {
        [styleProviderKey]: {
          speech_metadata: { style: styleForModel(selection.model, selection.accent) },
        },
      },
    };
  }
  return body;
}

/** Parse `audio/pcm;rate=24000;channels=1`. Gemini's documented default is 24 kHz mono. */
export function parsePcmContentType(contentType: string | null) {
  const value = String(contentType || '').toLowerCase();
  if (!value.startsWith('audio/pcm') && !value.startsWith('audio/l16')) return null;
  const rate = Number(/rate=(\d+)/.exec(value)?.[1] || 24000);
  const channels = Number(/channels=(\d+)/.exec(value)?.[1] || 1);
  if (!Number.isInteger(rate) || rate < 8000 || rate > 48000) return null;
  if (channels !== 1 && channels !== 2) return null;
  return { sampleRate: rate, channels };
}

/** Prefix 16-bit little-endian PCM with a 44-byte RIFF/WAVE header. */
export function pcm16ToWav(pcm: Uint8Array, sampleRate: number, channels: number) {
  const dataLength = pcm.byteLength - (pcm.byteLength % (2 * channels));
  const wav = new Uint8Array(44 + dataLength);
  const view = new DataView(wav.buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) wav[offset + i] = text.charCodeAt(i);
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, dataLength, true);
  wav.set(pcm.subarray(0, dataLength), 44);
  return wav;
}

/**
 * Turn a provider PCM response into a storable WAV, or null when it is not
 * audio (a JSON error body, an empty stream, an unexpected format).
 */
export function toPlayableAudio(contentType: string | null, bytes: Uint8Array) {
  const pcm = parsePcmContentType(contentType);
  if (!pcm || bytes.byteLength < PRACTICE_TTS_MIN_AUDIO_BYTES) return null;
  return {
    bytes: pcm16ToWav(bytes, pcm.sampleRate, pcm.channels),
    contentType: 'audio/wav',
  };
}

// Gemini bills audio output at ~25 tokens per second of speech. The Sulafat
// voice measured 11.7-14.5 characters per second on 2026-09-28, and 13 matched
// the billed cost within ~15%. This is an estimate for the usage ledger;
// OpenRouter's generation record is the bill.
const GEMINI_AUDIO_TOKENS_PER_SECOND = 25;
const SPOKEN_CHARACTERS_PER_SECOND = 13;
const TEXT_CHARACTERS_PER_TOKEN = 4;

export function estimatePracticeTtsCostUsd(
  model: string,
  text: string,
  accent: SpeakingAccent = 'british'
) {
  const characters = text.length;
  const promptTokens = Math.ceil(
    (characters + styleForModel(model, accent).length) / TEXT_CHARACTERS_PER_TOKEN
  );
  const outputTokens = Math.ceil(
    (characters / SPOKEN_CHARACTERS_PER_SECOND) * GEMINI_AUDIO_TOKENS_PER_SECOND
  );
  return estimateTokenCostUsd(model, { promptTokens, outputTokens });
}
