/**
 * Server-side GA4 purchase sender (supabase/functions/_shared/ga4.ts).
 *
 * This module runs inside the Stripe webhook, so the bar is: it must never
 * throw, never report a price it cannot trust, and stay completely inert until
 * the GA4 credentials are deliberately configured.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let sendGa4Purchase;
let __testing;
let env;

const VALID = {
  transactionId: 'cs_live_abc123',
  value: 14.99,
  currency: 'USD',
  userId: 'user-uuid-1',
};

const configure = () => {
  env.GA4_MEASUREMENT_ID = 'G-GF63SJZ9ZJ';
  env.GA4_API_SECRET = 'test-secret';
};

const lastRequest = () => {
  const [url, init] = globalThis.fetch.mock.calls.at(-1);
  return { url, body: JSON.parse(init.body) };
};

beforeEach(async () => {
  env = {};
  // The module targets Deno; supply the only Deno surface it touches.
  globalThis.Deno = { env: { get: (key) => env[key] } };
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 }));

  vi.resetModules();
  ({ sendGa4Purchase, __testing } = await import('../../../supabase/functions/_shared/ga4.ts'));
});

afterEach(() => {
  delete globalThis.Deno;
  vi.restoreAllMocks();
});

describe('GA4 Measurement Protocol purchase sender', () => {
  describe('inertness before configuration', () => {
    it('makes no network call when no credentials are set', async () => {
      const result = await sendGa4Purchase(VALID);

      expect(result).toEqual({ sent: false, reason: 'not_configured' });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('stays inert when only the measurement id is set', async () => {
      env.GA4_MEASUREMENT_ID = 'G-GF63SJZ9ZJ';

      const result = await sendGa4Purchase(VALID);

      expect(result).toEqual({ sent: false, reason: 'not_configured' });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('refusing untrustworthy revenue', () => {
    beforeEach(configure);

    it.each([
      ['zero', 0],
      ['negative', -5],
      ['non-numeric', 'free'],
      ['missing', undefined],
    ])('drops a %s amount rather than reporting a false price', async (_label, value) => {
      const result = await sendGa4Purchase({ ...VALID, value });

      expect(result).toEqual({ sent: false, reason: 'invalid_value' });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('drops a malformed currency', async () => {
      const result = await sendGa4Purchase({ ...VALID, currency: 'US' });

      expect(result).toEqual({ sent: false, reason: 'invalid_currency' });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('drops an event with no transaction id', async () => {
      const result = await sendGa4Purchase({ ...VALID, transactionId: '' });

      expect(result).toEqual({ sent: false, reason: 'missing_transaction_id' });
    });
  });

  describe('attribution', () => {
    beforeEach(configure);

    it('sends the captured session so GA4 credits the visit that earned it', async () => {
      const result = await sendGa4Purchase({
        ...VALID,
        clientId: '1234567890.1699999999',
        sessionId: '1700000123',
        tier: 'premium',
        interval: 'monthly',
        source: 'stripe_checkout',
      });

      expect(result).toEqual({
        sent: true,
        clientId: '1234567890.1699999999',
        attributed: true,
      });

      const { url, body } = lastRequest();
      expect(url).toContain('measurement_id=G-GF63SJZ9ZJ');
      expect(url).toContain('api_secret=test-secret');
      expect(body.client_id).toBe('1234567890.1699999999');
      expect(body.user_id).toBe('user-uuid-1');
      expect(body.events).toHaveLength(1);
      expect(body.events[0].name).toBe('purchase');
      expect(body.events[0].params).toMatchObject({
        transaction_id: 'cs_live_abc123',
        value: 14.99,
        currency: 'USD',
        session_id: '1700000123',
        plan_tier: 'premium',
      });
    });

    it('still reports revenue as unattributed when GA never set a cookie', async () => {
      const result = await sendGa4Purchase(VALID);

      expect(result.sent).toBe(true);
      expect(result.attributed).toBe(false);
      expect(lastRequest().body.events[0].params.session_id).toBeUndefined();
    });

    it('keeps repeat payments by one person on a single synthetic client id', async () => {
      await sendGa4Purchase({ ...VALID, transactionId: 'cs_1' });
      await sendGa4Purchase({ ...VALID, transactionId: 'cs_2' });

      const [first, second] = globalThis.fetch.mock.calls.map(
        ([, init]) => JSON.parse(init.body).client_id
      );
      expect(first).toBe(second);
    });

    it('ignores a malformed client id instead of forwarding it to GA4', async () => {
      const result = await sendGa4Purchase({ ...VALID, clientId: 'not-a-client-id' });

      expect(result.attributed).toBe(false);
      expect(lastRequest().body.client_id).not.toBe('not-a-client-id');
    });

    it('accepts a full _ga cookie value passed through by mistake', () => {
      expect(__testing.sanitizeClientId('GA1.1.1234567890.1699999999')).toBe(
        '1234567890.1699999999'
      );
    });
  });

  describe('never breaking the payment webhook', () => {
    beforeEach(configure);

    it('reports a transport failure instead of throwing', async () => {
      globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down')));

      await expect(sendGa4Purchase(VALID)).resolves.toEqual({
        sent: false,
        reason: 'exception',
      });
    });

    it('reports a rejected hit instead of throwing', async () => {
      globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 400 }));

      await expect(sendGa4Purchase(VALID)).resolves.toEqual({
        sent: false,
        reason: 'http_400',
      });
    });

    it('aborts rather than hanging the webhook on a slow endpoint', async () => {
      globalThis.fetch = vi.fn(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            );
          })
      );

      const result = await sendGa4Purchase(VALID);
      expect(result).toEqual({ sent: false, reason: 'exception' });
    }, 10000);
  });
});
