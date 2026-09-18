/**
 * GA4 Measurement Protocol — server-side `purchase` reporting.
 *
 * WHY THIS EXISTS
 * ---------------
 * The browser is not a reliable place to report revenue. The client-side
 * `subscription_purchase` event only fires when the payer's browser actually
 * reaches `/subscription/success` and finishes running React. A closed tab, a
 * dropped redirect, a blocked tag, or a payment that completes on a different
 * device all produce a real charge that GA4 never hears about — which is why
 * the `Ielts Ai Pro (web) purchase` conversion in Google Ads sat on
 * "Awaiting conversions" while Stripe had settled payments.
 *
 * Stripe's webhook is the opposite: it is retried until acknowledged, and the
 * `handle_stripe_event` RPC claims each event exactly once. Reporting from
 * there means every settled payment is counted, once.
 *
 * ATTRIBUTION
 * -----------
 * Measurement Protocol attributes an event to an existing GA4 session when it
 * carries that session's `client_id` and `session_id`. Those are captured in
 * the browser at checkout time and carried through Stripe Checkout metadata,
 * so a purchase lands on the session that actually produced it — preserving
 * the campaign, gclid and source GA4 already recorded for that session.
 *
 * When no client id was captured (older sessions, a blocked GA cookie, or a
 * manually-approved bKash payment with no checkout hop), the purchase is still
 * reported under a deterministic synthetic client id derived from the user id.
 * That revenue shows as unattributed rather than vanishing — for a business
 * deciding where to spend, a known-unattributed sale beats a missing one.
 *
 * SAFETY
 * ------
 * - Completely inert until BOTH `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are
 *   set. No secret means no network call and no behaviour change at all.
 * - Never throws. Analytics must not be able to fail a payment webhook, so
 *   every path resolves to a result object and errors are logged, not raised.
 * - Bounded by a timeout so a slow Google endpoint cannot stall the webhook.
 *
 * DOUBLE-COUNTING
 * ---------------
 * GA4 does NOT deduplicate events by `transaction_id`. This sender is designed
 * to be the ONLY producer of the GA4 `purchase` event. The browser stops
 * pushing `subscription_purchase` to the dataLayer once the client is built
 * with `VITE_GA4_SERVER_PURCHASE=true`, which is the switch that hands
 * ownership over. Never enable this sender while the browser is still pushing
 * that event — see "Server-side purchase" in docs/google-analytics.md for the
 * ordered cutover.
 */

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const REQUEST_TIMEOUT_MS = 3000;

/** GA4 sets `_ga` as `GA1.1.<clientId>`; the client id itself is `<int>.<int>`. */
const CLIENT_ID_PATTERN = /^\d{1,20}\.\d{1,20}$/;
const SESSION_ID_PATTERN = /^\d{1,20}$/;

export interface Ga4PurchaseInput {
  /** GA4 client id captured in the browser (`<int>.<int>`). */
  clientId?: string | null;
  /** GA4 session id captured in the browser (unix seconds, digits only). */
  sessionId?: string | null;
  /** Stable, unique id for this payment. GA4 reports it as `transaction_id`. */
  transactionId: string;
  /** Amount actually charged, in major units (e.g. 14.99). */
  value: number;
  /** ISO-4217 code, e.g. `USD` or `BDT`. */
  currency: string;
  tier?: string | null;
  interval?: string | null;
  /** Public users.id — used for the synthetic fallback client id and user_id. */
  userId?: string | null;
  /** Where the payment came from, for debugging in DebugView. */
  source?: string;
}

export type Ga4PurchaseResult =
  { sent: true; clientId: string; attributed: boolean } | { sent: false; reason: string };

/**
 * Read an environment variable through `globalThis`.
 *
 * This module runs in Deno, but it is also imported by a Vitest suite that
 * type-checks under the app's browser tsconfig, where the `Deno` global is not
 * declared. Resolving it lazily off `globalThis` with a local shape keeps one
 * implementation correct in both places without widening the app's tsconfig to
 * cover `supabase/functions`.
 */
const readEnv = (key: string): string => {
  const denoEnv = (globalThis as { Deno?: { env?: { get(key: string): string | undefined } } }).Deno
    ?.env;
  return (denoEnv?.get(key) || '').trim();
};

const isConfigured = () => Boolean(readEnv('GA4_MEASUREMENT_ID') && readEnv('GA4_API_SECRET'));

const sanitizeClientId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  // Tolerate a full `_ga` cookie value being passed through by mistake.
  const stripped = trimmed.startsWith('GA1.') ? trimmed.split('.').slice(2).join('.') : trimmed;
  return CLIENT_ID_PATTERN.test(stripped) ? stripped : null;
};

const sanitizeSessionId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return SESSION_ID_PATTERN.test(trimmed) ? trimmed : null;
};

/**
 * A stable pseudo client id for payments with no captured GA4 session.
 *
 * GA4 requires a `client_id` on every Measurement Protocol hit. Deriving it
 * from the user id keeps repeat payments by the same person on one synthetic
 * "device" instead of inventing a new user per charge, which would inflate the
 * user count. The `.0` timestamp half marks it as synthetic on inspection.
 */
const syntheticClientId = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return `${hash}.0`;
};

/**
 * Report one settled payment to GA4 as a `purchase`.
 *
 * Resolves to a result object in every case, including misconfiguration and
 * network failure. It is safe to `await` inside a payment webhook.
 */
export async function sendGa4Purchase(input: Ga4PurchaseInput): Promise<Ga4PurchaseResult> {
  try {
    if (!isConfigured()) return { sent: false, reason: 'not_configured' };

    const { transactionId, value, currency } = input;

    if (!transactionId || typeof transactionId !== 'string') {
      return { sent: false, reason: 'missing_transaction_id' };
    }

    // A zero or malformed amount poisons revenue reporting and any bidding
    // strategy built on it. Drop the event rather than report a false price.
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return { sent: false, reason: 'invalid_value' };
    }

    const normalizedCurrency = String(currency || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      return { sent: false, reason: 'invalid_currency' };
    }

    const capturedClientId = sanitizeClientId(input.clientId);
    const sessionId = sanitizeSessionId(input.sessionId);
    const clientId =
      capturedClientId || (input.userId ? syntheticClientId(String(input.userId)) : null);

    if (!clientId) return { sent: false, reason: 'no_client_id' };

    const params: Record<string, unknown> = {
      transaction_id: transactionId,
      value: Number(numericValue.toFixed(2)),
      currency: normalizedCurrency,
      // GA4 suppresses session-scoped traffic-source attribution unless the
      // hit declares itself as coming from a real session.
      engagement_time_msec: 1,
    };

    if (sessionId) params.session_id = sessionId;
    if (input.tier) params.plan_tier = input.tier;
    if (input.interval) params.billing_interval = input.interval;
    if (input.source) params.purchase_source = input.source;

    const body: Record<string, unknown> = {
      client_id: clientId,
      // `timestamp_micros` is deliberately omitted: GA4 rejects backdated hits
      // older than 72h, and the webhook fires within seconds of the charge.
      non_personalized_ads: false,
      events: [{ name: 'purchase', params }],
    };

    if (input.userId) body.user_id = String(input.userId);

    const url =
      `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(readEnv('GA4_MEASUREMENT_ID'))}` +
      `&api_secret=${encodeURIComponent(readEnv('GA4_API_SECRET'))}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // Measurement Protocol answers 2xx with an empty body even for events it
      // silently discards; only transport-level failures are visible here.
      if (!response.ok) {
        console.warn(`[GA4] purchase rejected with HTTP ${response.status} (${transactionId})`);
        return { sent: false, reason: `http_${response.status}` };
      }

      console.log(
        `[GA4] purchase sent: ${transactionId} ${normalizedCurrency} ${numericValue} ` +
          `(attributed=${Boolean(capturedClientId)})`
      );
      return { sent: true, clientId, attributed: Boolean(capturedClientId) };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    // Analytics must never fail a payment webhook.
    console.warn('[GA4] purchase send failed:', error instanceof Error ? error.message : error);
    return { sent: false, reason: 'exception' };
  }
}

/** Exposed for tests. */
export const __testing = { sanitizeClientId, sanitizeSessionId, syntheticClientId, isConfigured };
