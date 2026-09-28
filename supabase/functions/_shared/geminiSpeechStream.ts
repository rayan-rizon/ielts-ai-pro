// Streamed Gemini TTS straight from Google (not through OpenRouter).
//
// Measured 2026-09-28 for one coach sentence: streaming from Google gives the
// first audio in ~1.2s and finishes in ~1.9s, against 3-4s for a whole-clip
// request and 4-5s through OpenRouter. Audio arrives as base64 chunks of
// 24 kHz mono 16-bit little-endian PCM inside server-sent events.

export const GEMINI_TTS_DIRECT_MODEL = 'gemini-3.8-flash-lite-tts';
export const GEMINI_TTS_SAMPLE_RATE = 24000;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_DIRECT_MODEL}:streamGenerateContent?alt=sse`;

export type GeminiSpeechUsage = { promptTokens: number; outputTokens: number };

export function buildGeminiSpeechRequest(text: string, voice: string, style: string) {
  return {
    contents: [
      {
        role: 'user',
        // The style rides alongside the text so it steers delivery without
        // being read aloud (Gemini 3.8 TTS speaks `text` verbatim).
        parts: [{ text, ...(style ? { speechMetadata: { style } } : {}) }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * Parse Gemini server-sent events into PCM chunks. Lines can be split across
 * network reads, so only complete lines are parsed.
 */
export async function* readGeminiSpeechEvents(
  body: ReadableStream<Uint8Array>,
  usage: GeminiSpeechUsage
): AsyncGenerator<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  const parseLine = function* (line: string) {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    const event = JSON.parse(payload);
    if (event?.error)
      throw new Error(`Gemini TTS stream error: ${event.error.message || 'unknown'}`);
    const meta = event?.usageMetadata;
    if (meta) {
      usage.promptTokens = Number(meta.promptTokenCount) || usage.promptTokens;
      usage.outputTokens = Number(meta.candidatesTokenCount) || usage.outputTokens;
    }
    for (const part of event?.candidates?.[0]?.content?.parts || []) {
      const data = part?.inlineData?.data;
      if (typeof data === 'string' && data) yield decodeBase64(data);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split('\n');
    buffered = lines.pop() || '';
    for (const line of lines) yield* parseLine(line.trim());
  }
  buffered += decoder.decode();
  if (buffered.trim()) yield* parseLine(buffered.trim());
}

/**
 * Open the stream. Resolves once Google has answered with a 200, so the
 * caller can still fall back to another voice if the request is refused.
 */
export async function openGeminiSpeechStream(params: {
  apiKey: string;
  text: string;
  voice: string;
  style: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}) {
  const response = await (params.fetchImpl || fetch)(GEMINI_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': params.apiKey },
    body: JSON.stringify(buildGeminiSpeechRequest(params.text, params.voice, params.style)),
    signal: AbortSignal.timeout(params.timeoutMs || 20000),
  });
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini TTS returned HTTP ${response.status} ${detail.slice(0, 200)}`);
  }
  const usage: GeminiSpeechUsage = { promptTokens: 0, outputTokens: 0 };
  return { chunks: readGeminiSpeechEvents(response.body, usage), usage };
}
