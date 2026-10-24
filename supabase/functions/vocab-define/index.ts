import { getAdmittedUser, withTextAiAdmission } from '../_shared/aiAdmission.ts';
// @ts-ignore Deno runtime imports
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';
import { TextAiProviderError } from '../_shared/textAiProvider.ts';
import { fetchDictionaryPhonetic, generateCard } from './generate.ts';
import {
  cacheIdentity,
  normalizeDefineResult,
  pickIpa,
  validateDefineBody,
  validateDefineResult,
} from './validation.ts';

declare const Deno: any;
const CACHE_VERSION = 'vocab-define-v1';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const response = (
  data: unknown,
  status: number,
  headers: Record<string, string>,
  extra: Record<string, string> = {}
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      ...extra,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function telemetryError(error: unknown) {
  if (error instanceof TextAiProviderError) {
    return { provider: error.provider, code: error.code, message: error.message.slice(0, 240) };
  }
  return { provider: 'none', code: 'provider_failure', message: 'AI provider request failed' };
}

// A provider bills a response it generated even when we reject its content, so
// rejected attempts are charged to the budget along with the one that worked.
const billedCost = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.estimatedProviderCostUsd || 0 : 0;
const billedTokens = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.tokensUsed || 0 : 0;

const handleRequest = async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return response({ error: 'Use POST' }, 405, headers);
  if (!validateCsrfProtection(req).valid)
    return response({ error: 'Request origin is not allowed' }, 403, headers);
  if (Number(req.headers.get('content-length') || 0) > 4_096)
    return response({ error: 'Request too large' }, 413, headers);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } }
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'Please sign in' }, 401, headers);
  const admitted = getAdmittedUser(req);
  const {
    data: { user: authUser },
    error: authError,
  } = admitted ? { data: { user: admitted }, error: null } : await admin.auth.getUser(token);
  if (authError || !authUser) return response({ error: 'Please sign in' }, 401, headers);

  let input;
  try {
    const raw = await req.text();
    if (raw.length > 4_096) return response({ error: 'Request too large' }, 413, headers);
    input = validateDefineBody(JSON.parse(raw));
  } catch (error) {
    return response(
      { error: error instanceof Error ? error.message : 'Invalid request body', code: 'invalid' },
      400,
      headers
    );
  }

  const { data: profile } = await admin
    .rpc('get_institution_learner_profile', { p_auth: authUser.id })
    .select('id')
    .eq('auth_id', authUser.id)
    .single();
  if (!profile) return response({ error: 'Account unavailable' }, 403, headers);

  // Shared by every learner: the key carries no user identity.
  const cacheKey = await sha256(
    JSON.stringify({ version: CACHE_VERSION, ...cacheIdentity(input) })
  );
  const { data: cachedRow } = await admin
    .from('ai_feedback_cache')
    .select('feedback_json')
    .eq('input_hash', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  const cachedCandidate = cachedRow?.feedback_json;
  const cachedResult = validateDefineResult(cachedCandidate, input.language)
    ? cachedCandidate
    : null;

  const { data: reservation, error: reserveError } = await admin.rpc('vocab_define_reserve', {
    p_auth: authUser.id,
    p_id: input.requestId,
    p_cache_key: cacheKey,
    p_cached_result: cachedResult,
  });
  if (reserveError) {
    const unavailable = /temporarily unavailable/i.test(reserveError.message);
    return response(
      {
        error: unavailable
          ? 'Vocabulary help is temporarily unavailable'
          : 'This lookup could not be completed',
        code: unavailable ? 'disabled' : 'rejected',
      },
      unavailable ? 503 : 400,
      headers
    );
  }

  if (reservation.state === 'rate_limited') {
    const quota = reservation.type === 'quota';
    const retryAfterSeconds = Math.max(1, Number(reservation.retryAfterSeconds) || 30);
    return response(
      {
        error: quota
          ? 'You have used today’s AI lookups. They reset at midnight UTC.'
          : reservation.type === 'busy'
            ? 'Another lookup is still running. Try again in a moment.'
            : 'You are looking up words too quickly. Wait a few seconds and try again.',
        rateLimitType: quota ? 'quota' : reservation.type === 'busy' ? 'capacity' : 'burst',
        retryAfterSeconds,
        quotaResetsAt: reservation.quotaResetsAt || null,
        remainingDailyQuota: reservation.remainingDailyQuota ?? null,
      },
      429,
      headers,
      { 'Retry-After': String(retryAfterSeconds) }
    );
  }
  if (reservation.state === 'budget_exhausted') {
    console.warn('[vocab-define] Daily provider budget reached; generation paused.');
    return response(
      { error: 'New AI word cards are taking a break today', code: 'budget' },
      503,
      headers
    );
  }
  if (reservation.state === 'failed')
    return response(
      { error: 'That lookup timed out. Please try again.', code: 'provider' },
      503,
      headers
    );

  const respond = (result: any, source: 'cached' | 'generated') => {
    if (result?.notWord)
      return response(
        { error: `“${input.word}” is not a recognised English word`, code: 'not_a_word' },
        422,
        headers
      );
    return response(
      {
        requestId: input.requestId,
        state: 'complete',
        word: input.word,
        language: input.language,
        result,
        source,
        remainingDailyQuota: reservation.remainingDailyQuota ?? null,
        quotaResetsAt: reservation.quotaResetsAt ?? null,
      },
      200,
      headers
    );
  };

  if (reservation.state === 'complete') {
    if (!reservation.replayed)
      await admin.from('ai_api_usage').insert({
        user_id: profile.id,
        endpoint: 'vocab-define',
        tokens_used: 0,
        cached: true,
        request_metadata: { language: input.language },
      });
    return respond(reservation.result, 'cached');
  }
  if (reservation.state !== 'reserved')
    return response({ error: 'This request could not be completed' }, 409, headers);
  if (reservation.budgetWarning)
    console.warn('[vocab-define] Daily provider spend is at or above 80%.');

  const started = Date.now();
  const [{ generated, failures }, dictionaryPhonetic] = await Promise.all([
    generateCard(input, Deno.env.get('OPENROUTER_API_KEY')),
    fetchDictionaryPhonetic(input.word),
  ]);
  const wastedCost = failures.reduce((total, { error }) => total + billedCost(error), 0);
  const wastedTokens = failures.reduce((total, { error }) => total + billedTokens(error), 0);
  const fallbackChain = [
    ...failures.map(({ model }) => model),
    ...(generated ? [generated.model] : []),
  ].filter((model, index, chain) => chain.indexOf(model) === index);

  if (!generated) {
    const failed = telemetryError(failures[failures.length - 1]?.error);
    await Promise.allSettled([
      admin.rpc('vocab_define_finish', {
        p_id: input.requestId,
        p_result: null,
        p_cost: wastedCost,
        p_tokens: wastedTokens,
        p_model: '',
        p_latency: Date.now() - started,
        p_ok: false,
      }),
      admin.from('ai_api_usage').insert({
        user_id: profile.id,
        endpoint: 'vocab-define',
        tokens_used: wastedTokens,
        cached: false,
        request_metadata: {
          reservationStatus: 'failed',
          provider: failed.provider,
          failureReason: failed.code,
          fallbackChain,
          estimatedProviderCostUsd: wastedCost,
          latencyMs: Date.now() - started,
        },
      }),
    ]);
    return response(
      { error: 'AI word cards are temporarily unavailable. Please try again.', code: 'provider' },
      503,
      headers
    );
  }

  const parsed: any = normalizeDefineResult(generated.parsed, input.language, input.word);
  if (parsed && !parsed.notWord) parsed.ipa = pickIpa(dictionaryPhonetic, parsed.ipa);

  await Promise.allSettled([
    admin.rpc('vocab_define_finish', {
      p_id: input.requestId,
      p_result: parsed,
      p_cost: generated.usage.estimatedProviderCostUsd + wastedCost,
      p_tokens: generated.usage.tokensUsed + wastedTokens,
      p_model: generated.model,
      p_latency: Date.now() - started,
      p_ok: true,
    }),
    admin.from('ai_feedback_cache').upsert(
      {
        input_hash: cacheKey,
        feedback_json: parsed,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: 'input_hash' }
    ),
    admin.from('ai_api_usage').insert({
      user_id: profile.id,
      endpoint: 'vocab-define',
      tokens_used: generated.usage.tokensUsed + wastedTokens,
      cached: false,
      request_metadata: {
        model: generated.model,
        provider: generated.provider,
        language: input.language,
        reservationStatus: 'completed',
        fallbackUsed: failures.length > 0,
        fallbackChain,
        estimatedProviderCostUsd: generated.usage.estimatedProviderCostUsd + wastedCost,
        wastedProviderCostUsd: wastedCost,
        latencyMs: Date.now() - started,
      },
    }),
  ]);
  return respond(parsed, 'generated');
};

Deno.serve(withTextAiAdmission('vocab-define', handleRequest));
