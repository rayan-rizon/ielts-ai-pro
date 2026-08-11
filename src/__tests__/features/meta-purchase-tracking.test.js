/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackAppEvent } from '@/lib/tracking';

describe('Meta Purchase tracking', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    // See meta-attribution-tracking.test.js: jsdom runs on localhost, which is
    // deliberately unmeasurable in production code.
    window.__TRACKING_ENABLED__ = true;
  });

  it('sends the exact numeric value, ISO currency, and stable event ID', () => {
    trackAppEvent('subscription_purchase', {
      plan_tier: 'premium',
      value: '14.99',
      currency: 'usd',
      transaction_id: 'cs_live_purchase_123',
    });

    expect(window.dataLayer).toEqual([
      expect.objectContaining({
        event: 'subscription_purchase',
        value: 14.99,
        currency: 'USD',
        event_id: 'cs_live_purchase_123',
      }),
    ]);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({
        value: 14.99,
        currency: 'USD',
        transaction_id: 'cs_live_purchase_123',
      }),
      { eventID: 'cs_live_purchase_123' }
    );
  });

  it.each([
    { value: undefined, currency: 'USD' },
    { value: 'not-a-number', currency: 'USD' },
    { value: 0, currency: 'USD' },
    { value: 14.99, currency: 'US' },
    { value: 14.99, currency: 'EUR' },
  ])('suppresses malformed Purchase payloads: %o', (payload) => {
    trackAppEvent('subscription_purchase', payload);

    expect(window.dataLayer).toEqual([]);
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it('sends valid BDT checkout data to both browser and Conversions API', () => {
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));

    trackAppEvent('checkout_started', {
      plan_tier: 'pro',
      value: 2997,
      currency: 'BDT',
      transaction_id: 'cs_bdt_checkout_123',
    });

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'InitiateCheckout',
      expect.objectContaining({
        value: 2997,
        currency: 'BDT',
        content_ids: ['pro'],
      }),
      { eventID: 'cs_bdt_checkout_123' }
    );
    expect(JSON.parse(window.fetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        event_name: 'InitiateCheckout',
        event_id: 'cs_bdt_checkout_123',
        value: 2997,
        currency: 'BDT',
        content_ids: ['pro'],
      })
    );
  });

  describe('Subscribe companion event', () => {
    // subscription_purchase only ever fires for a brand-new subscription
    // (renewals happen silently via webhook, no page visit) — see
    // COMPANION_PIXEL_EVENT in src/lib/tracking.js. Every Purchase it sends
    // must therefore also send Subscribe, carrying the same value/currency,
    // so Meta can optimise for recurring revenue rather than reading it as a
    // one-off sale.

    it('fires Subscribe to the Pixel alongside Purchase, with matching value and currency', () => {
      trackAppEvent('subscription_purchase', {
        plan_tier: 'premium',
        value: 14.99,
        currency: 'USD',
        transaction_id: 'cs_live_sub_1',
      });

      expect(window.fbq).toHaveBeenCalledWith(
        'track',
        'Purchase',
        expect.objectContaining({ value: 14.99, currency: 'USD' }),
        { eventID: 'cs_live_sub_1' }
      );
      expect(window.fbq).toHaveBeenCalledWith(
        'track',
        'Subscribe',
        expect.objectContaining({
          value: 14.99,
          currency: 'USD',
          transaction_id: 'cs_live_sub_1',
        }),
        { eventID: 'cs_live_sub_1' }
      );
      expect(window.fbq).toHaveBeenCalledTimes(2);
    });

    it('mirrors Subscribe to the Conversions API alongside Purchase', () => {
      window.fetch = vi.fn(() => Promise.resolve({ ok: true }));

      trackAppEvent('subscription_purchase', {
        plan_tier: 'pro',
        value: 4.99,
        currency: 'BDT',
        transaction_id: 'cs_live_sub_2',
      });

      const eventNames = window.fetch.mock.calls.map((call) => JSON.parse(call[1].body).event_name);
      expect(eventNames.sort()).toEqual(['Purchase', 'Subscribe']);
      window.fetch.mock.calls.forEach((call) => {
        expect(JSON.parse(call[1].body)).toEqual(
          expect.objectContaining({ value: 4.99, currency: 'BDT', event_id: 'cs_live_sub_2' })
        );
      });
    });

    it('never fires Subscribe on its own — only ever alongside a valid Purchase', () => {
      // The malformed-payload cases above already prove Purchase itself is
      // suppressed for these payloads; this confirms Subscribe doesn't leak
      // through when the primary event does not fire.
      trackAppEvent('subscription_purchase', { value: undefined, currency: 'USD' });

      expect(window.fbq).not.toHaveBeenCalled();
    });

    it('does not fire Subscribe for other commerce events', () => {
      window.fetch = vi.fn(() => Promise.resolve({ ok: true }));

      trackAppEvent('checkout_started', {
        plan_tier: 'pro',
        value: 9.99,
        currency: 'USD',
        transaction_id: 'cs_checkout_only',
      });

      expect(window.fbq).not.toHaveBeenCalledWith(
        'track',
        'Subscribe',
        expect.anything(),
        expect.anything()
      );
    });
  });
});
