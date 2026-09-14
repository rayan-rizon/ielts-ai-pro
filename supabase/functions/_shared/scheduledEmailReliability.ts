export type ScheduledRunState = {
  status?: string | null;
  started_at?: string | null;
};

type DatabaseResult<T> = { data: T | null; error: any };

const DEFAULT_STALE_AFTER_MS = 30 * 60 * 1000;

export function isRetryableScheduledRun(
  run: ScheduledRunState,
  now = new Date(),
  staleAfterMs = DEFAULT_STALE_AFTER_MS
) {
  if (run.status === 'failed') return true;
  if (run.status !== 'running' || !run.started_at) return false;
  const startedAt = new Date(run.started_at).getTime();
  return Number.isFinite(startedAt) && now.getTime() - startedAt >= staleAfterMs;
}

export function buildScheduledEmailIdempotencyKey(
  scheduledFor: string,
  emailType: string,
  learnerId: string
) {
  return `scheduled/${scheduledFor}/${emailType}/${learnerId}`;
}

function isTransientDatabaseError(error: any) {
  const status = Number(error?.status || error?.statusCode || 0);
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || error || '').toLowerCase();
  return (
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    ['57014', '57p01', '57p02', '57p03'].includes(code) ||
    /gateway timeout|timed? out|connection (?:closed|reset|terminated)|fetch failed|temporarily unavailable/.test(
      message
    )
  );
}

export async function retryTransientDatabaseOperation<T>(
  operation: () => PromiseLike<DatabaseResult<T>>,
  { delaysMs = [250, 750] }: { delaysMs?: number[] } = {}
): Promise<DatabaseResult<T>> {
  for (let attempt = 0; ; attempt += 1) {
    const result = await operation();
    if (!result.error || !isTransientDatabaseError(result.error) || attempt >= delaysMs.length) {
      return result;
    }
    const delayMs = Math.max(0, delaysMs[attempt] || 0);
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
