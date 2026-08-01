// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Buffer } from 'node:buffer';
// @ts-ignore - Use npm: specifier for Node compatibility
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  logApiUsage,
  checkRateLimit,
  getRateLimitIdentifier,
  reserveDatabaseQuota,
  finalizeApiUsage,
  quotaExceededResponse,
  getBurstLimitConfig,
  checkTierAccess,
} from '../_shared/security.ts';

declare const Deno: any;

const MAX_AUDIO_BYTES = 18 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/webm',
  'audio/ogg',
]);
const TIMESTAMP_TOKEN = String.raw`\d{1,2}:\d{1,2}(?::\d{1,3})?(?:[,.]\d{1,3})?`;
const SPLIT_END_TIMESTAMP_PATTERN = new RegExp(
  String.raw`^([ \t]*${TIMESTAMP_TOKEN}[ \t]*-->)[ \t]*\d+[ \t]*\n[ \t]*(${TIMESTAMP_TOKEN})[ \t]*$`,
  'gm'
);

function normalizeGeneratedSrt(transcript: string): string {
  return transcript
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\s*```(?:srt)?[ \t]*\n?/i, '')
    .replace(/\n?[ \t]*```[ \t]*$/i, '')
    .replace(SPLIT_END_TIMESTAMP_PATTERN, '$1 $2')
    .trim();
}

function isTrustedAudioUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const trustedSupabaseHost = supabaseUrl
      ? new URL(supabaseUrl).hostname
      : 'zvrmvycajimjxghrnpgy.supabase.co';
    const r2PublicUrl = Deno.env.get('R2_PUBLIC_URL');
    const trustedR2Origin = r2PublicUrl ? new URL(r2PublicUrl).origin : 'https://media.ieltsai.pro';

    if (parsed.hostname === trustedSupabaseHost) {
      return parsed.pathname.startsWith('/storage/');
    }

    return parsed.origin === trustedR2Origin || parsed.origin === 'https://media.ieltsai.pro';
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  let quotaReservationId: string | undefined;

  try {
    // Authenticate user
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

    // --- Rate Limiting Strategy (Hybrid) ---

    // 1. Get user's subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('auth_id', user.id)
      .single();

    const tier = userProfile?.subscription_tier || 'free';

    // Tier gate: Audio transcription requires pro or higher
    const tierDenied = checkTierAccess(
      tier,
      ['pro', 'premium', 'admin'],
      corsHeaders,
      'Audio Transcription'
    );
    if (tierDenied) return tierDenied;

    // 2. Burst Protection (In-Memory)
    const burstConfig = getBurstLimitConfig(tier);
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const burstCheck = checkRateLimit(rateLimitId, burstConfig);

    if (!burstCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded (Burst)',
          message: 'Too many requests in a short period. Please wait a moment.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioUrl, audioBase64, mimeType: providedMimeType } = await req.json();

    if (!audioUrl && !audioBase64) {
      return new Response(JSON.stringify({ error: 'Either audioUrl or audioBase64 is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    let base64Audio = audioBase64;
    let mimeType = providedMimeType || 'audio/mpeg';

    if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
      return new Response(JSON.stringify({ error: 'Unsupported audio MIME type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (base64Audio) {
      if (typeof base64Audio !== 'string') {
        return new Response(JSON.stringify({ error: 'audioBase64 must be a string' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const estimatedBytes = Math.ceil(base64Audio.length * 0.75);
      if (estimatedBytes > MAX_AUDIO_BYTES) {
        return new Response(JSON.stringify({ error: 'Audio file is too large.' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!base64Audio) {
      if (!isTrustedAudioUrl(audioUrl)) {
        return new Response(
          JSON.stringify({ error: 'audioUrl must point to a trusted audio source.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch from URL if base64 not provided
      console.log('Fetching trusted audio URL');
      const audioResponse = await fetch(audioUrl);

      if (!audioResponse.ok) {
        throw new Error(
          `Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`
        );
      }

      const contentLength = audioResponse.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_AUDIO_BYTES) {
        return new Response(JSON.stringify({ error: 'Audio file is too large.' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Convert to base64 safely without memory overflow
      const audioBuffer = await audioResponse.arrayBuffer();
      if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
        return new Response(JSON.stringify({ error: 'Audio file is too large.' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      base64Audio = Buffer.from(audioBuffer).toString('base64');

      // Determine MIME type from URL if not provided
      if (!mimeType) {
        mimeType = audioUrl.toLowerCase().endsWith('.wav')
          ? 'audio/wav'
          : audioUrl.toLowerCase().endsWith('.m4a')
            ? 'audio/mp4'
            : 'audio/mpeg';
      }
    }

    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'transcribeAudio',
      null,
      null,
      {
        hasUrl: !!audioUrl,
        hasBase64: !!audioBase64,
        mimeType,
      }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }
    quotaReservationId = quotaReservation.reservationId;

    console.log(`Audio ready. Size: ${Math.round(base64Audio.length / 1024)}KB, MIME: ${mimeType}`);

    // Use Gemini Flash Latest (Stable alias)
    const model = 'gemini-2.5-flash';

    // STRICT Prompt for 100% Accuracy and FULL length
    const prompt = `
      You are a professional audio transcriber. Your task is to transcribe the ENTIRE audio file into a perfectly formatted SRT (SubRip Subtitle) file.
      
      CRITICAL RULES (To Prevent Truncation):
      1. **TRANSCRIBE EVERYTHING**: You MUST transcribe the audio from the very beginning to the very end. DO NOT summarize, skip, or cut off early. 
      2. **LONG AUDIO WARNING**: The audio is several minutes long and may contain long pauses. Do NOT stop transcribing if you hear silence. Continue until the very end of the recording.
      3. **ACCURACY IS PARAMOUNT**: Listen carefully. Capture every word accurately.
      4. **FORMAT**: Output MUST be valid SRT format.
         - Sequence number (1, 2, 3...)
         - Timestamp range (HH:MM:SS,mmm --> HH:MM:SS,mmm)
         - Subtitle text
         - Blank line between entries
      5. **TIMESTAMPS**: Must be precise to the millisecond.
      6. **SPEAKERS**: Identify speakers if distinct (e.g., "SPEAKER 1:", "SPEAKER 2:").
      7. **SEGMENTATION**: Keep subtitles concise (1-2 sentences max per block).
      
      Example Output:
      1
      00:00:00,000 --> 00:00:04,120
      Welcome to the IELTS listening test.
      
      2
      00:00:04,200 --> 00:00:08,500
      Please listen to the instructions carefully.

      OUTPUT ONLY THE SRT CONTENT. NO MARKDOWN, NO EXPLANATIONS. TRANSCRIBE THE FULL AUDIO.
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 20,
        topP: 0.8,
      },
    };

    console.log('Calling Gemini API...');
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const candidate = geminiData.candidates?.[0];
    const transcript = candidate?.content?.parts?.[0]?.text || '';
    const finishReason = candidate?.finishReason || 'UNKNOWN';
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

    console.log(`Gemini response received. Finish reason: ${finishReason}, Tokens: ${tokensUsed}`);

    if (!transcript) {
      throw new Error(`No transcript received from Gemini API. Finish reason: ${finishReason}`);
    }

    const cleanTranscript = normalizeGeneratedSrt(transcript);

    console.log('Transcription successful, length:', cleanTranscript.length);

    await finalizeApiUsage(supabase, quotaReservation.reservationId, tokensUsed, false, {
      hasUrl: !!audioUrl,
      hasBase64: !!audioBase64,
      audioSize: base64Audio.length,
      mimeType: mimeType,
      transcriptLength: cleanTranscript.length,
    });
    quotaReservationId = undefined;

    return new Response(
      JSON.stringify({
        success: true,
        transcript: cleanTranscript,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in transcribeAudio:', error);
    if (quotaReservationId) {
      await finalizeApiUsage(
        supabase,
        quotaReservationId,
        0,
        false,
        { transcriptionError: error?.message || 'Internal server error' },
        'failed'
      );
    }
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
