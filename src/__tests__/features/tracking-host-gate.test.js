/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Dev and preview traffic must never reach the Meta dataset.
 *
 * Every `npm run dev` session used to load GTM — and GTM owns the Pixel tag —
 * so localhost was registered as a sending domain and PageView ran to ~37.7K
 * against ~78 real registrations. Meta reads that ratio as low data quality and
 * discounts the ad spend the dataset informs, so the gate is load-bearing for
 * ad performance, not just for tidy reporting.
 */
const loadTracking = async () => {
  vi.resetModules();
  return import('@/lib/tracking');
};

describe('measurement host gate', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    window.localStorage.clear();
  });

  afterEach(() => {
    delete window.__TRACKING_ENABLED__;
    vi.restoreAllMocks();
  });

  it('does not mirror conversions to the Conversions API off production', async () => {
    window.__TRACKING_ENABLED__ = false;
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'email' });

    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('falls back to the hostname when the bootstrap flag is absent', async () => {
    // A stale or partially-loaded bootstrap must fail closed, not open.
    delete window.__TRACKING_ENABLED__;
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'email' });

    expect(window.location.hostname).toBe('localhost');
    expect(window.fetch).not.toHaveBeenCalled();
  });

  it('still fills the dataLayer so GA and product analytics are unaffected', async () => {
    window.__TRACKING_ENABLED__ = false;
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'email' });

    expect(window.dataLayer).toEqual([
      expect.objectContaining({ event: 'signup_completed', method: 'email' }),
    ]);
  });

  it('mirrors conversions when the host is measurable', async () => {
    window.__TRACKING_ENABLED__ = true;
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'email' });

    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch.mock.calls[0][0]).toBe('/api/meta-capi');
  });
});
