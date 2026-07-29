import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
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
]);

const sha256 = (value) =>
  crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');

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

  // Meta requires these identifiers to arrive pre-hashed.
  const email = body.user?.email;
  if (email) userData.em = [sha256(email)];

  const externalId = body.user?.external_id;
  if (externalId) userData.external_id = [sha256(externalId)];

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

  const eventName = body.event_name;
  if (!ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({ error: 'Unsupported event_name' });
  }

  if (!body.event_id) {
    // Without a shared id the browser and server events cannot be deduplicated,
    // which would inflate reported conversions.
    return res.status(400).json({ error: 'event_id is required for deduplication' });
  }

  const customData = {};
  if (typeof body.value === 'number' && Number.isFinite(body.value)) {
    customData.value = body.value;
    customData.currency = body.currency || 'USD';
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(body.event_id),
        event_source_url: body.event_source_url || undefined,
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
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

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
