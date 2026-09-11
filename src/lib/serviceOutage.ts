/**
 * Service Outage Classification & Global Outage State
 *
 * When Supabase (auth, database, or edge functions) is unreachable, the user
 * must never be shown a message that blames them or their account. This module
 * is the single place that decides "is this failure ours or theirs?" so every
 * surface — login, admin login, the app shell, checkout — tells the same story.
 *
 * Rules:
 *  - A transport failure, a 5xx, a timeout, or an HTML error page parsed as
 *    JSON is OUR problem: say so plainly and keep the user's trust.
 *  - Only an explicit credential rejection from the auth service is the user's
 *    problem.
 */

export const SERVICE_ERROR = {
  /** The browser itself has no network. The OfflineBanner owns this case. */
  OFFLINE: 'offline',
  /** Our backend is unreachable or erroring. Never blame the user. */
  OUTAGE: 'outage',
  /** Explicit 429 / auth throttle. */
  RATE_LIMIT: 'rate_limit',
  /** The auth service answered and rejected the credentials. */
  CREDENTIALS: 'credentials',
  /** The auth service answered; the account needs email confirmation. */
  EMAIL_UNCONFIRMED: 'email_unconfirmed',
  /** Answered, but not a case we recognise. */
  UNKNOWN: 'unknown',
} as const;

export type ServiceErrorKind = (typeof SERVICE_ERROR)[keyof typeof SERVICE_ERROR];

/** Copy used wherever an outage is surfaced. Same words everywhere, on purpose. */
export const OUTAGE_COPY = {
  title: "We're having trouble connecting",
  /** The load-bearing sentence: it stops password resets and support tickets. */
  body: "This is a problem on our side — your account is fine. We're working on it.",
  bannerTitle: 'Connection problems',
  bannerBody: 'Some features may not work right now. This is on our end, not your account.',
  /** For a user who has already paid. Never let them think the money vanished. */
  payment:
    "Your payment went through. We just can't confirm it right now because of a temporary problem on our side — do not pay again. Your access will unlock automatically, usually within a few minutes.",
  checkout:
    "We couldn't start checkout because of a temporary problem on our side. You have not been charged. Please try again in a moment.",
} as const;

const OUTAGE_PATTERNS = [
  /failed to fetch/i,
  /fetch failed/i,
  /load failed/i, // Safari's transport failure
  /network\s*(request)?\s*(error|failed)/i,
  /networkerror/i,
  /connection (refused|reset|closed)/i,
  /econn(refused|reset|aborted)/i,
  /timed? ?out/i,
  /service unavailable/i,
  /bad gateway/i,
  /gateway time-?out/i,
  /upstream (connect|request)/i,
  /temporarily unavailable/i,
  /database is not available/i,
  /internal server error/i,
];

/**
 * A gateway that is down answers with an HTML error page. `response.json()`
 * then throws a SyntaxError whose message is pure noise to a user. Treat those
 * as an outage rather than leaking "Unexpected token '<'" into the UI.
 */
const HTML_INSTEAD_OF_JSON_PATTERNS = [
  /unexpected token '?</i,
  /unexpected token .?<.? .*is not valid json/i,
  /is not valid json/i,
  /<!doctype/i,
  /json\.parse/i,
];

const CREDENTIAL_PATTERNS = [
  /invalid login credentials/i,
  /invalid email or password/i,
  /invalid credentials/i,
  /wrong password/i,
  /user not found/i,
];

/**
 * Read an HTTP status off an error.
 *
 * Bounded to 100-599 on purpose: Postgres puts SQLSTATE values in `code`
 * (23505 for a unique violation, 42501 for an RLS denial), and treating those
 * as ">= 500" would misreport ordinary constraint errors as an outage.
 */
const readStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { status?: unknown; statusCode?: unknown; code?: unknown };
  for (const value of [candidate.status, candidate.statusCode, candidate.code]) {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (
      typeof numeric === 'number' &&
      Number.isFinite(numeric) &&
      numeric >= 100 &&
      numeric <= 599
    ) {
      return numeric;
    }
  }
  return null;
};

const readMessage = (error: unknown): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'object') {
    const candidate = error as { message?: unknown; error_description?: unknown; name?: unknown };
    return [candidate.name, candidate.message, candidate.error_description]
      .filter((part) => typeof part === 'string')
      .join(': ');
  }
  return '';
};

const isBrowserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * Decide whether a failure is ours, theirs, or a throttle.
 *
 * @param error Anything thrown by a Supabase call, a fetch, or an edge function.
 */
export const classifyServiceError = (error: unknown): ServiceErrorKind => {
  if (isBrowserOffline()) return SERVICE_ERROR.OFFLINE;

  const status = readStatus(error);
  const message = readMessage(error);

  if (status === 429 || /too many requests|rate limit/i.test(message)) {
    return SERVICE_ERROR.RATE_LIMIT;
  }

  // An aborted request is our timeout guard firing, not a user mistake.
  if (error instanceof Error && error.name === 'AbortError') return SERVICE_ERROR.OUTAGE;

  if (status !== null && status >= 500) return SERVICE_ERROR.OUTAGE;

  // A bare TypeError from fetch means the request never reached the server.
  if (error instanceof TypeError) return SERVICE_ERROR.OUTAGE;

  if (error instanceof SyntaxError && HTML_INSTEAD_OF_JSON_PATTERNS.some((p) => p.test(message))) {
    return SERVICE_ERROR.OUTAGE;
  }

  if (OUTAGE_PATTERNS.some((pattern) => pattern.test(message))) return SERVICE_ERROR.OUTAGE;
  if (HTML_INSTEAD_OF_JSON_PATTERNS.some((pattern) => pattern.test(message))) {
    return SERVICE_ERROR.OUTAGE;
  }

  if (/email not confirmed/i.test(message)) return SERVICE_ERROR.EMAIL_UNCONFIRMED;
  if (CREDENTIAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return SERVICE_ERROR.CREDENTIALS;
  }

  return SERVICE_ERROR.UNKNOWN;
};

/** True when the failure is ours and the user deserves a reassuring message. */
export const isServiceOutageError = (error: unknown) =>
  classifyServiceError(error) === SERVICE_ERROR.OUTAGE;

// ─── Global outage state ─────────────────────────────────────────────────────
// Any surface that catches an outage reports it here; the app-shell banner
// subscribes. A plain observable keeps this usable from services that have no
// React context (User.ts, edge-function helpers, route loaders).

export type ServiceOutageState = {
  /** Epoch ms of the first unrecovered failure, or null when healthy. */
  since: number | null;
  /** Where the failure was first seen — used for debugging, not shown to users. */
  source: string | null;
};

let state: ServiceOutageState = { since: null, source: null };
const listeners = new Set<(next: ServiceOutageState) => void>();

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.warn('[serviceOutage] listener failed:', err);
    }
  });
};

export const getServiceOutageState = (): ServiceOutageState => state;

export const subscribeToServiceOutage = (listener: (next: ServiceOutageState) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Flag a backend outage. Repeat calls keep the original `since` timestamp. */
export const reportServiceOutage = (source = 'unknown') => {
  if (state.since !== null) return;
  state = { since: Date.now(), source };
  emit();
};

/** Clear the outage flag after any successful backend call. */
export const reportServiceRecovered = () => {
  if (state.since === null) return;
  state = { since: null, source: null };
  emit();
};

/**
 * Report an error only when it is genuinely ours, and clear the flag otherwise.
 * Returns the classification so callers can branch on it in one step.
 */
export const trackServiceError = (error: unknown, source = 'unknown'): ServiceErrorKind => {
  const kind = classifyServiceError(error);
  if (kind === SERVICE_ERROR.OUTAGE) reportServiceOutage(source);
  return kind;
};

/** Reset between tests. Not used by application code. */
export const __resetServiceOutageForTests = () => {
  state = { since: null, source: null };
  listeners.clear();
};

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  (window as any).__reportServiceOutage = reportServiceOutage;
  (window as any).__reportServiceRecovered = reportServiceRecovered;
}
