// @ts-ignore Deno runtime imports
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';
import { requestOpenRouterJson, requestGeminiJson } from '../_shared/textAiProvider.ts';
import { transcribeWithGeminiFallback } from '../_shared/speakingProviders.ts';
import { inspectWav, validateFeedback, buildTutorPrompt } from '../_shared/skill-lab/validation.js';
import { handleLibraryPractice } from './libraryHandler.ts';
declare const Deno: any;
const json = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405, headers);
  const client = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  let operation: string | null = null;
  let path: string | null = null;
  const started = Date.now();
  try {
    const csrf = validateCsrfProtection(req);
    if (!csrf.valid) return json({ error: 'Request origin is not allowed' }, 403, headers);
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Please sign in' }, 401, headers);
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);
    if (authError || !user) return json({ error: 'Please sign in' }, 401, headers);
    if (Number(req.headers.get('content-length') || 0) > 8100000)
      return json({ error: 'Recording is too large' }, 413, headers);
    const raw = await req.text();
    if (raw.length > 8100000) return json({ error: 'Recording is too large' }, 413, headers);
    const body = JSON.parse(raw);
    if (body.library === true && body.action !== 'help') {
      if (raw.length > 40000) return json({ error: 'Practice request is too large' }, 413, headers);
      return json(await handleLibraryPractice(client, user.id, body), 200, headers);
    }
    const { sessionId, requestId, kind } = body;
    if (
      !/^[0-9a-f-]{36}$/i.test(sessionId) ||
      !/^[0-9a-f-]{36}$/i.test(requestId) ||
      !['help', 'evaluate', 'audio'].includes(kind)
    )
      return json({ error: 'Invalid lesson request' }, 400, headers);
    let answer = String(body.answer || '').trim();
    let bytes: Uint8Array | null = null;
    let duration = 0;
    if (kind === 'audio') {
      const encoded = String(body.audio || '');
      bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      duration = inspectWav(bytes);
    } else if (!answer || answer.length > (kind === 'help' ? 600 : 1800))
      return json(
        {
          error:
            'Please keep your response short: up to 600 characters for a question or 1,800 for practice.',
        },
        400,
        headers
      );
    const { data: reserved, error } = await client.rpc(
      body.library === true ? 'practice_library_ai_reserve' : 'skill_lab_ai_reserve',
      {
        p_auth: user.id,
        p_session: sessionId,
        p_id: requestId,
        p_kind: kind,
      }
    );
    if (error) return json({ error: error.message }, 429, headers);
    if (reserved.state === 'complete')
      return reserved.result
        ? json(reserved.result, 200, headers)
        : json(
            { error: 'This saved response has expired. Please make a new request.' },
            409,
            headers
          );
    if (reserved.state !== 'reserved')
      return json(
        {
          error:
            'This request is already processed or still running. Please refresh before retrying.',
        },
        409,
        headers
      );
    operation = requestId;
    let transcriptionTokens = 0;
    if (bytes) {
      path = `${reserved.user_id}/${requestId}.wav`;
      const registered = await client.rpc('skill_lab_audio_cleanup', {
        p_action: 'register',
        p_path: path,
      });
      if (registered.error) throw new Error('Recording could not be saved safely.');
      const upload = await client.storage
        .from('skill-lab-audio')
        .upload(path, bytes, { contentType: 'audio/wav', upsert: false });
      if (upload.error) throw new Error('Recording could not be uploaded. Please try again.');
      // One transcription attempt leaves two attempts for the GLM-first feedback chain.
      const transcribed = await transcribeWithGeminiFallback({
        apiKey: Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '',
        audioBase64: body.audio,
        audioMimeType: 'audio/wav',
        audioDurationMs: duration * 1000,
      });
      answer = transcribed.transcript;
      transcriptionTokens = transcribed.tokensUsed;
      if (answer.split(/\s+/).length < 5)
        throw new Error(
          'We could not hear enough clearly. Please record again. No progress result was added.'
        );
    }
    const prompt = buildTutorPrompt(reserved.context, kind, answer, null);
    const request = {
      ...prompt,
      maxOutputTokens: 1200,
      timeoutMs: 20000,
      temperature: 0.2,
      validateJson: validateFeedback,
    };
    let result;
    let usedFallback = false;
    try {
      if (!Deno.env.get('OPENROUTER_API_KEY')) throw new Error('Primary not configured');
      result = await requestOpenRouterJson({
        ...request,
        apiKey: Deno.env.get('OPENROUTER_API_KEY'),
        model: 'z-ai/glm-5.3-flash',
        includeUsageAccounting: true,
      });
    } catch {
      usedFallback = true;
      result = await requestGeminiJson({
        ...request,
        apiKey: Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '',
        temperature: 0,
      });
    }
    const response = {
      ...result.parsed,
      ...(bytes
        ? {
            transcript: answer,
            transcript_note:
              'Feedback is based on these words. If they are inaccurate, record again. Pronunciation and pauses are not scored.',
          }
        : {}),
    };
    // Reserve absorbs unknown failed-attempt/transcription costs conservatively.
    const finished = await client.rpc('skill_lab_ai_finish', {
      p_id: operation,
      p_result: response,
      p_cost: usedFallback
        ? Math.max(0.1, result.usage.estimatedProviderCostUsd)
        : result.usage.estimatedProviderCostUsd + (bytes ? 0.01 : 0),
      p_tokens: result.usage.tokensUsed + transcriptionTokens,
      p_model: result.model,
      p_latency: Date.now() - started,
      p_ok: true,
    });
    if (finished.error)
      throw new Error('Feedback could not be saved. Please refresh before trying again.');
    return json(response, 200, headers);
  } catch (error) {
    if (operation)
      await client.rpc('skill_lab_ai_finish', {
        p_id: operation,
        p_result: null,
        p_cost: null,
        p_tokens: 0,
        p_model: null,
        p_latency: Date.now() - started,
        p_ok: false,
      });
    // Never expose provider errors or student text in logs.
    const message =
      error instanceof Error &&
      /record|Recording|hear enough|saved|response short/i.test(error.message)
        ? error.message
        : 'AI help is unavailable right now. Your lesson progress is saved. Please try again.';
    return json({ error: message }, 503, headers);
  } finally {
    if (path) {
      const removed = await client.storage.from('skill-lab-audio').remove([path]);
      if (!removed.error)
        await client.rpc('skill_lab_audio_cleanup', { p_action: 'done', p_path: path });
    }
  }
});
