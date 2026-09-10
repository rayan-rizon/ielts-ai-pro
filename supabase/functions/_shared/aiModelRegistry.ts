// Single source of truth for "which AI model runs where, what falls back to it,
// and what it costs". Provider code imports the pricing from here so the cost
// math and the documentation can never drift apart.
//
// Inspect it with:  npm run ai:models
// Benchmark a candidate model against it with:  npm run ai:bench -- --model <id>

export type TokenPricing = {
  /** USD per 1M input tokens. */
  inputPerMillion: number;
  /** USD per 1M cached (prompt-cache hit) input tokens. */
  cachedInputPerMillion: number;
  /** USD per 1M output tokens (reasoning tokens included where billed). */
  outputPerMillion: number;
};

export type ModelEntry = {
  /** Provider-qualified model id exactly as sent on the wire. */
  id: string;
  vendor: string;
  /** How the request reaches the model. */
  access:
    | 'openrouter'
    | 'deepseek-direct'
    | 'google-direct'
    | 'vercel-ai-gateway'
    | 'cloudflare'
    | 'azure';
  pricing?: TokenPricing;
  /** Pricing note for services that are not billed per token. */
  pricingNote?: string;
  /** Where the numbers came from, so a stale rate is obvious on review. */
  pricingSource?: string;
};

export type RouteStep = {
  model: string;
  role: 'primary' | 'fallback' | 'repair';
  /** Why this step exists / when it is reached. */
  when: string;
};

export type AiRoute = {
  id: string;
  /** User-visible surface this powers. */
  surface: string;
  file: string;
  steps: RouteStep[];
  maxOutputTokens?: number;
  timeoutMs?: number;
  notes?: string;
};

// --- Models -----------------------------------------------------------------

export const MODELS: Record<string, ModelEntry> = {
  'z-ai/glm-5.3-flash': {
    id: 'z-ai/glm-5.3-flash',
    vendor: 'Z.ai',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.075, cachedInputPerMillion: 0.015, outputPerMillion: 0.25 },
    pricingSource:
      'OpenRouter catalog price, verified 2026-09-06. Billed usage.cost wins when returned.',
  },
  'deepseek/deepseek-v4-flash-0731': {
    id: 'deepseek/deepseek-v4-flash-0731',
    vendor: 'DeepSeek',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.06, cachedInputPerMillion: 0.012, outputPerMillion: 0.12 },
    pricingSource:
      'OpenRouter catalog base price, verified 2026-08-27. Per-endpoint rates range from $0.03/M (OpenInference) to $0.20/M (Phala), so the billed usage.cost wins when returned.',
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    vendor: 'DeepSeek',
    access: 'deepseek-direct',
    pricing: { inputPerMillion: 0.44, cachedInputPerMillion: 0.014, outputPerMillion: 1.32 },
    pricingSource:
      'DeepSeek direct API peak list price, verified 2026-08-27. Off-peak (outside 01:00-04:00 and 06:00-10:00 UTC, Mon-Fri) is half these rates. This route is ~7x the OpenRouter price for the same model family.',
  },
  'openai/gpt-5.6-luna': {
    id: 'openai/gpt-5.6-luna',
    vendor: 'OpenAI',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.2, cachedInputPerMillion: 0.02, outputPerMillion: 1.2 },
    pricingSource:
      'OpenRouter catalog base price, verified 2026-08-27. One OpenAI endpoint serves it at half these rates; billed cost from usage.cost wins when returned.',
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    vendor: 'OpenAI',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.037, cachedInputPerMillion: 0.037, outputPerMillion: 0.17 },
    pricingSource:
      'OpenRouter catalog price, verified 2026-09-10. Billed usage.cost wins when returned.',
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    vendor: 'Google',
    access: 'google-direct',
    pricing: { inputPerMillion: 0.3, cachedInputPerMillion: 0.3, outputPerMillion: 2.5 },
    pricingSource:
      'Google AI list price, verified 2026-08-27. No prompt-cache discount is applied on this route.',
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    vendor: 'Google',
    access: 'google-direct',
    pricing: { inputPerMillion: 0.1, cachedInputPerMillion: 0.1, outputPerMillion: 0.4 },
    pricingSource:
      'Google AI list price, verified 2026-08-27. No prompt-cache discount is applied on this route.',
  },
  '@cf/openai/whisper-large-v3-turbo': {
    id: '@cf/openai/whisper-large-v3-turbo',
    vendor: 'OpenAI via Cloudflare Workers AI',
    access: 'cloudflare',
    pricingNote: 'Billed per audio minute by Cloudflare Workers AI, not per token.',
  },
  'azure-pronunciation-assessment': {
    id: 'azure-pronunciation-assessment',
    vendor: 'Microsoft Azure Speech',
    access: 'azure',
    pricingNote:
      'Billed per audio hour by Azure Speech. Supplies the acoustic evidence, not a band.',
  },
  'google-tts-studio': {
    id: 'google-tts-studio',
    vendor: 'Google Cloud Text-to-Speech',
    access: 'google-direct',
    pricingNote: 'Billed per character (Studio tier). Results are cached by SHA-1 of voice+text.',
  },
};

// Reading assistance uses the measured GPT OSS primary plus bounded provider fallbacks.
// Exporting the ids keeps the Edge Function, benchmark, pricing, and route map
// on one source of truth.
export const READING_ASSISTANT_PRIMARY_MODEL = 'openai/gpt-oss-120b';
export const READING_ASSISTANT_LUNA_FALLBACK_MODEL = 'openai/gpt-5.6-luna';
export const READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL = 'deepseek/deepseek-v4-flash-0731';
export const READING_ASSISTANT_GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';
export const READING_ASSISTANT_GLM_FALLBACK_MODEL = 'z-ai/glm-5.3-flash';
// Backwards-compatible alias for callers that only need the first fallback.
export const READING_ASSISTANT_FALLBACK_MODEL = READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL;

// --- Routes -----------------------------------------------------------------

export const AI_ROUTES: AiRoute[] = [
  {
    id: 'writing-detailed-feedback',
    surface: 'Writing: detailed essay feedback',
    file: 'supabase/functions/generateDetailedFeedback/index.ts',
    maxOutputTokens: 4096,
    steps: [
      {
        model: 'openai/gpt-5.6-luna',
        role: 'primary',
        when: 'Always tried first when OPENROUTER_API_KEY is set.',
      },
      {
        model: 'gemini-2.5-flash',
        role: 'fallback',
        when: 'Luna errors or returns no parsable feedback.',
      },
      {
        model: 'gemini-2.5-flash',
        role: 'repair',
        when: 'One bounded retry on malformed Gemini JSON.',
      },
    ],
  },
  {
    id: 'speaking-evaluation',
    surface: 'Speaking: band scoring',
    file: 'supabase/functions/evaluateSpeakingTest/index.ts',
    maxOutputTokens: 4096,
    timeoutMs: 7000,
    steps: [
      {
        model: 'deepseek/deepseek-v4-flash-0731',
        role: 'primary',
        when: 'Only when Azure pronunciation evidence exists (benchmarked audio-backed route).',
      },
      {
        model: 'gemini-2.5-flash',
        role: 'fallback',
        when: 'No pronunciation evidence, or DeepSeek failed. Calibrated transcript-only scorer.',
      },
      {
        model: 'gemini-2.5-flash',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
    notes:
      'Routing decided in _shared/speakingEvaluationProvider.ts; routingReason is persisted per attempt.',
  },
  {
    id: 'speaking-turn-decision',
    surface: 'Speaking V2: relevance, intent, and coaching decision',
    file: 'supabase/functions/_shared/speakingTurnDecision.ts',
    maxOutputTokens: 256,
    timeoutMs: 1500,
    steps: [
      {
        model: 'gemini-2.5-flash-lite',
        role: 'primary',
        when: 'Only after deterministic silence, repeat, and microphone-intent fast paths.',
      },
    ],
    notes:
      'Returns a closed decision schema. Examiner wording and TTS remain server-template controlled.',
  },
  {
    id: 'speaking-detailed-feedback',
    surface: 'Speaking: detailed deep-dive feedback',
    file: 'supabase/functions/generateDetailedSpeakingFeedback/index.ts',
    maxOutputTokens: 6144,
    steps: [
      {
        model: 'gemini-2.5-flash',
        role: 'primary',
        when: 'Primary provider with one bounded retry for transient failures.',
      },
    ],
  },
  {
    id: 'skill-lab-teacher',
    surface: 'Skill Lab: progress-aware teaching and supported practice feedback',
    file: 'supabase/functions/skill-lab/index.ts',
    maxOutputTokens: 1200,
    timeoutMs: 20000,
    steps: [
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'primary',
        when: 'GLM first through OpenRouter; one attempt.',
      },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'fallback',
        when: 'Primary unavailable or invalid JSON; one attempt, no repair loop.',
      },
    ],
    notes:
      'Progress only, no chat memory. Objective answers use reviewed server keys. Independent checks cannot call the teacher.',
  },
  {
    id: 'reading-assistant',
    surface: 'Reading: contextual dictionary and sentence assistance',
    file: 'supabase/functions/reading-assistant/index.ts',
    maxOutputTokens: 1000,
    timeoutMs: 12000,
    steps: [
      {
        model: READING_ASSISTANT_PRIMARY_MODEL,
        role: 'primary',
        when: 'GPT OSS 120B first through OpenRouter with low reasoning and the validated JSON contract.',
      },
      {
        model: READING_ASSISTANT_LUNA_FALLBACK_MODEL,
        role: 'fallback',
        when: 'GPT OSS is unavailable or invalid; use the previously validated Luna route.',
      },
      {
        model: READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL,
        role: 'fallback',
        when: 'GPT OSS and Luna are unavailable or invalid; try DeepSeek Flash.',
      },
      {
        model: READING_ASSISTANT_GEMINI_FALLBACK_MODEL,
        role: 'fallback',
        when: 'The OpenRouter routes are unavailable or invalid; use Gemini as a later recovery path.',
      },
      {
        model: READING_ASSISTANT_GLM_FALLBACK_MODEL,
        role: 'fallback',
        when: 'All earlier providers are unavailable or invalid; use GLM with low reasoning as the last resort.',
      },
    ],
    notes:
      'Dictionary falls back to the existing public dictionary lookup. Exam mode is server-blocked; completed review is allowed. Provider order is GPT OSS 120B -> Luna -> DeepSeek -> Gemini -> GLM.',
  },
  {
    id: 'skill-lab-transcription',
    surface: 'Skill Lab: up to 60 seconds of recorded speech',
    file: 'supabase/functions/skill-lab/index.ts',
    maxOutputTokens: 1000,
    timeoutMs: 8000,
    steps: [
      {
        model: 'gemini-2.5-flash-lite',
        role: 'primary',
        when: 'Reuse speaking transcription adapter, one attempt. Combined transcription and feedback have at most three provider calls.',
      },
    ],
    notes: 'Transcript-based language feedback only. No pronunciation or pause score.',
  },
  {
    id: 'grammar-transfer',
    surface: 'Grammar Lab: transfer evaluation',
    file: 'supabase/functions/evaluateGrammarTransfer/index.ts',
    maxOutputTokens: 2200,
    steps: [
      {
        model: 'deepseek/deepseek-v4-flash-0731',
        role: 'primary',
        when: 'OPENROUTER_API_KEY set.',
      },
      {
        model: 'deepseek-v4-flash',
        role: 'fallback',
        when: 'OpenRouter failed and DEEPSEEK_API_KEY is set.',
      },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'Both DeepSeek routes failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
    notes: 'Shared chain: _shared/textAiProvider.ts requestJsonWithGeminiFallback.',
  },
  {
    id: 'study-recommendations',
    surface: 'Dashboard: study recommendations',
    file: 'supabase/functions/generateStudyRecommendations/index.ts',
    maxOutputTokens: 2048,
    steps: [
      {
        model: 'deepseek/deepseek-v4-flash-0731',
        role: 'primary',
        when: 'OPENROUTER_API_KEY set.',
      },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'Both DeepSeek routes failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
  },
  {
    id: 'retention-autopilot-analysis',
    surface: 'Admin Marketing: evidence-grounded retention recommendations',
    file: 'supabase/functions/retention-autopilot/index.ts',
    maxOutputTokens: 1800,
    timeoutMs: 20000,
    steps: [
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'primary',
        when: 'OPENROUTER_API_KEY set and the aggregate evidence snapshot changed.',
      },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'GLM and direct DeepSeek failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
    notes:
      'Eligibility, percentages, destinations, offers, contact caps, and dispatch remain deterministic server decisions.',
  },
  {
    id: 'admin-marketing-question',
    surface: 'Admin Marketing: select an approved report from a question',
    file: 'supabase/functions/retention-autopilot/index.ts',
    maxOutputTokens: 256,
    timeoutMs: 12000,
    steps: [
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'primary',
        when: 'Admin asks a reporting question.',
      },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'GLM and direct DeepSeek failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'Retry malformed JSON at temperature zero.',
      },
    ],
    notes: 'AI selects a report key only; the server runs fixed queries and returns exact counts.',
  },
  {
    id: 'retention-autopilot-copy',
    surface: 'Admin Marketing: evidence-bounded learner copy draft',
    file: 'supabase/functions/retention-autopilot/index.ts',
    maxOutputTokens: 450,
    timeoutMs: 12000,
    steps: [
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'primary',
        when: 'An admin explicitly requests an improved draft.',
      },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'GLM and direct DeepSeek failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
    notes:
      'Names are added at delivery; AI drafts cannot alter validated destinations or evidence.',
  },
  {
    id: 'adaptive-learning-path',
    surface: 'Study plan: adaptive learning path ranking',
    file: 'supabase/functions/generateAdaptiveLearningPath/index.ts',
    maxOutputTokens: 512,
    steps: [
      {
        model: 'deepseek/deepseek-v4-flash-0731',
        role: 'primary',
        when: 'OPENROUTER_API_KEY set.',
      },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'Both DeepSeek routes failed.' },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'repair',
        when: 'One retry at temperature 0 on malformed JSON.',
      },
    ],
    notes:
      'The model selects at most three compact activity indices; remaining validated activities retain their order.',
  },
  {
    id: 'speaking-transcription',
    surface: 'Speaking: audio transcription',
    file: 'supabase/functions/processSpeakingSession/index.ts',
    steps: [
      {
        model: '@cf/openai/whisper-large-v3-turbo',
        role: 'primary',
        when: 'Cloudflare credentials present; one VAD-off retry on empty speech.',
      },
      {
        model: 'gemini-2.5-flash-lite',
        role: 'fallback',
        when: 'Whisper failed, or the browser hint disagrees with Whisper by >0.08 similarity.',
      },
    ],
  },
  {
    id: 'transcript-repair',
    surface: 'Speaking: standalone transcribeAudio endpoint',
    file: 'supabase/functions/transcribeAudio/index.ts',
    steps: [
      { model: 'gemini-2.5-flash', role: 'primary', when: 'Single-provider route, no fallback.' },
    ],
  },
  {
    id: 'pronunciation-evidence',
    surface: 'Speaking: pronunciation scoring evidence',
    file: 'supabase/functions/processSpeakingSession/index.ts',
    steps: [
      {
        model: 'azure-pronunciation-assessment',
        role: 'primary',
        when: 'Azure Speech credentials present; absence changes the scoring route.',
      },
    ],
  },
  {
    id: 'text-to-speech',
    surface: 'Listening / Speaking: examiner voice',
    file: 'supabase/functions/synthesizeSpeech/index.ts',
    steps: [
      {
        model: 'google-tts-studio',
        role: 'primary',
        when: 'GOOGLE_TTS_API_KEY, falling back to GEMINI_API_KEY for the same Google Cloud project.',
      },
    ],
  },
];

// --- Cost helpers -----------------------------------------------------------

export type TokenCounts = {
  promptTokens: number;
  cachedPromptTokens?: number;
  outputTokens: number;
};

/** USD cost of one call, using the registry rate for `model`. Unknown models cost 0. */
export function estimateTokenCostUsd(model: string, tokens: TokenCounts): number {
  const pricing = MODELS[model]?.pricing;
  if (!pricing) return 0;
  const cached = Math.min(tokens.promptTokens, Math.max(0, tokens.cachedPromptTokens || 0));
  const uncached = Math.max(0, tokens.promptTokens - cached);
  return Number(
    (
      (cached * pricing.cachedInputPerMillion +
        uncached * pricing.inputPerMillion +
        tokens.outputTokens * pricing.outputPerMillion) /
      1_000_000
    ).toFixed(6)
  );
}

/** Every route a given model appears in, with its role. Used by `npm run ai:models`. */
export function routesUsingModel(model: string) {
  return AI_ROUTES.flatMap((route) =>
    route.steps
      .filter((step) => step.model === model)
      .map((step) => ({ route: route.id, surface: route.surface, role: step.role }))
  );
}
