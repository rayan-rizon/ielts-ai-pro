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
} from '../_shared/security.ts';
import {
  buildOpenRouterSpeechRequest,
  computePracticeTtsCacheKey,
  estimatePracticeTtsCostUsd,
  isPracticeTtsAllowed,
  normalizePracticeTtsText,
  OPENROUTER_SPEECH_URL,
  parsePracticeTtsRollout,
  pcm16ToWav,
  resolvePracticeTtsSelection,
  styleForModel,
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
// Practice-mode examiner voice through OpenRouter speech models.
// ============================================================
// Off unless PRACTICE_TTS_ROLLOUT is "admin" or "all". Whenever this route
// cannot serve a learner it answers { fallback: true, useLegacy: true } and the
// browser calls synthesizeSpeech (Google Neural2) instead, so a failure here
// never silences the examiner. Exam mode never calls this function.
//
// Audio is content-addressed in Cloudflare R2 (MP3, or WAV for Gemini's PCM).
// A cache hit returns the public CDN URL. A miss with the Gemini voice and
// { stream: true } streams raw PCM straight from Google as it is generated
// (first audio ~1.2s) and stores the finished clip; other misses synthesize
// through OpenRouter and return the audio inline.

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
  text: string
) {
  const startedAt = performance.now();
  const cacheKey = await computePracticeTtsCacheKey(selection, text);
  let cacheHit = false;
  try {
    // A slow cache is treated as a miss: synthesis is faster than waiting.
    cacheHit = await r2.exists(cacheKey, 900);
  } catch (error: any) {
    console.warn('[PracticeTTS] R2 lookup failed:', error?.message);
  }
  return { ...selection, cacheKey, cacheHit, ms: performance.now() - startedAt };
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
  r2: ReturnType<typeof createR2Objects>;
  supabase: any;
  reservationId: string | undefined;
  corsHeaders: Record<string, string>;
  startedAt: number;
  timings: Record<string, number>;
}) {
  const { supabase, reservationId } = params;
  const providerStartedAt = performance.now();
  let opened;
  try {
    opened = await openGeminiSpeechStream({
      apiKey: params.apiKey,
      text: params.text,
      voice: params.selection.voice,
      style: styleForModel(params.selection.model),
    });
  } catch (error: any) {
    console.warn('[PracticeTTS] Gemini stream refused:', error?.message);
    await finalizeApiUsage(
      supabase,
      reservationId,
      0,
      false,
      { route: 'practice-tts', ttsError: String(error?.message || error).slice(0, 300) },
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
    if (outcome === 'completed' && total > 0) {
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
        route: 'practice-tts',
        provider: 'google-direct',
        model: GEMINI_TTS_DIRECT_MODEL,
        voice: params.selection.voice,
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

  try {
    const body = await req.json().catch(() => ({}));
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
    const r2Config = readR2Config();
    const r2 = r2Config ? createR2Objects(r2Config) : null;
    const configuredModel = Deno.env.get('PRACTICE_TTS_MODEL');
    const configuredVoice = Deno.env.get('PRACTICE_TTS_VOICE');

    // Start the cache lookup for the default voice while the profile loads. It
    // runs only for an authenticated caller with the route enabled, and its
    // result is read only after the rollout check below passes.
    const hasOverride = body?.model !== undefined || body?.voice !== undefined;
    const earlyLookup =
      rollout !== 'off' && apiKey && r2 && !hasOverride
        ? lookupCache(
            r2,
            resolvePracticeTtsSelection({ configuredModel, configuredVoice, isAdmin: false }),
            text
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
    if (!isPracticeTtsAllowed(rollout, isAdmin)) return legacy('rollout', corsHeaders);

    const tier = isAdmin ? 'admin' : String(profile.subscription_tier || 'free').toLowerCase();
    const burst = checkRateLimit(
      `${getRateLimitIdentifier(req, user.id)}:practice-tts`,
      getBurstLimitConfig(tier)
    );
    // synthesizeSpeech applies its own burst limit to the fallback request.
    if (!burst.allowed) return legacy('rate_limited', corsHeaders);

    // Never synthesize without a cache: every repeat would be billed again.
    if (!apiKey || !r2) return legacy('not_configured', corsHeaders);

    const selection = resolvePracticeTtsSelection({
      configuredModel,
      configuredVoice,
      requestedModel: body?.model,
      requestedVoice: body?.voice,
      isAdmin,
    });

    // 1. R2 cache lookup, reusing the early lookup when it was for this voice.
    const early = earlyLookup ? await earlyLookup : null;
    const lookup =
      early && early.model === selection.model && early.voice === selection.voice
        ? early
        : await lookupCache(r2, selection, text);
    const { cacheKey, cacheHit } = lookup;
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

    // 2. Miss: reserve against the shared TTS quota (the same daily and monthly
    // limits as synthesizeSpeech), then synthesize once.
    const quota = await reserveDatabaseQuota(
      supabase,
      user.id,
      'synthesizeSpeech',
      'tts',
      `practice-tts:${cacheKey}`,
      { route: 'practice-tts', textLength: text.length, ...selection }
    );
    if (!quota.allowed) return quotaExceededResponse(quota, corsHeaders);
    quotaReservationId = quota.reservationId;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
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
        r2,
        supabase,
        reservationId,
        corsHeaders,
        startedAt,
        timings,
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

    // 3. Store in the background; the learner hears the inline copy now.
    const upload = r2
      .put(cacheKey, audioBytes, { contentType: audio.contentType, cacheControl: CACHE_CONTROL })
      .catch((error: any) => console.warn('[PracticeTTS] R2 upload failed:', error?.message));
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(upload);

    timings.total = performance.now() - startedAt;
    await finalizeApiUsage(supabase, quotaReservationId, 0, false, {
      route: 'practice-tts',
      provider: 'openrouter',
      ...selection,
      textLength: text.length,
      audioBytes: audioBytes.byteLength,
      billingUnit: 'openrouter-speech',
      estimatedProviderCostUsd: estimatePracticeTtsCostUsd(selection.model, text),
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
        { route: 'practice-tts', ttsError: String(error?.message || error).slice(0, 300) },
        'failed'
      );
    }
    // The browser falls back to the Neural2 examiner voice.
    return legacy('provider_error', corsHeaders);
  }
});
