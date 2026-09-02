const RATE_LIMIT_CODES = new Set(['over_request_rate_limit', 'rate_limit_exceeded']);

/**
 * Supabase returns a 429 (and usually an `over_request_rate_limit` code) for
 * real Auth throttling. Invalid credentials are expected authentication
 * failures and must not create a client-side cooldown.
 */
export function isAuthRateLimitError(error) {
  if (!error) return false;

  const status = Number(error.status);
  const code = String(error.code || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();

  return (
    status === 429 ||
    RATE_LIMIT_CODES.has(code) ||
    /too many requests|rate limit|over request limit/.test(message)
  );
}

export function getAuthRateLimitWaitSeconds(error, fallbackSeconds = 60) {
  const message = String(error?.message || '');
  const match = message.match(/(?:wait|try again in)\s+(\d+)\s*(?:seconds?|secs?)/i);
  return match ? Math.max(1, Number(match[1])) : fallbackSeconds;
}
