// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  checkRateLimit,
  finalizeApiUsage,
  getBurstLimitConfig,
  getCorsHeaders,
  getRateLimitIdentifier,
  quotaExceededResponse,
  reserveDatabaseQuota,
  RATE_LIMITS,
} from '../_shared/security.ts';
import {
  buildOpenRouterSpeechRequest,
  computePracticeTtsCacheKey,
  DEFAULT_PRACTICE_TTS_MODEL,
  EXAM_SULAFAT_TTS_STYLE,
  EXAM_TTS_STYLE,
  isSpeakingTtsCacheable,
  estimatePracticeTtsCostUsd,
  isPracticeTtsAllowed,
  normalizePracticeTtsText,
  OPENROUTER_SPEECH_URL,
  parsePracticeTtsRollout,
  pcm16ToWav,
  resolveExamGeminiVoice,
  resolvePracticeTtsSelection,
  resolveSpeakingAccent,
  styleForSelection,
  toPlayableAudio,
  type PracticeTtsSelection,
} from '../_shared/practiceTts.ts';
import { createR2Objects, readR2Config } from '../_shared/r2Objects.ts';
import { estimateTokenCostUsd } from '../_shared/aiModelRegistry.ts';
import {
  GEMINI_TTS_DIRECT_MODEL,
  GEMINI_TTS_SAMPLE_RATE,
  openGeminiSpeechStream,
} from '../_shared/geminiSpeechStream.ts';

declare const Deno: any;
declare const EdgeRuntime: any;

// ============================================================
// Speaking exam voices and practice coach through Gemini 3.8 Flash-Lite TTS.
// ============================================================
// Practice is gated by PRACTICE_TTS_ROLLOUT; exam is available to authenticated
// learners. Exam voices are chosen from Google's regional Voice Library.
//
// Audio is content-addressed in Cloudflare R2 as WAV. A cache hit returns the
// public CDN URL; misses stream Gemini PCM and save the completed clip.

const PROVIDER_TIMEOUT_MS = 15000;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

function json(body: Record<string, unknown>, headers: Record<string, string>, extra = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json', ...extra },
  });
}

function legacy(reason: string, headers: Record<string, string>) {
  return json({ success: false, fallback: true, useLegacy: true, reason }, headers);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

/** A lookup error counts as a miss: the worst case is one extra synthesis. */
async function lookupCache(
  r2: ReturnType<typeof createR2Objects>,
  selection: PracticeTtsSelection,
  text: string,
  mode: 'practice' | 'exam'
) {
  const startedAt = performance.now();
  const cacheKey = await computePracticeTtsCacheKey(selection, text);
  const cacheable = isSpeakingTtsCacheable(text, mode);
  let cacheHit = false;
  if (!cacheable) return { ...selection, cacheKey, cacheHit, cacheable, ms: 0 };
  try {
    // A slow cache is treated as a miss: synthesis is faster than waiting.
    cacheHit = await r2.exists(cacheKey, 900);
  } catch (error: any) {
    console.warn('[PracticeTTS] R2 lookup failed:', error?.message);
  }
  return { ...selection, cacheKey, cacheHit, cacheable, ms: performance.now() - startedAt };
}

function serverTiming(timings: Record<string, number>) {
  return Object.entries(timings)
    .map(([name, ms]) => `${name};dur=${Math.round(ms)}`)
    .join(', ');
}

/**
 * Pipe Gemini's PCM to the browser as it is generated, then store the whole
 * clip as WAV and record the usage. If Google refuses before any audio, the
 * browser gets the standard-voice fallback; a failure mid-stream ends the
 * stream early and the clip is not cached.
 */
async function streamGeminiSpeech(params: {
  apiKey: string;
  text: string;
  selection: PracticeTtsSelection;
  cacheKey: string;
  cacheable: boolean;
  r2: ReturnType<typeof createR2Objects>;
  supabase: any;
  reservationId: string | undefined;
  corsHeaders: Record<string, string>;
  startedAt: number;
  timings: Record<string, number>;
  route: 'practice-tts' | 'exam-tts';
}) {
  const { supabase, reservationId } = params;
  const providerStartedAt = performance.now();
  let opened;
  try {
    opened = await openGeminiSpeechStream({
      apiKey: params.apiKey,
      text: params.text,
      voice: params.selection.voice,
      style: styleForSelection(params.selection),
    });
  } catch (error: any) {
    console.warn('[PracticeTTS] Gemini stream refused:', error?.message);
    await finalizeApiUsage(
      supabase,
      reservationId,
      0,
      false,
      { route: params.route, ttsError: String(error?.message || error).slice(0, 300) },
      'failed'
    );
    return legacy('provider_error', params.corsHeaders);
  }
  params.timings.firstResponse = performance.now() - providerStartedAt;

  const collected: Uint8Array[] = [];
  let firstChunkMs = 0;
  // 'interrupted': the learner spoke over the coach and the browser cancelled
  // the stream. That is normal use, not a provider failure, and the partial
  // audio is not cached.
  let cancelled = false;
  const finish = async (outcome: 'completed' | 'interrupted' | 'failed', errorMessage?: string) => {
    const total = collected.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    if (outcome === 'completed' && total > 0 && params.cacheable) {
      const pcm = new Uint8Array(total);
      let offset = 0;
      for (const chunk of collected) {
        pcm.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const wav = pcm16ToWav(pcm, GEMINI_TTS_SAMPLE_RATE, 1);
      await params.r2
        .put(params.cacheKey, wav, { contentType: 'audio/wav', cacheControl: CACHE_CONTROL })
        .catch((error: any) => console.warn('[PracticeTTS] R2 upload failed:', error?.message));
    }
    const usage = opened.usage;
    await finalizeApiUsage(
      supabase,
      reservationId,
      usage.promptTokens + usage.outputTokens,
      false,
      {
        route: params.route,
        provider: 'google-direct',
        model: GEMINI_TTS_DIRECT_MODEL,
        voice: params.selection.voice,
        accent: params.selection.accent || 'british',
        streamed: true,
        textLength: params.text.length,
        audioBytes: total,
        audioSeconds: Number((total / 2 / GEMINI_TTS_SAMPLE_RATE).toFixed(2)),
        estimatedProviderCostUsd: estimateTokenCostUsd(GEMINI_TTS_DIRECT_MODEL, {
          promptTokens: usage.promptTokens,
          outputTokens: usage.outputTokens,
        }),
        firstAudioMs: Math.round(firstChunkMs),
        totalMs: Math.round(performance.now() - params.startedAt),
        ...(outcome === 'interrupted' ? { interrupted: true } : {}),
        ...(errorMessage ? { ttsError: errorMessage.slice(0, 300) } : {}),
      },
      outcome === 'failed' ? 'failed' : 'completed'
    );
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of opened.chunks) {
          if (cancelled) break;
          if (!firstChunkMs) firstChunkMs = performance.now() - params.startedAt;
          collected.push(chunk);
          controller.enqueue(chunk);
        }
        if (!cancelled) controller.close();
        const done = finish(cancelled ? 'interrupted' : 'completed');
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil)
          EdgeRuntime.waitUntil(done);
        await done;
      } catch (error: any) {
        if (cancelled) {
          await finish('interrupted');
          return;
        }
        console.warn('[PracticeTTS] Gemini stream failed mid-way:', error?.message);
        controller.error(error);
        await finish('failed', String(error?.message || error));
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...params.corsHeaders,
      'Content-Type': `audio/pcm;rate=${GEMINI_TTS_SAMPLE_RATE};channels=1`,
      'Cache-Control': 'no-store',
      'X-TTS-Model': params.selection.model,
      'X-TTS-Voice': params.selection.voice,
      'Access-Control-Expose-Headers': 'X-TTS-Model, X-TTS-Voice, Server-Timing',
      'Server-Timing': serverTiming({
        ...params.timings,
        total: performance.now() - params.startedAt,
      }),
    },
  });
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const startedAt = performance.now();
  const timings: Record<string, number> = {};
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let quotaReservationId: string | undefined;
  let route: 'practice-tts' | 'exam-tts' = 'practice-tts';

  try {
    const body = await req.json().catch(() => ({}));
    const mode: 'practice' | 'exam' = body?.mode === 'exam' ? 'exam' : 'practice';
    const accent = resolveSpeakingAccent(body?.accent, mode);
    const examVoice = mode === 'exam' ? resolveExamGeminiVoice(body?.examVoice, accent) : null;
    const examStyle = examVoice === 'Sulafat' ? EXAM_SULAFAT_TTS_STYLE : EXAM_TTS_STYLE;
    route = mode === 'exam' ? 'exam-tts' : 'practice-tts';
    const text = normalizePracticeTtsText(body?.text);
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader?.split(' ')[1]);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rollout = parsePracticeTtsRollout(Deno.env.get('PRACTICE_TTS_ROLLOUT'));
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const r2Config = readR2Config();
    const r2 = r2Config ? createR2Objects(r2Config) : null;
    const configuredModel = Deno.env.get('PRACTICE_TTS_MODEL');
    const configuredVoice = Deno.env.get('PRACTICE_TTS_VOICE');

    // Start the cache lookup for the default voice while the profile loads. It
    // runs only for an authenticated caller with the route enabled, and its
    // result is read only after the rollout check below passes.
    const hasOverride =
      mode === 'practice' && (body?.model !== undefined || body?.voice !== undefined);
    const earlyLookup =
      (mode === 'exam' || rollout !== 'off') && r2 && !hasOverride
        ? lookupCache(
            r2,
            examVoice
              ? {
                  model: DEFAULT_PRACTICE_TTS_MODEL,
                  voice: examVoice,
                  style: examStyle,
                  route: 'exam',
                }
              : {
                  ...resolvePracticeTtsSelection({
                    configuredModel,
                    configuredVoice,
                    isAdmin: false,
                  }),
                  accent,
                },
            text,
            mode
          )
        : null;

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier, role')
      .eq('auth_id', user.id)
      .maybeSingle();
    if (!profile) return legacy('profile_missing', corsHeaders);
    timings.auth = performance.now() - startedAt;

    const isAdmin = profile.role === 'admin';
    if (mode === 'practice' && !isPracticeTtsAllowed(rollout, isAdmin))
      return legacy('rollout', corsHeaders);

    // Never synthesize without a cache: every repeat would be billed again.
    if (!r2) return legacy('not_configured', corsHeaders);

    const selection: PracticeTtsSelection = examVoice
      ? {
          model: DEFAULT_PRACTICE_TTS_MODEL,
          voice: examVoice,
          style: examStyle,
          route: 'exam',
        }
      : {
          ...resolvePracticeTtsSelection({
            configuredModel,
            configuredVoice,
            requestedModel: body?.model,
            requestedVoice: body?.voice,
            isAdmin,
          }),
          accent,
        };

    // 1. R2 cache lookup, reusing the early lookup when it was for this voice.
    const early = earlyLookup ? await earlyLookup : null;
    const lookup =
      early && early.model === selection.model && early.voice === selection.voice
        ? early
        : await lookupCache(r2, selection, text, mode);
    const { cacheKey, cacheHit, cacheable } = lookup;
    const publicUrl = r2.publicUrl(cacheKey);
    timings.cache = lookup.ms;

    if (cacheHit) {
      timings.total = performance.now() - startedAt;
      return json(
        { success: true, audioUrl: publicUrl, cached: true, ...selection, timings },
        corsHeaders,
        { 'Server-Timing': serverTiming(timings) }
      );
    }

    // Cache hits cost no provider call and should never change the examiner's
    // voice when the learner hears several fixed questions in quick succession.
    // Misses still use the shared database quota; the exam allows a short
    // opening burst of questions even on the free tier.
    const tier = isAdmin ? 'admin' : String(profile.subscription_tier || 'free').toLowerCase();
    const burst = checkRateLimit(
      `${getRateLimitIdentifier(req, user.id)}:${route}`,
      mode === 'exam' ? RATE_LIMITS.AI_FUNCTION : getBurstLimitConfig(tier)
    );
    if (!burst.allowed) return legacy('rate_limited', corsHeaders);

    if (examVoice && (!geminiApiKey || body?.stream !== true))
      return legacy('not_configured', corsHeaders);
    if (!examVoice && (!geminiApiKey || body?.stream !== true) && !apiKey)
      return legacy('not_configured', corsHeaders);

    // 2. Miss: reserve against the shared TTS quota (the same daily and monthly
    // limits as synthesizeSpeech), then synthesize once.
    const quota = await reserveDatabaseQuota(
      supabase,
      user.id,
      'synthesizeSpeech',
      'tts',
      `${route}:${cacheKey}`,
      { route, textLength: text.length, ...selection }
    );
    if (!quota.allowed) return quotaExceededResponse(quota, corsHeaders);
    quotaReservationId = quota.reservationId;

    if (
      body?.stream === true &&
      geminiApiKey &&
      selection.model === 'google/gemini-3.8-flash-lite-tts'
    ) {
      const reservationId = quotaReservationId;
      quotaReservationId = undefined; // finalized by the stream itself
      return await streamGeminiSpeech({
        apiKey: geminiApiKey,
        text,
        selection,
        cacheKey,
        cacheable,
        r2,
        supabase,
        reservationId,
        corsHeaders,
        startedAt,
        timings,
        route,
      });
    }

    const providerStartedAt = performance.now();
    let providerResponse: Response;
    try {
      providerResponse = await fetch(OPENROUTER_SPEECH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'IELTS Ai Pro',
        },
        body: JSON.stringify(buildOpenRouterSpeechRequest(selection, text)),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (error: any) {
      throw new Error(`OpenRouter speech request failed: ${error?.name || error?.message}`);
    }
    const responseBytes = new Uint8Array(await providerResponse.arrayBuffer());
    timings.provider = performance.now() - providerStartedAt;
    const generationId = providerResponse.headers.get('X-Generation-Id');

    const responseType = providerResponse.headers.get('Content-Type');
    const audio = providerResponse.ok ? toPlayableAudio(responseType, responseBytes) : null;
    if (!audio) {
      const detail = providerResponse.ok
        ? `unexpected ${responseType} (${responseBytes.byteLength} bytes)`
        : new TextDecoder().decode(responseBytes.slice(0, 300));
      throw new Error(`OpenRouter speech ${providerResponse.status}: ${detail}`);
    }
    const audioBytes = audio.bytes;

    // 3. Store shared lines in the background; the learner hears the inline copy now.
    if (cacheable) {
      const upload = r2
        .put(cacheKey, audioBytes, { contentType: audio.contentType, cacheControl: CACHE_CONTROL })
        .catch((error: any) => console.warn('[PracticeTTS] R2 upload failed:', error?.message));
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil)
        EdgeRuntime.waitUntil(upload);
    }

    timings.total = performance.now() - startedAt;
    await finalizeApiUsage(supabase, quotaReservationId, 0, false, {
      route,
      provider: 'openrouter',
      ...selection,
      textLength: text.length,
      audioBytes: audioBytes.byteLength,
      billingUnit: 'openrouter-speech',
      estimatedProviderCostUsd: estimatePracticeTtsCostUsd(selection.model, text, accent),
      generationId,
      providerLatencyMs: Math.round(timings.provider),
      cacheLookupMs: Math.round(timings.cache),
    });
    quotaReservationId = undefined;

    return json(
      {
        success: true,
        audioUrl: `data:${audio.contentType};base64,${bytesToBase64(audioBytes)}`,
        cached: false,
        inline: true,
        ...selection,
        timings,
      },
      corsHeaders,
      { 'Server-Timing': serverTiming(timings) }
    );
  } catch (error: any) {
    console.error('[PracticeTTS] Failed:', error?.message || error);
    if (quotaReservationId) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { route, ttsError: String(error?.message || error).slice(0, 300) },
        'failed'
      );
    }
    // The browser reports an unavailable exam voice without switching providers.
    return legacy('provider_error', corsHeaders);
  }
});
