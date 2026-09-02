import { Buffer } from 'node:buffer';
import process from 'node:process';

/**
 * Meta Conversions API relay.
 *
 * Browser-only Pixel delivery drops a large share of events to iOS/ITP, ad
 * blockers, and in-app browsers — and Instagram/Facebook in-app browsers are
 * where nearly all paid traffic lands. Sending the same conversion server-side
 * recovers those events. Each event carries the `event_id` the Pixel used, so
 * Meta deduplicates the pair into one conversion instead of double-counting.
 *
 * Required env: META_CAPI_ACCESS_TOKEN
 * Optional env: META_PIXEL_ID (defaults to the site pixel below),
 *               META_TEST_EVENT_CODE (set only while validating in Events Manager)
 */

const GRAPH_VERSION = 'v21.0';

// The pixel id is public (it ships in every page's HTML), so a hardcoded
// default is safe and removes one misconfiguration failure mode. Only the
// access token is a real secret.
const DEFAULT_PIXEL_ID = '991226963227159';

const ALLOWED_EVENTS = new Set([
  'CompleteRegistration',
  'Lead',
  'InitiateCheckout',
  'Purchase',
  'ViewContent',
  // Fired alongside Purchase for a new subscription — see COMPANION_PIXEL_EVENT
  // in src/lib/tracking.js for why it always represents a genuine new signup,
  // never a renewal.
  'Subscribe',
]);
/**
 * Only the production site may write to the dataset.
 *
 * The browser already refuses to call this relay off production, but that check
 * lives in code a developer can bypass with a stale build or a hand-rolled
 * request. Dev and preview events are what put `localhost` on the dataset as a
 * sending domain and drove the PageView/registration ratio far enough out of
 * range for Meta to flag the data quality, so the rule is enforced on both
 * sides.
 */
const MEASURED_HOSTS = new Set(['ieltsai.pro', 'www.ieltsai.pro']);

const requestHost = (req) => {
  // The Vercel proxy owns these headers. The event body is an untrusted browser
  // payload and must never decide which site can send measurement events.
  const forwarded = req.headers['x-forwarded-host'] || req.headers.host;
  if (typeof forwarded !== 'string') return null;
  return forwarded.split(',')[0].trim().split(':')[0];
};

const trustedEventSourceUrl = (value, host) => {
  if (typeof value !== 'string' || value.length === 0) return `https://${host}/`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.host !== host) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const hasTrustedOrigin = (req, host) => {
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || origin.length === 0) return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.host === host;
  } catch {
    return false;
  }
};

const COMMERCE_EVENTS = new Set(['InitiateCheckout', 'Purchase', 'Subscribe']);
const VALUE_EVENTS = new Set(['InitiateCheckout', 'Purchase', 'Subscribe']);
const COMMERCE_CURRENCIES = new Set(['USD', 'BDT']);

const SHA256_HEX = /^[a-f0-9]{64}$/;

const isSha256 = (value) => typeof value === 'string' && SHA256_HEX.test(value);

const clientIpFrom = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || null;
};

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length > 0) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const buildUserData = (body, req) => {
  const userData = {
    client_user_agent: req.headers['user-agent'] || undefined,
  };

  const ip = clientIpFrom(req);
  if (ip) userData.client_ip_address = ip;
  if (body.fbp) userData.fbp = body.fbp;
  // The click id is what actually ties a conversion back to a specific ad.
  if (body.fbc) userData.fbc = body.fbc;

  // Browser code canonicalizes and hashes before this request crosses the
  // serverless boundary. Passing hashes through prevents raw identity values
  // from reaching request logging while preserving Meta's required payload.
  if (body.user?.em) userData.em = [body.user.em];
  if (body.user?.external_id) userData.external_id = [body.user.external_id];

  return userData;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID;

  if (!accessToken) {
    // Measurement is not load-bearing for the user's request. Fail quietly with
    // a 204 so a missing token never surfaces as a client-side error, but log
    // loudly enough to be caught in deploy logs.
    console.warn('[meta-capi] META_CAPI_ACCESS_TOKEN is not configured');
    return res.status(204).end();
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const host = requestHost(req);
  if (!MEASURED_HOSTS.has(host)) {
    // Not an error the caller should retry or surface — the event is simply not
    // real traffic. 204 keeps dev consoles quiet.
    return res.status(204).end();
  }
  if (!hasTrustedOrigin(req, host)) {
    return res.status(403).json({ error: 'Cross-origin measurement requests are not allowed' });
  }
  const eventSourceUrl = trustedEventSourceUrl(body.event_source_url, host);
  if (!eventSourceUrl) {
    return res.status(400).json({ error: 'event_source_url must be a production HTTPS URL' });
  }

  const eventName = body.event_name;
  if (!ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({ error: 'Unsupported event_name' });
  }

  if (!body.event_id) {
    // Without a shared id the browser and server events cannot be deduplicated,
    // which would inflate reported conversions.
    return res.status(400).json({ error: 'event_id is required for deduplication' });
  }

  const user = body.user;
  if (
    user &&
    (Object.hasOwn(user, 'email') ||
      (user.em !== undefined && !isSha256(user.em)) ||
      (user.external_id !== undefined && !isSha256(user.external_id)))
  ) {
    return res.status(400).json({ error: 'user identifiers must be pre-hashed SHA-256 values' });
  }

  const isCommerceEvent = COMMERCE_EVENTS.has(eventName);
  const isValueEvent = VALUE_EVENTS.has(eventName);
  const value = Number(body.value);
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  if (
    isValueEvent &&
    (!Number.isFinite(value) || value <= 0 || !COMMERCE_CURRENCIES.has(currency))
  ) {
    return res.status(400).json({ error: 'Valid value and supported currency are required' });
  }

  const customData = {};
  if (isValueEvent) {
    customData.value = value;
    customData.currency = currency;
    if (isCommerceEvent) {
      if (Array.isArray(body.content_ids)) customData.content_ids = body.content_ids.map(String);
      if (body.content_name) customData.content_name = String(body.content_name);
      if (body.content_type) customData.content_type = String(body.content_type);
      if (Number.isFinite(Number(body.num_items))) customData.num_items = Number(body.num_items);
    }
  }

  const payload = {
    // Keep the credential in the TLS-protected request body rather than a URL,
    // which may be retained by CDN, proxy, and observability request logs.
    access_token: accessToken,
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(body.event_id),
        event_source_url: eventSourceUrl,
        action_source: 'website',
        user_data: buildUserData(body, req),
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
  };

  // Query param lets a specific request be routed into Events Manager's Test
  // Events tab for one-off QA without a redeploy. The env var is the durable
  // switch for a longer validation window; either can supply the code.
  const testEventCode = process.env.META_TEST_EVENT_CODE || req.query?.test_event_code;
  if (testEventCode) {
    payload.test_event_code = String(testEventCode);
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[meta-capi] Meta rejected the event:', response.status, detail);
      return res.status(502).json({ error: 'Upstream rejected the event' });
    }

    return res.status(202).json({ ok: true });
  } catch (error) {
    console.error('[meta-capi] Failed to deliver event:', error);
    return res.status(502).json({ error: 'Delivery failed' });
  }
}
