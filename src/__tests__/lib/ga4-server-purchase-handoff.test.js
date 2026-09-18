/* @vitest-environment jsdom */

/**
 * GA4 has no event deduplication, so exactly one producer may emit `purchase`.
 * The GTM trigger "GA4 - Purchase" listens for the custom event
 * `subscription_purchase`; the Stripe webhook sends the same conversion via the
 * Measurement Protocol. These tests pin the handoff so the two can never be
 * live at the same time, and so flipping the switch never disturbs Meta.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const PURCHASE_PAYLOAD = {
  plan_tier: 'premium',
  value: 14.99,
  currency: 'USD',
  transaction_id: 'cs_live_handoff_1',
};

const loadTracking = async ({ serverPurchase }) => {
  vi.resetModules();
  vi.stubEnv('VITE_GA4_SERVER_PURCHASE', serverPurchase);
  return import('@/lib/tracking');
};

describe('GA4 server purchase handoff', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    window.__TRACKING_ENABLED__ = true;
    // trackAppEvent keeps a localStorage marker per purchased transaction_id to
    // stop a reloaded success page re-reporting the sale. Without clearing it,
    // the second test reusing this transaction id would be suppressed by the
    // guard rather than by the behaviour under test.
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to browser-owned GA4: the dataLayer event still fires', async () => {
    const { trackAppEvent } = await loadTracking({ serverPurchase: '' });

    trackAppEvent('subscription_purchase', PURCHASE_PAYLOAD);

    expect(window.dataLayer).toEqual([
      expect.objectContaining({ event: 'subscription_purchase', value: 14.99 }),
    ]);
  });

  it('stops pushing subscription_purchase once the server owns GA4', async () => {
    const { trackAppEvent } = await loadTracking({ serverPurchase: 'true' });

    trackAppEvent('subscription_purchase', PURCHASE_PAYLOAD);

    // The GTM trigger matches on this exact event name; nothing may push it.
    expect(window.dataLayer).toEqual([]);
  });

  it('still reports the purchase to Meta when the server owns GA4', async () => {
    const { trackAppEvent } = await loadTracking({ serverPurchase: 'true' });

    trackAppEvent('subscription_purchase', PURCHASE_PAYLOAD);

    // Meta is dispatched through fbq and the Conversions API, neither of which
    // reads the dataLayer, so suppression must not touch it.
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ value: 14.99, currency: 'USD' }),
      { eventID: 'cs_live_handoff_1' }
    );
    expect(window.fbq).toHaveBeenCalledWith('track', 'Subscribe', expect.anything(), {
      eventID: 'cs_live_handoff_1',
    });
  });

  it('only suppresses the purchase event, never the rest of the funnel', async () => {
    const { trackAppEvent } = await loadTracking({ serverPurchase: 'true' });

    trackAppEvent('signup_completed', { path: '/signup' });
    trackAppEvent('checkout_started', {
      plan_tier: 'pro',
      value: 9.99,
      currency: 'USD',
    });

    expect(window.dataLayer.map((entry) => entry.event)).toEqual([
      'signup_completed',
      'checkout_started',
    ]);
  });
});
