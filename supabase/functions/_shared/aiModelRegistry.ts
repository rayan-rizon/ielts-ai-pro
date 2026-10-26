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
  access: 'openrouter' | 'deepseek-direct' | 'google-direct' | 'cloudflare' | 'azure';
  pricing?: TokenPricing;
  /** USD per 1M input characters, for speech models billed per character. */
  characterPricingPerMillion?: number;
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
  reasoningEffort?: 'none' | 'low';
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
    pricing: { inputPerMillion: 0.036, cachedInputPerMillion: 0.0108, outputPerMillion: 0.9 },
    pricingSource:
      'OpenRouter catalog price, verified 2026-10-14. Billed usage.cost wins when returned.',
  },
  'deepseek/deepseek-v4-flash-0731': {
    id: 'deepseek/deepseek-v4-flash-0731',
    vendor: 'DeepSeek',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.04, cachedInputPerMillion: 0.016, outputPerMillion: 0.64 },
    pricingSource:
      'OpenRouter catalog base price, verified 2026-09-22. Billed usage.cost wins when returned.',
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    vendor: 'DeepSeek',
    access: 'deepseek-direct',
    pricing: { inputPerMillion: 0.44, cachedInputPerMillion: 0.014, outputPerMillion: 1.32 },
    pricingSource:
      'DeepSeek direct API peak list price, verified 2026-08-27. Off-peak (outside 01:00-04:00 and 06:00-10:00 UTC, Mon-Fri) is half these rates. This route is ~7x the OpenRouter price for the same model family.',
  },
  'openai/gpt-6-luna': {
    id: 'openai/gpt-6-luna',
    vendor: 'OpenAI',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.1, cachedInputPerMillion: 0.01, outputPerMillion: 0.5 },
    pricingSource:
      'OpenRouter standard-rate catalog price, verified 2026-09-23. Cache read is $0.01/M; prompts above 272K tokens use a higher rate. Billed usage.cost wins when returned.',
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    vendor: 'OpenAI',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.15, cachedInputPerMillion: 0.075, outputPerMillion: 0.6 },
    pricingSource:
      'OpenRouter catalog price, verified 2026-09-22. Billed usage.cost wins when returned.',
  },
  'openai/gpt-oss-20b': {
    id: 'openai/gpt-oss-20b',
    vendor: 'OpenAI',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.03, cachedInputPerMillion: 0.03, outputPerMillion: 0.13 },
    pricingSource:
      'OpenRouter catalog base price, verified 2026-09-22. Billed usage.cost wins when returned.',
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
  'deepseek/deepseek-v4.1-flash': {
    id: 'deepseek/deepseek-v4.1-flash',
    vendor: 'DeepSeek',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.035, cachedInputPerMillion: 0.001, outputPerMillion: 0.29 },
    pricingSource:
      'OpenRouter catalog base price, verified 2026-09-28. The latency-sorted endpoint billed ~$0.00025 per coach reply, about 2x this rate; billed usage.cost wins when returned.',
  },
  'google-tts-neural2': {
    id: 'google-tts-neural2',
    vendor: 'Google Cloud Text-to-Speech',
    access: 'google-direct',
    characterPricingPerMillion: 16,
    pricingNote:
      'Billed $16 per 1M characters (Neural2 tier). Results are cached by SHA-1 of voice+text.',
    pricingSource: 'Google Cloud TTS Neural2 list price; matches synthesizeSpeech cost constant.',
  },
  // Practice-mode examiner voice candidates, all reached through OpenRouter's
  // /api/v1/audio/speech endpoint. Gemini TTS is billed per token (text in,
  // audio out at ~25 tokens per second); the others are billed per character.
  'google/gemini-3.8-flash-lite-tts': {
    id: 'google/gemini-3.8-flash-lite-tts',
    vendor: 'Google',
    access: 'openrouter',
    pricing: { inputPerMillion: 0.5, cachedInputPerMillion: 0.5, outputPerMillion: 6 },
    pricingSource:
      'OpenRouter catalog price (Google AI Studio), verified 2026-09-28. Google lists this as an introductory rate through 2026-12-31; it doubles to $1/$12 after. Output is audio tokens.',
  },
  'gemini-3.8-flash-lite-tts': {
    id: 'gemini-3.8-flash-lite-tts',
    vendor: 'Google',
    access: 'google-direct',
    pricing: { inputPerMillion: 0.5, cachedInputPerMillion: 0.5, outputPerMillion: 6 },
    pricingSource:
      'Google AI list price, verified 2026-09-28. Introductory rate through 2026-12-31, then $1/$12. Output is audio tokens (~25 per second of speech).',
  },
};

// Reading assistance uses the smaller measured model only for the two actions
// where it preserved the learner-facing contract. Translation and Breakdown
// stay on 120B after 20B reversed an Urdu quantity and omitted hard structures.
// Exporting the ids keeps the Edge Function, benchmark, pricing, and route map
// on one source of truth.
export const READING_ASSISTANT_PRIMARY_MODEL = 'openai/gpt-oss-120b';
export const READING_ASSISTANT_FAST_MODEL = 'openai/gpt-oss-20b';
export const READING_ASSISTANT_LUNA_FALLBACK_MODEL = 'openai/gpt-6-luna';
export const READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL = 'deepseek/deepseek-v4-flash-0731';
export const READING_ASSISTANT_GLM_FALLBACK_MODEL = 'z-ai/glm-5.3-flash';
// Backwards-compatible alias for callers that only need the first fallback.
export const READING_ASSISTANT_FALLBACK_MODEL = READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL;
export const AI_COACH_PRIMARY_MODEL = 'openai/gpt-oss-120b';
export const AI_COACH_FALLBACK_MODEL = 'openai/gpt-6-luna';
// Worst-case full-context primary + fallback usage costs about $0.00348 at
// registered rates, below the $0.005 per-request reservation in ai_coach settings.
export const AI_COACH_MAX_OUTPUT_TOKENS = 1_800;

// Vocabulary cards write Bangla and other learner languages, which is the work
// Reading Translate keeps on 120B, so the same chain applies here.
export const VOCAB_DEFINE_PRIMARY_MODEL = READING_ASSISTANT_PRIMARY_MODEL;
export const VOCAB_DEFINE_LUNA_FALLBACK_MODEL = READING_ASSISTANT_LUNA_FALLBACK_MODEL;
export const VOCAB_DEFINE_DEEPSEEK_FALLBACK_MODEL = READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL;
export const VOCAB_DEFINE_GLM_FALLBACK_MODEL = READING_ASSISTANT_GLM_FALLBACK_MODEL;
export const VOCAB_DEFINE_MAX_OUTPUT_TOKENS = 900;

export function readingAssistantPrimaryModel(action: string) {
  return action === 'dictionary' || action === 'simplify'
    ? READING_ASSISTANT_FAST_MODEL
    : READING_ASSISTANT_PRIMARY_MODEL;
}
export const WRITING_PRIMARY_MODEL = 'openai/gpt-6-luna';
export const WRITING_DIRECT_GEMINI_MODEL = 'gemini-2.5-flash';
export const SPEAKING_DETAILED_FEEDBACK_PRIMARY_MODEL = 'openai/gpt-6-luna';
export const SPEAKING_DETAILED_FEEDBACK_FALLBACK_MODEL = 'gemini-2.5-flash';
// 7168 leaves room for the per-answer issue/focus/why tags (about 40 tokens
// each) on a full three-part test without truncating the JSON array.
export const SPEAKING_DETAILED_FEEDBACK_MAX_OUTPUT_TOKENS = 7168;
export const SPEAKING_DETAILED_FEEDBACK_TIMEOUT_MS = 25000;

// --- Routes -----------------------------------------------------------------

export const AI_ROUTES: AiRoute[] = [
  {
    id: 'admin-reading-draft',
    surface:
      'Admin: import Reading passages, questions and grounded explanations from text/screenshots',
    file: 'supabase/functions/admin-reading-draft/index.ts',
    maxOutputTokens: 28000,
    timeoutMs: 60000,
    steps: [
      {
        model: 'openai/gpt-6-luna',
        role: 'primary',
        reasoningEffort: 'none',
        when: 'Admin-only preview generation; supports text and screenshots.',
      },
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'fallback',
        reasoningEffort: 'low',
        when: 'Luna fails or its output fails passage, answer-key or schema checks; one attempt only.',
      },
    ],
    notes:
      'Optional key: infer answers from passage when absent, review before saving. At most 28,000 output tokens for full source transcription plus explanations; no test writes. Luna disables reasoning; GLM requires low reasoning. OpenRouter transport. At most eight compressed images; insert-only inactive draft save.',
  },
  {
    id: 'admin-listening-draft',
    surface:
      'Admin: import Listening audioscripts, questions and grounded explanations from text/screenshots',
    file: 'supabase/functions/admin-listening-draft/index.ts',
    maxOutputTokens: 28000,
    timeoutMs: 60000,
    steps: [
      {
        model: 'openai/gpt-6-luna',
        role: 'primary',
        reasoningEffort: 'none',
        when: 'Admin-only preview generation; supports text and screenshots.',
      },
      {
        model: 'z-ai/glm-5.3-flash',
        role: 'fallback',
        reasoningEffort: 'low',
        when: 'Luna fails or its output fails transcript, answer-key or schema checks; one attempt only.',
      },
    ],
    notes:
      'Optional key: infer answers from transcript when absent, review before saving. At most 28,000 output tokens for full transcription plus explanations; no test writes. Luna disables reasoning; GLM requires low reasoning. OpenRouter transport. At most eight compressed images; insert-only inactive draft save.',
  },
  {
    id: 'personalized-ai-coach',
    surface: 'Learner panel: personalized IELTS AI Coach',
    file: 'supabase/functions/ai-coach/index.ts',
    maxOutputTokens: AI_COACH_MAX_OUTPUT_TOKENS,
    timeoutMs: 20000,
    steps: [
      {
        model: AI_COACH_PRIMARY_MODEL,
        role: 'primary',
        when: 'One grounded, schema-validated coaching reply after deterministic evidence retrieval.',
      },
      {
        model: AI_COACH_FALLBACK_MODEL,
        role: 'fallback',
        when: 'The primary call fails or returns unsupported evidence/actions; no further repair chain.',
      },
    ],
    notes:
      'Feature-gated. Input is capped at 6,000 tokens, output at 1,800 tokens, and the shared provider budget is $3 per UTC day. The 1,800-token limit keeps the full primary-plus-fallback worst case below the $0.005 reservation. The primary call may stream (same model, same cost); only the fallback is never streamed. A reply may also carry up to three short learner-memory notes, a few dozen output tokens inside the same cap. The system prompt and the prompt key order keep the stable prefix first so the provider can cache it.',
  },
  {
    id: 'writing-detailed-feedback',
    surface: 'Writing: detailed essay feedback',
    file: 'supabase/functions/generateDetailedFeedback/index.ts',
    maxOutputTokens: 4096,
    steps: [
      {
        model: WRITING_PRIMARY_MODEL,
        role: 'primary',
        when: 'Adaptive marking whenever OPENROUTER_API_KEY is set: one seeded pass, a second only when the marker called a criterion borderline or the band sits on a rounding edge, a third only to break a one-band disagreement. The per-criterion median becomes the reported band, and billed tokens cover every pass that returned.',
      },
      {
        model: WRITING_DIRECT_GEMINI_MODEL,
        role: 'fallback',
        when: 'Every Luna pass errored or returned no parsable feedback. Calls Google directly with a single pass, so the report carries sampleCount 1.',
      },
      {
        model: WRITING_DIRECT_GEMINI_MODEL,
        role: 'repair',
        when: 'One bounded retry on malformed Gemini JSON, at the same temperature so the repair cannot change the band.',
      },
    ],
  },
  {
    id: 'writing-band-8-comparison',
    surface: 'Writing Practice: optional Band 8 example comparison',
    file: 'supabase/functions/writing-coach/index.ts',
    maxOutputTokens: 3000,
    steps: [
      {
        model: WRITING_PRIMARY_MODEL,
        role: 'primary',
        when: 'One requested transformation of a saved practice answer; cached per original session part.',
      },
    ],
    notes:
      'One generation per session part. Server budget reservation is $0.005 and shared daily cap is $3.',
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
        when: 'One retry at temperature 0 on malformed JSON when the alternate provider was not already attempted.',
      },
      {
        model: 'deepseek/deepseek-v4-flash-0731',
        role: 'fallback',
        when: 'Transcript-only Gemini scoring is rate-limited, unavailable, times out, or exhausts its JSON repair attempt.',
      },
    ],
    notes:
      'Routing decided in _shared/speakingEvaluationProvider.ts; every accepted provider response must satisfy the same strict IELTS scoring schema, and routingReason is persisted per attempt.',
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
    maxOutputTokens: SPEAKING_DETAILED_FEEDBACK_MAX_OUTPUT_TOKENS,
    timeoutMs: SPEAKING_DETAILED_FEEDBACK_TIMEOUT_MS,
    steps: [
      {
        model: SPEAKING_DETAILED_FEEDBACK_PRIMARY_MODEL,
        role: 'primary',
        when: 'OpenRouter primary; no temperature, reasoning disabled, and validate the grounded JSON array.',
      },
      {
        model: SPEAKING_DETAILED_FEEDBACK_FALLBACK_MODEL,
        role: 'fallback',
        when: 'Direct Google Gemini when Luna fails, returns invalid JSON/schema, or yields no transcript-grounded entries.',
      },
    ],
    notes:
      'Luna request timeout is 25s; Gemini retries one transient provider failure with 15s per attempt. Both providers share the same output and grounding validation.',
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
        model: READING_ASSISTANT_FAST_MODEL,
        role: 'primary',
        when: 'Dictionary and Simplify only: GPT OSS 20B first through OpenRouter with low reasoning and the validated JSON contract.',
      },
      {
        model: READING_ASSISTANT_PRIMARY_MODEL,
        role: 'primary',
        when: 'Translate and Breakdown use GPT OSS 120B first. It is also the first fallback when the 20B Dictionary or Simplify attempt is unavailable or invalid.',
      },
      {
        model: READING_ASSISTANT_LUNA_FALLBACK_MODEL,
        role: 'fallback',
        when: 'GPT OSS is unavailable or invalid; use the Luna fallback route.',
      },
      {
        model: READING_ASSISTANT_DEEPSEEK_FALLBACK_MODEL,
        role: 'fallback',
        when: 'GPT OSS and Luna are unavailable or invalid; try DeepSeek Flash.',
      },
      {
        model: READING_ASSISTANT_GLM_FALLBACK_MODEL,
        role: 'fallback',
        when: 'All earlier providers are unavailable or invalid; use GLM with low reasoning as the last resort.',
      },
    ],
    notes:
      'Dictionary sends the selected word with its own sentence and caches on that pair, shared by every learner. Exam mode is server-blocked; completed review is allowed. Dictionary/Simplify use GPT OSS 20B -> GPT OSS 120B -> Luna -> DeepSeek -> GLM. Translate/Breakdown use GPT OSS 120B -> Luna -> DeepSeek -> GLM. Every attempt in the chain is billed, so rejected answers are charged to the daily budget too.',
  },
  {
    id: 'vocab-define',
    surface:
      'Vocabulary: AI word card (meaning, Bangla, IPA, examples) for Quick Add and enrichment',
    file: 'supabase/functions/vocab-define/index.ts',
    maxOutputTokens: VOCAB_DEFINE_MAX_OUTPUT_TOKENS,
    timeoutMs: 8000,
    steps: [
      {
        model: VOCAB_DEFINE_PRIMARY_MODEL,
        role: 'primary',
        when: 'GPT OSS 120B through OpenRouter with low reasoning and the validated JSON contract. Bengali and other non-Latin scripts are checked on output.',
      },
      {
        model: VOCAB_DEFINE_LUNA_FALLBACK_MODEL,
        role: 'fallback',
        when: '120B is unavailable or returns an invalid card (including a translation in the wrong script).',
      },
      {
        model: VOCAB_DEFINE_DEEPSEEK_FALLBACK_MODEL,
        role: 'fallback',
        when: '120B and Luna are unavailable or invalid.',
      },
      {
        model: VOCAB_DEFINE_GLM_FALLBACK_MODEL,
        role: 'fallback',
        when: 'All earlier providers are unavailable or invalid; GLM with low reasoning is the last resort.',
      },
    ],
    notes:
      'One card per word, learner language (any of the 24 the Vocabulary page offers) and saved sense, cached in ai_feedback_cache for 90 days and shared by every learner. Limits live in vocab_assistant_private.settings: 12 requests/min, 25 (Free) or 150 (Pro/Premium) fresh generations per UTC day, 400 cache hits per day, 2 concurrent, and a shared USD 3 daily budget that pauses new generation but still serves cached cards. IPA prefers a real dictionary phonetic over the model. Every attempt in the chain is billed, so rejected answers are charged to the budget too.',
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
        when: 'Copilot prepares up to three review drafts per check, or an admin requests a rewrite.',
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
    id: 'retention-autopilot-priority',
    surface: 'Admin Marketing: rank validated actions for approval',
    file: 'supabase/functions/retention-autopilot/index.ts',
    maxOutputTokens: 300,
    timeoutMs: 12000,
    steps: [
      { model: 'z-ai/glm-5.3-flash', role: 'primary', when: 'Eligible actions await an AI draft.' },
      { model: 'deepseek-v4-flash', role: 'fallback', when: 'OpenRouter failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'fallback', when: 'GLM and direct DeepSeek failed.' },
      { model: 'gemini-2.5-flash-lite', role: 'repair', when: 'One retry on malformed JSON.' },
    ],
    notes:
      'Selects up to three existing action IDs. Eligibility, recipients, channel and delivery remain server-controlled; approval is required.',
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
        model: 'google-tts-neural2',
        role: 'primary',
        when: 'GOOGLE_TTS_API_KEY present. Default voice en-GB-Neural2-C.',
      },
    ],
  },
  {
    id: 'practice-text-to-speech',
    surface: 'Speaking exam: regional Gemini examiner voices; practice: Gemini coach voice',
    file: 'supabase/functions/synthesizePracticeSpeech/index.ts',
    timeoutMs: 20000,
    steps: [
      {
        model: 'gemini-3.8-flash-lite-tts',
        role: 'primary',
        when: 'Exam mode uses four server-allowlisted regional Gemini Voice Library voices: British female and male, Australian male, and American female. All fixed exam lines are cached in R2.',
      },
      {
        model: 'gemini-3.8-flash-lite-tts',
        role: 'primary',
        when: 'Practice requires PRACTICE_TTS_ROLLOUT. With GEMINI_API_KEY, speech streams from Google using voice Sulafat. Measured 2026-09-28: first audio ~1.2s, a sentence done in ~1.9s.',
      },
      {
        model: 'google/gemini-3.8-flash-lite-tts',
        role: 'fallback',
        when: 'Practice mode uses the same model through OpenRouter when GEMINI_API_KEY is missing or the browser did not ask for a stream, if OPENROUTER_API_KEY is set. Whole clip, ~4-5s.',
      },
      {
        model: 'google-tts-neural2',
        role: 'fallback',
        when: 'Practice only: R2 or the selected provider key is missing, the practice rollout excludes the learner, or the provider refuses. Exam mode does not fall back to Neural2.',
      },
    ],
    notes:
      'Exam Gemini WAV is cached in R2 under tts-cache/exam-gemini/v1; practice Gemini WAV under tts-cache/practice/v1. Keys include model, voice, style and text. All exam lines are cacheable; practice coach replies over 200 characters are not. The /tts-cache/* CDN rule covers both.',
  },
  {
    id: 'practice-coach',
    surface: 'Speaking practice mode: spoken coach reply after each answer',
    file: 'supabase/functions/_shared/practiceCoach.ts',
    maxOutputTokens: 400,
    timeoutMs: 7000,
    steps: [
      {
        model: 'deepseek/deepseek-v4.1-flash',
        role: 'primary',
        when: 'PRACTICE_COACH_ROLLOUT allows the learner and the turn is a real answer (advances, completes the part, or missed the question and is asked again). Runs in parallel with the turn decision, up to 4s. Measured median ~1.2s, ~$0.00025 a reply (measured with the earlier notes schema; the spoken-only reply is smaller).',
      },
      {
        model: 'openai/gpt-6-luna',
        role: 'fallback',
        when: 'V4.1 Flash fails, times out or returns an invalid reply; gets the remaining 3s or more. No temperature (Luna rejects it). Measured median ~2.9s, ~$0.00012 a reply.',
      },
    ],
    notes:
      'The reply is spoken only; there is no written card. If the coach is off or every model fails, the scripted coaching line for the turn decision is spoken instead. The next question always comes from the question bank, never from the model.',
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

/** USD cost of synthesizing `characters` with a per-character speech model. Unknown models cost 0. */
export function estimateCharacterCostUsd(model: string, characters: number): number {
  const perMillion = MODELS[model]?.characterPricingPerMillion;
  if (!perMillion) return 0;
  return Number(((Math.max(0, characters) * perMillion) / 1_000_000).toFixed(6));
}

/** Every route a given model appears in, with its role. Used by `npm run ai:models`. */
export function routesUsingModel(model: string) {
  return AI_ROUTES.flatMap((route) =>
    route.steps
      .filter((step) => step.model === model)
      .map((step) => ({ route: route.id, surface: route.surface, role: step.role }))
  );
}
