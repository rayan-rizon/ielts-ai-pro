// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  checkRateLimit,
  getRateLimitIdentifier,
  getBurstLimitConfig,
  reserveDatabaseQuota,
  finalizeApiUsage,
  quotaExceededResponse,
} from '../_shared/security.ts';

declare const Deno: any;
declare const EdgeRuntime: any;

// ============================================================
// Google Cloud TTS Neural2 — synthesizeSpeech Edge Function
// ============================================================
// Uses GEMINI_API_KEY (or dedicated GOOGLE_TTS_API_KEY) to call
// the Google Cloud Text-to-Speech API (Neural2 voice).
// Results are cached in Supabase Storage (tts-cache bucket)
// keyed by a SHA-1 hash of (voice + text) to avoid duplicate calls.
//
// IMPORTANT: Enable "Cloud Text-to-Speech API" in your GCP project
// at: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
// The GEMINI_API_KEY (a Google Cloud API key) works for both.
// ============================================================

const TTS_BUCKET = 'tts-cache';
const GOOGLE_NEURAL2_COST_PER_CHARACTER_USD = 0.000016;

// en-GB-Neural2-B: male, warm, natural British English — least robotic Neural2 voice
const DEFAULT_VOICE = 'en-GB-Neural2-B';
const DEFAULT_SPEAKING_RATE = 0.88; // Measured examiner pace — clear and deliberate
const DEFAULT_PITCH = 0.0; // Neutral pitch — avoid robotic bass distortion
const ALLOWED_VOICES = new Set([
  'en-GB-Neural2-A',
  'en-GB-Neural2-B',
  'en-GB-Neural2-C',
  'en-GB-Neural2-D',
  'en-US-Neural2-A',
  'en-US-Neural2-C',
  'en-US-Neural2-D',
  'en-US-Neural2-E',
  'en-US-Neural2-F',
  'en-US-Neural2-G',
  'en-US-Neural2-H',
  'en-US-Neural2-I',
  'en-US-Neural2-J',
]);

/**
 * Compute a deterministic cache key from voice + text.
 * Uses Web Crypto (SubtleCrypto) — available in Deno.
 */
async function computeCacheKey(voice: string, text: string): Promise<string> {
  const input = `${voice}::${text.trim().toLowerCase()}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Call Google Cloud Text-to-Speech API.
 * Tries GOOGLE_TTS_API_KEY first, then falls back to GEMINI_API_KEY.
 * Both are Google Cloud API keys — if Cloud TTS API is enabled in the
 * GCP project, either key will work.
 */
async function callGoogleTTS(
  text: string,
  voiceName: string,
  apiKey: string
): Promise<{ buffer?: ArrayBuffer; base64?: string; error?: string }> {
  const languageCode = voiceName.startsWith('en-GB') ? 'en-GB' : 'en-US';

  const body = {
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: DEFAULT_SPEAKING_RATE,
      pitch: DEFAULT_PITCH,
      // No effectsProfileId — avoid digital headphone processing artifacts
    },
  };

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Google TTS API error ${response.status}:`, errText);
      return { error: 'Speech service is temporarily unavailable.' };
    }

    const data = await response.json();
    const audioContent: string = data.audioContent;
    if (!audioContent) {
      return { error: 'Speech service is temporarily unavailable.' };
    }

    // Decode base64 to binary
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { buffer: bytes.buffer, base64: audioContent };
  } catch (err: any) {
    console.error('[TTS] Google request failed:', err);
    return { error: 'Speech service is temporarily unavailable.' };
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Fast path for warm-up pings (no TTS call, just boot the worker)
  // This eliminates cold-start latency for the first real request
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const maybeBody = await req.clone().json();
      if (maybeBody?.ping === true) {
        return new Response(JSON.stringify({ pong: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // Not JSON or no ping field — continue to normal handler
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let quotaReservationId: string | undefined;

  try {
    // Auth check (JWT required — synthesizeSpeech is for authenticated users only)
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

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('subscription_tier, role')
      .eq('auth_id', user.id)
      .single();
    if (profileError || !userProfile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tier =
      userProfile.role === 'admin'
        ? 'admin'
        : String(userProfile.subscription_tier || 'free').toLowerCase();
    const burstCheck = checkRateLimit(
      `${getRateLimitIdentifier(req, user.id)}:tts`,
      getBurstLimitConfig(tier)
    );
    if (!burstCheck.allowed) {
      return new Response(JSON.stringify({ error: 'Too many speech requests. Please wait.' }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(burstCheck.resetIn / 1000)),
        },
      });
    }

    const { text, voice } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitise + limit text length (Google TTS supports up to 5000 bytes)
    const cleanText = text.trim().slice(0, 1500);
    const voiceName: string = voice || DEFAULT_VOICE;
    if (!ALLOWED_VOICES.has(voiceName)) {
      return new Response(JSON.stringify({ error: 'Unsupported voice' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_TTS_API_KEY');

    if (!apiKey) {
      console.error(
        '[TTS] CRITICAL: GOOGLE_TTS_API_KEY secret is completely missing from the Edge Function environment!'
      );
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: 'Speech service is temporarily unavailable.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    // ----------------------------------------------------------
    // 1. Check cache first (Supabase Storage — content-addressed)
    // ----------------------------------------------------------
    const cacheKey = await computeCacheKey(voiceName, cleanText);
    const fileName = `${cacheKey}.mp3`;

    // Use getPublicUrl first as a fast check (no list API call needed)
    // Then verify with a HEAD request to confirm the file actually exists
    const { data: urlData } = supabase.storage.from(TTS_BUCKET).getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;

    // Fast existence check: try a HEAD request on the expected URL
    let cacheHit = false;
    if (publicUrl) {
      try {
        const headRes = await fetch(publicUrl, { method: 'HEAD' });
        cacheHit = headRes.ok;
      } catch {
        cacheHit = false;
      }
    }

    if (cacheHit && publicUrl) {
      console.log(`[TTS] Cache HIT: ${fileName}`);
      return new Response(JSON.stringify({ success: true, audioUrl: publicUrl, cached: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'synthesizeSpeech',
      'tts',
      `tts:${cacheKey}`,
      { textLength: cleanText.length, voice: voiceName, idempotencyKey: `tts:${cacheKey}` }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }
    quotaReservationId = quotaReservation.reservationId;

    // ----------------------------------------------------------
    // 2. Cache miss — call Google Cloud TTS Neural2
    // ----------------------------------------------------------
    console.log(`[TTS] Cache MISS — calling Google Neural2 for: "${cleanText.slice(0, 80)}"`);
    const {
      buffer: audioBuffer,
      base64: audioBase64,
      error: ttsError,
    } = await callGoogleTTS(cleanText, voiceName, apiKey);

    if (!audioBuffer) {
      // TTS API failed — signal the client to fall back to Web Speech API
      console.warn('[TTS] Google TTS API failed:', ttsError);
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { textLength: cleanText.length, voice: voiceName, ttsFallback: true, ttsError },
        'failed'
      );
      quotaReservationId = undefined;
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: ttsError || 'Speech service is temporarily unavailable.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ----------------------------------------------------------
    // 3. Upload to Supabase Storage (Non-blocking cache update)
    // ----------------------------------------------------------
    const uploadPromise = supabase.storage
      .from(TTS_BUCKET)
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // 1 year — content-addressed, never changes
        upsert: false, // Don't overwrite
      })
      .then(({ error }: { error: any }) => {
        if (
          error &&
          !error.message?.includes('already exists') &&
          !error.message?.includes('The resource already exists')
        ) {
          console.warn('[TTS] Background upload warning:', error.message);
        } else if (!error) {
          console.log(`[TTS] Cached new audio: ${fileName} (${audioBuffer.byteLength} bytes)`);
        }
      })
      .catch((err: any) => console.error('[TTS] Background upload failed:', err.message));

    // Try to extend edge function lifecycle, or fallback to fire-and-forget
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(uploadPromise);
    }

    // Google already returned base64; retain it for the client response rather
    // than decoding and encoding the same audio a second time.
    const base64 = audioBase64;

    await finalizeApiUsage(supabase, quotaReservation.reservationId, 0, false, {
      textLength: cleanText.length,
      voice: voiceName,
      audioBytes: audioBuffer.byteLength,
      billingUnit: 'characters',
      estimatedProviderCostUsd: cleanText.length * GOOGLE_NEURAL2_COST_PER_CHARACTER_USD,
    });
    quotaReservationId = undefined;

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: `data:audio/mpeg;base64,${base64}`,
        cached: false,
        inline: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[TTS] Internal error:', error);
    if (quotaReservationId) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { ttsFallback: true, ttsError: error?.message || 'Internal server error' },
        'failed'
      );
    }
    // Always respond 200 with fallback flag — never block the speaking test
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: 'Speech service is temporarily unavailable.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
