// @ts-ignore Deno runtime imports
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';
import {
  requestOpenRouterDeepSeekJson,
  requestOpenRouterLunaJson,
  requestOpenRouterJson,
  TextAiProviderError,
} from '../_shared/textAiProvider.ts';
import {
  READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL,
  READING_ASSISTANT_FAST_MODEL,
  READING_ASSISTANT_GLM_FALLBACK_MODEL,
  READING_ASSISTANT_LUNA_FALLBACK_MODEL,
  READING_ASSISTANT_PRIMARY_MODEL,
  readingAssistantPrimaryModel,
} from '../_shared/aiModelRegistry.ts';
import {
  actionOutputLimit,
  buildReadingPrompt,
  cacheIdentity,
  normalizeAssistantResult,
  parseReadingSections,
  resolveSelection,
  validateAssistBody,
  validateAssistantResult,
} from './validation.ts';

declare const Deno: any;
const CACHE_VERSION = 'reading-assistant-v4-sentence-dictionary-cache';

const response = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function statusForDatabaseError(message: string) {
  if (/Exam mode|session is unavailable|current plan/i.test(message)) return 403;
  if (
    /free (Translate|Breakdown) results|wait a minute|already being processed|available again tomorrow/i.test(
      message
    )
  )
    return 429;
  if (/taking a break|temporarily unavailable/i.test(message)) return 503;
  return 400;
}

function telemetryError(error: unknown) {
  if (error instanceof TextAiProviderError) {
    return {
      provider: error.provider,
      code: error.code,
      message: error.message.slice(0, 240),
    };
  }
  return { provider: 'none', code: 'provider_failure', message: 'AI provider request failed' };
}

/**
 * What a rejected attempt still cost.
 *
 * A provider bills a response it has generated even when we throw its content
 * away for being off-contract, so those charges have to be added to the one that
 * finally worked. Otherwise the daily budget only ever sees the last call and a
 * bad run for the primary model can spend past the cap unnoticed.
 */
function billedCost(error: unknown) {
  return error instanceof TextAiProviderError ? error.usage?.estimatedProviderCostUsd || 0 : 0;
}

function billedTokens(error: unknown) {
  return error instanceof TextAiProviderError ? error.usage?.tokensUsed || 0 : 0;
}

function fallbackReasonCodes(
  primaryModel: string,
  primaryError: unknown,
  fallbackAttempts: Array<{ model: string; error: unknown }>
) {
  const codes = [
    ...(primaryError ? [`${primaryModel}:${telemetryError(primaryError).code}`] : []),
    ...fallbackAttempts.map(({ model, error }) => `${model}:${telemetryError(error).code}`),
  ];
  return codes.length ? codes.join('|').slice(0, 480) : null;
}

async function requestReadingAssistantResult({
  action,
  prompt,
  validateJson,
  maxOutputTokens,
}: {
  action: string;
  prompt: string;
  validateJson: (value: any) => boolean;
  maxOutputTokens: number;
}) {
  const primaryModel = readingAssistantPrimaryModel(action);
  let primaryError: unknown = null;
  let generated: any = null;
  const fallbackAttempts: Array<{ model: string; error: unknown }> = [];
  const systemPrompt =
    'You are a concise IELTS Reading language assistant. Return only valid JSON.';

  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (openRouterKey) {
    try {
      generated = await requestOpenRouterJson({
        apiKey: openRouterKey,
        model: primaryModel,
        prompt,
        systemPrompt,
        maxOutputTokens: Math.min(maxOutputTokens * 2, 2048),
        timeoutMs: 6_000,
        includeUsageAccounting: true,
        disableReasoning: true,
        reasoningEffort: 'low',
        temperature: 0.1,
        validateJson,
      });
    } catch (error) {
      primaryError = error;
    }
  } else {
    primaryError = new TextAiProviderError('OpenRouter API key is not configured', {
      provider: 'openrouter',
      code: 'missing_api_key',
    });
  }
  if (generated) return { generated, primaryError, fallbackAttempts };

  const attemptFallback = async (model: string, request: () => Promise<any>) => {
    try {
      return await request();
    } catch (error) {
      fallbackAttempts.push({ model, error });
      return null;
    }
  };

  if (openRouterKey) {
    if (primaryModel === READING_ASSISTANT_FAST_MODEL) {
      generated = await attemptFallback(READING_ASSISTANT_PRIMARY_MODEL, () =>
        requestOpenRouterJson({
          apiKey: openRouterKey,
          model: READING_ASSISTANT_PRIMARY_MODEL,
          prompt,
          systemPrompt,
          maxOutputTokens: Math.min(maxOutputTokens * 2, 2048),
          timeoutMs: 6_000,
          includeUsageAccounting: true,
          disableReasoning: true,
          reasoningEffort: 'low',
          temperature: 0.1,
          validateJson,
        })
      );
      if (generated) return { generated, primaryError, fallbackAttempts };
    }

    generated = await attemptFallback(READING_ASSISTANT_LUNA_FALLBACK_MODEL, () =>
      requestOpenRouterLunaJson({
        apiKey: openRouterKey,
        prompt,
        systemPrompt,
        maxOutputTokens,
        timeoutMs: 8_000,
        validateJson,
      })
    );
    if (generated) return { generated, primaryError, fallbackAttempts };

    generated = await attemptFallback(READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL, () =>
      requestOpenRouterDeepSeekJson({
        apiKey: openRouterKey,
        prompt,
        systemPrompt,
        maxOutputTokens,
        timeoutMs: 12_000,
        validateJson,
      })
    );
    if (generated) return { generated, primaryError, fallbackAttempts };

    generated = await attemptFallback(READING_ASSISTANT_GLM_FALLBACK_MODEL, () =>
      requestOpenRouterJson({
        apiKey: openRouterKey,
        model: READING_ASSISTANT_GLM_FALLBACK_MODEL,
        prompt,
        systemPrompt,
        maxOutputTokens: Math.min(maxOutputTokens * 2, 2048),
        timeoutMs: 12_000,
        includeUsageAccounting: true,
        // `disableReasoning` sends an explicit reasoning budget rather than
        // removing one; paired with 'low' it is the hidden low-effort mode the
        // model registry documents for this route.
        disableReasoning: true,
        reasoningEffort: 'low',
        temperature: 0.2,
        validateJson,
      })
    );
    if (generated) return { generated, primaryError, fallbackAttempts };
  }

  throw fallbackAttempts[fallbackAttempts.length - 1]?.error || primaryError;
}

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return response({ error: 'Use POST' }, 405, headers);
  if (!validateCsrfProtection(req).valid)
    return response({ error: 'Request origin is not allowed' }, 403, headers);
  if (Number(req.headers.get('content-length') || 0) > 16_384)
    return response({ error: 'Request too large' }, 413, headers);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } }
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'Please sign in' }, 401, headers);
  const {
    data: { user: authUser },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !authUser) return response({ error: 'Please sign in' }, 401, headers);

  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > 16_384) return response({ error: 'Request too large' }, 413, headers);
    body = JSON.parse(raw);
  } catch {
    return response({ error: 'Invalid request body' }, 400, headers);
  }

  if (body.operation === 'status') {
    if (!/^[0-9a-f-]{36}$/i.test(String(body.sessionId || '')))
      return response({ error: 'Invalid Reading session' }, 400, headers);
    const { data, error } = await admin.rpc('reading_assistant_status', {
      p_auth: authUser.id,
      p_session: body.sessionId,
    });
    if (error)
      return response({ error: error.message }, statusForDatabaseError(error.message), headers);
    return response(data, 200, headers);
  }

  let input;
  try {
    input = validateAssistBody(body);
  } catch (error) {
    return response(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      400,
      headers
    );
  }

  const { data: profile } = await admin
    .from('users')
    .select('id, role, subscription_tier, subscription_end_date')
    .eq('auth_id', authUser.id)
    .single();
  if (!profile) return response({ error: 'Account unavailable' }, 403, headers);
  const { data: session } = await admin
    .from('test_sessions')
    .select('id, user_id, passage_id, test_type, test_mode, is_completed, paired_room_id')
    .eq('id', input.sessionId)
    .eq('user_id', profile.id)
    .single();
  if (!session || session.test_type !== 'reading' || session.paired_room_id)
    return response({ error: 'This Reading session is unavailable' }, 403, headers);
  if (!session.is_completed && session.test_mode === 'mock')
    return response({ error: 'Reading help is hidden during Exam mode' }, 403, headers);
  const { data: passage } = await admin
    .from('passages')
    .select('id, content, is_active, access_tier')
    .eq('id', session.passage_id)
    .single();
  if (!passage?.is_active)
    return response({ error: 'Reading passage is unavailable' }, 403, headers);

  const effectiveTier =
    profile.role === 'admin' ||
    (['pro', 'premium'].includes(profile.subscription_tier) &&
      (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date()))
      ? profile.role === 'admin'
        ? 'premium'
        : profile.subscription_tier
      : 'free';
  if (
    passage.access_tier !== 'free' &&
    effectiveTier !== 'premium' &&
    !(effectiveTier === 'pro' && passage.access_tier === 'pro')
  )
    return response(
      { error: 'This Reading passage is unavailable with your current plan' },
      403,
      headers
    );

  let selection;
  try {
    const sections = parseReadingSections(passage.content);
    if (!sections[input.passageIndex]) throw new Error('Invalid passage selection');
    selection = resolveSelection(
      sections[input.passageIndex],
      input.selectedText,
      input.selectionStart,
      input.action
    );
  } catch (error) {
    return response(
      { error: error instanceof Error ? error.message : 'Invalid selection' },
      400,
      headers
    );
  }

  // Shared by every learner: the key carries no user or session identity, so the
  // first person to look something up pays for it and everyone after is served
  // from cache.
  const cacheKey = await sha256(
    JSON.stringify({
      version: CACHE_VERSION,
      ...cacheIdentity(
        input.action,
        passage.id,
        input.passageIndex,
        selection,
        input.targetLanguage
      ),
    })
  );
  const { data: cachedRow } = await admin
    .from('ai_feedback_cache')
    .select('feedback_json')
    .eq('input_hash', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  const cachedCandidate = normalizeAssistantResult(input.action, cachedRow?.feedback_json);
  const cachedResult = validateAssistantResult(input.action, cachedCandidate)
    ? cachedCandidate
    : null;
  const { data: reservation, error: reserveError } = await admin.rpc('reading_assistant_reserve', {
    p_auth: authUser.id,
    p_session: input.sessionId,
    p_id: input.requestId,
    p_action: input.action,
    p_cache_key: cacheKey,
    p_cached_result: cachedResult,
  });
  if (reserveError) {
    if (/taking a break/i.test(reserveError.message))
      console.warn('[reading-assistant] Daily provider budget reached; generation paused.');
    return response(
      { error: reserveError.message },
      statusForDatabaseError(reserveError.message),
      headers
    );
  }
  if (reservation.state === 'budget_exhausted') {
    // The database has already recorded the event for the admin health card;
    // this branch only has to tell the learner and stop.
    console.warn('[reading-assistant] Daily provider budget reached; generation paused.');
    return response(
      { error: reservation.message || 'New Reading explanations are taking a break today' },
      503,
      headers
    );
  }
  if (reservation.state === 'complete') {
    if (!reservation.reopened && !reservation.replayed)
      await admin.from('ai_api_usage').insert({
        user_id: profile.id,
        endpoint: 'reading-assistant',
        tokens_used: 0,
        cached: true,
        request_metadata: { action: input.action },
      });
    return response(
      {
        requestId: input.requestId,
        state: 'complete',
        action: input.action,
        result: reservation.result,
        source: 'cached',
        remainingDailyQuota: reservation.remainingDailyQuota,
        remainingByAction: reservation.remainingByAction,
        quotaResetsAt: reservation.quotaResetsAt,
      },
      200,
      headers
    );
  }
  if (reservation.state !== 'reserved')
    return response({ error: 'This request could not be completed' }, 409, headers);
  if (reservation.budgetWarning)
    console.warn('[reading-assistant] Daily provider spend is at or above 80%.');

  const started = Date.now();
  const prompt = buildReadingPrompt(input.action, selection, input.targetLanguage);
  // Providers are graded on the answer we will actually store, so a wordy but
  // otherwise correct Breakdown is trimmed rather than rejected into a fallback.
  const validate = (value: any) =>
    validateAssistantResult(input.action, normalizeAssistantResult(input.action, value));
  let generated: any;
  let primaryError: unknown = null;
  let fallbackAttempts: Array<{ model: string; error: unknown }> = [];
  try {
    ({ generated, primaryError, fallbackAttempts } = await requestReadingAssistantResult({
      action: input.action,
      prompt,
      validateJson: validate,
      maxOutputTokens: actionOutputLimit(input.action),
    }));
    // Providers overshoot the length guidance often enough that the shape has to
    // be enforced here rather than only asked for in the prompt.
    generated.parsed = normalizeAssistantResult(input.action, generated.parsed);
    const fallbackReason = fallbackReasonCodes(
      readingAssistantPrimaryModel(input.action),
      primaryError,
      fallbackAttempts
    );
    // Rejected attempts were still billed, so the budget is charged for the whole
    // chain rather than only the call that returned a usable answer.
    const wastedCost =
      billedCost(primaryError) +
      fallbackAttempts.reduce((total, { error }) => total + billedCost(error), 0);
    const wastedTokens =
      billedTokens(primaryError) +
      fallbackAttempts.reduce((total, { error }) => total + billedTokens(error), 0);
    await admin.rpc('reading_assistant_finish', {
      p_id: input.requestId,
      p_result: generated.parsed,
      p_cost: generated.usage.estimatedProviderCostUsd + wastedCost,
      p_tokens: generated.usage.tokensUsed + wastedTokens,
      p_model: generated.model,
      p_latency: Date.now() - started,
      p_ok: true,
    });
    await Promise.allSettled([
      admin.from('ai_feedback_cache').upsert(
        {
          input_hash: cacheKey,
          feedback_json: generated.parsed,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'input_hash' }
      ),
      admin.from('ai_api_usage').insert({
        user_id: profile.id,
        endpoint: 'reading-assistant',
        tokens_used: generated.usage.tokensUsed + wastedTokens,
        cached: false,
        request_metadata: {
          action: input.action,
          model: generated.model,
          provider: generated.provider,
          cached: false,
          reservationStatus: 'completed',
          wastedProviderCostUsd: wastedCost,
          wastedTokens,
          fallbackUsed:
            Boolean(primaryError) || fallbackAttempts.length > 0 || generated.fallbackUsed,
          fallbackReason: fallbackReason || generated.fallbackReason,
          fallbackChain: [
            readingAssistantPrimaryModel(input.action),
            ...fallbackAttempts.map(({ model }) => model),
            generated.model,
          ].filter((model, index, chain) => chain.indexOf(model) === index),
          estimatedProviderCostUsd: generated.usage.estimatedProviderCostUsd + wastedCost,
          latencyMs: Date.now() - started,
        },
      }),
    ]);
    return response(
      {
        requestId: input.requestId,
        state: 'complete',
        action: input.action,
        result: generated.parsed,
        source: 'generated',
        remainingDailyQuota: reservation.remainingDailyQuota,
        remainingByAction: reservation.remainingByAction,
        quotaResetsAt: reservation.quotaResetsAt,
      },
      200,
      headers
    );
  } catch (error) {
    const failed = telemetryError(error);
    const fallbackReason = fallbackReasonCodes(primaryError, fallbackAttempts);
    // Nothing usable came back, but the providers that generated and then failed
    // the contract still charged for it, so the budget has to absorb that.
    // The rethrown error is the last attempt in the list, so it is de-duplicated
    // before the charges are added up.
    const attempts = [
      ...new Set(
        [primaryError, ...fallbackAttempts.map(({ error: item }) => item), error].filter(Boolean)
      ),
    ];
    const wastedCost = attempts.reduce((total, item) => total + billedCost(item), 0);
    const wastedTokens = attempts.reduce((total, item) => total + billedTokens(item), 0);
    await Promise.allSettled([
      admin.rpc('reading_assistant_finish', {
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
        endpoint: 'reading-assistant',
        tokens_used: wastedTokens,
        cached: false,
        request_metadata: {
          action: input.action,
          cached: false,
          reservationStatus: 'failed',
          estimatedProviderCostUsd: wastedCost,
          wastedProviderCostUsd: wastedCost,
          wastedTokens,
          provider: failed.provider,
          failureReason: failed.code,
          fallbackReason,
          fallbackUsed: Boolean(primaryError) || fallbackAttempts.length > 0,
          fallbackChain: [
            readingAssistantPrimaryModel(input.action),
            ...fallbackAttempts.map(({ model }) => model),
          ],
          latencyMs: Date.now() - started,
        },
      }),
    ]);
    return response(
      { error: 'Reading help is temporarily unavailable. Please try again.' },
      503,
      headers
    );
  }
});
