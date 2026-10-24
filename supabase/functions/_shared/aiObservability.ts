declare const Deno: any;

export type AiObservationContext = {
  traceId?: string;
  distinctId?: string;
};

type CaptureAiGenerationInput = {
  model: string;
  provider: string;
  promptTokens: number;
  outputTokens: number;
  maxOutputTokens?: number;
  temperature?: number;
  stream?: boolean;
  context?: AiObservationContext;
  error?: unknown;
};

const providerForModel = (model: string, fallback: string) => {
  const modelId = String(model || '')
    .trim()
    .toLowerCase();
  if (!modelId.includes('/')) return fallback;

  const prefix = modelId.split('/')[0];
  if (prefix === 'google' || prefix === 'gemini') return 'google';
  if (prefix === 'z-ai') return 'zai';
  return prefix || fallback;
};

const configurationError = (variable: string) =>
  new Error(
    `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variable} is configured`
  );

/** Sends one completed provider request to AI Observability without affecting the learner flow. */
export async function captureAiGeneration(input: CaptureAiGenerationInput) {
  const env = typeof Deno === 'undefined' ? null : Deno.env;
  if (!env) return;

  const projectToken = env.get('POSTHOG_API_KEY');
  const host = env.get('POSTHOG_HOST');

  if (!projectToken || !host) {
    if (!env.get('DENO_DEPLOYMENT_ID'))
      console.error(configurationError(projectToken ? 'POSTHOG_HOST' : 'POSTHOG_API_KEY'));
    return;
  }

  const traceId = input.context?.traceId || crypto.randomUUID();
  const distinctId = input.context?.distinctId || 'unattributed';
  const hasError = Boolean(input.error);
  const errorName = input.error instanceof Error ? input.error.name : 'provider_error';

  const properties: Record<string, unknown> = {
    $ai_trace_id: traceId,
    $ai_model: input.model,
    $ai_provider: providerForModel(input.model, input.provider),
    $ai_input_tokens: input.promptTokens,
    $ai_output_tokens: input.outputTokens,
    ...(input.maxOutputTokens === undefined ? {} : { $ai_max_tokens: input.maxOutputTokens }),
    ...(input.temperature === undefined ? {} : { $ai_temperature: input.temperature }),
    ...(input.stream ? { $ai_stream: true } : {}),
    ...(hasError ? { $ai_is_error: true, $ai_error: errorName } : {}),
  };

  // Keep prompts, essays, transcripts, and model replies out of PostHog. The app's
  // existing analytics policy captures only allowlisted, non-free-text properties.
  try {
    await fetch(new URL('/i/v0/e/', host), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1_500),
      body: JSON.stringify({
        api_key: projectToken,
        event: '$ai_generation',
        properties: { distinct_id: distinctId, ...properties },
      }),
    });
  } catch {
    // AI telemetry is best effort and must never interrupt a provider response.
  }
}
