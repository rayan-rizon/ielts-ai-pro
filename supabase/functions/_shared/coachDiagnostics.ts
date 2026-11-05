import { TextAiProviderError } from './textAiProvider.ts';

export const billedCost = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.estimatedProviderCostUsd || 0 : 0;
export const billedTokens = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.tokensUsed || 0 : 0;
export const hasKnownBilledCost = (error: unknown) =>
  error instanceof TextAiProviderError && typeof error.usage?.estimatedProviderCostUsd === 'number';

type Settlement = { cost: number; tokens: number };
export function successfulCoachUsage(
  generated: any,
  attempts: unknown[],
  reservationCost: number
): Settlement {
  const measuredCost =
    generated.usage.estimatedProviderCostUsd +
    attempts.reduce<number>((sum, error) => sum + billedCost(error), 0);
  const unknownCost = attempts.some((error) => !hasKnownBilledCost(error));
  return {
    cost: unknownCost ? Math.max(reservationCost, measuredCost) : measuredCost,
    tokens:
      generated.usage.tokensUsed +
      attempts.reduce<number>((sum, error) => sum + billedTokens(error), 0),
  };
}

export function failedCoachUsage(input: {
  settlement: Settlement | null;
  attempts: unknown[];
  error: unknown;
  providerCallCount: number;
}) {
  if (input.settlement) return input.settlement;
  const attempts = input.attempts.includes(input.error)
    ? input.attempts
    : [...input.attempts, input.error];
  const unknownCost = attempts.filter(hasKnownBilledCost).length < input.providerCallCount;
  return {
    cost: unknownCost ? null : attempts.reduce<number>((sum, error) => sum + billedCost(error), 0),
    tokens: attempts.reduce<number>((sum, error) => sum + billedTokens(error), 0),
  };
}

const ERROR_CODES = new Set([
  'timeout',
  'http_error',
  'malformed_json',
  'invalid_schema',
  'empty_content',
  'stream_error',
  'network_error',
  'provider_not_configured',
]);
type Attempt = { model: string; code: string; status: number | null; latencyMs: number };

// Bounded metadata only: never retain prompts, generated text or raw error messages.
export class CoachDiagnostics {
  stage = 'context';
  model = '';
  private started = Date.now();
  private attempts: Attempt[] = [];

  async attempt<T>(
    stage: 'primary' | 'fallback',
    model: string,
    run: () => Promise<T>
  ): Promise<T> {
    this.stage = stage;
    this.model = model;
    const started = Date.now();
    let code = 'ok';
    let status: number | null = null;
    try {
      return await run();
    } catch (error) {
      code =
        error instanceof TextAiProviderError && ERROR_CODES.has(error.code)
          ? error.code
          : 'provider_error';
      status = error instanceof TextAiProviderError ? error.status : null;
      throw error;
    } finally {
      if (this.attempts.length < 2)
        this.attempts.push({ model, code, status, latencyMs: Date.now() - started });
    }
  }

  snapshot(failed = false) {
    return {
      model: this.model,
      latency: Date.now() - this.started,
      diagnostics: {
        stage: this.stage,
        code: failed
          ? this.stage === 'finalize'
            ? 'database_error'
            : this.attempts.at(-1)?.code || 'internal_error'
          : 'ok',
        attempts: this.attempts,
      },
    };
  }
}
