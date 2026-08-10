/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clearCookies = () => {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0].trim();
    if (name) document.cookie = `${name}=;path=/;max-age=0`;
  });
};

/**
 * tracking.js resolves the click id at call time, but module-level state
 * (TRACKING_IDS) is evaluated on import. Re-importing per test keeps the
 * cookie/localStorage fixtures authoritative.
 */
const loadTracking = async () => {
  vi.resetModules();
  return import('@/lib/tracking');
};

describe('Meta click attribution', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    // jsdom serves these tests from localhost, which production code treats as
    // unmeasurable. These cases are about event shape and deduplication, so
    // they opt into the measured path explicitly; the gate itself is covered in
    // tracking-host-gate.test.js.
    window.__TRACKING_ENABLED__ = true;
    window.localStorage.clear();
    clearCookies();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recovers the click id from the _fbc cookie', async () => {
    document.cookie = '_fbc=fb.1.1700000000000.abc123;path=/';
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('onboarding_completed', {});

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Lead',
      expect.objectContaining({ fbc: 'fb.1.1700000000000.abc123' }),
      expect.objectContaining({ eventID: expect.any(String) })
    );
  });

  it('falls back to the localStorage backup when the cookie was rejected', async () => {
    window.localStorage.setItem('_fbc_backup', 'fb.1.1700000000001.storedclick');
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('onboarding_completed', {});

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Lead',
      expect.objectContaining({ fbc: 'fb.1.1700000000001.storedclick' }),
      expect.anything()
    );
  });

  it('does not invent a click id when the visit is not from an ad', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('onboarding_completed', {});

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Lead',
      expect.objectContaining({ fbc: null }),
      expect.anything()
    );
  });
});

describe('Meta event allowlist', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    // jsdom serves these tests from localhost, which production code treats as
    // unmeasurable. These cases are about event shape and deduplication, so
    // they opt into the measured path explicitly; the gate itself is covered in
    // tracking-host-gate.test.js.
    window.__TRACKING_ENABLED__ = true;
    window.localStorage.clear();
    clearCookies();
  });

  it('forwards only funnel events to the Pixel', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'google' });
    trackAppEvent('writing_submitted', {});

    const pixelEvents = window.fbq.mock.calls.map((call) => call[1]);
    expect(pixelEvents).toEqual(['CompleteRegistration']);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'CompleteRegistration',
      expect.objectContaining({ value: 1, currency: 'USD' }),
      expect.anything()
    );
  });

  it('keeps non-Meta events in the dataLayer for GTM', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('writing_submitted', { task: 'task2' });

    expect(window.dataLayer).toEqual([
      expect.objectContaining({ event: 'writing_submitted', task: 'task2' }),
    ]);
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it('drops diagnostic noise entirely', async () => {
    const { trackAppEvent } = await loadTracking();

    ['auth_failed', 'checkout_failed', 'test_started', 'premium_plan_saved'].forEach((name) =>
      trackAppEvent(name, {})
    );

    expect(window.dataLayer).toEqual([]);
    expect(window.fbq).not.toHaveBeenCalled();
  });
});

describe('Conversions API mirroring', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    // jsdom serves these tests from localhost, which production code treats as
    // unmeasurable. These cases are about event shape and deduplication, so
    // they opt into the measured path explicitly; the gate itself is covered in
    // tracking-host-gate.test.js.
    window.__TRACKING_ENABLED__ = true;
    window.localStorage.clear();
    clearCookies();
  });

  it('sends the same event_id to the Pixel and the server so Meta deduplicates', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', { method: 'google', user_id: 'user-1' });

    const pixelEventId = window.fbq.mock.calls[0][3].eventID;
    const capiBody = JSON.parse(window.fetch.mock.calls[0][1].body);

    expect(window.fetch.mock.calls[0][0]).toBe('/api/meta-capi');
    expect(capiBody.event_name).toBe('CompleteRegistration');
    expect(capiBody.event_id).toBe(pixelEventId);
    expect(capiBody).toMatchObject({ value: 1, currency: 'USD' });
  });

  it('still reports server-side when the Pixel is blocked', async () => {
    const { trackAppEvent } = await loadTracking();
    delete window.fbq;

    trackAppEvent('signup_completed', { method: 'email' });

    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.fetch.mock.calls[0][1].body).event_name).toBe('CompleteRegistration');
  });

  it('does not mirror upper-funnel events that are Pixel-only', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('writing_checker_signup_gate_viewed', {});

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'ViewContent',
      expect.anything(),
      expect.anything()
    );
    expect(window.fetch).not.toHaveBeenCalled();
  });
});

describe('Signup reporting', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
    window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
    // jsdom serves these tests from localhost, which production code treats as
    // unmeasurable. These cases are about event shape and deduplication, so
    // they opt into the measured path explicitly; the gate itself is covered in
    // tracking-host-gate.test.js.
    window.__TRACKING_ENABLED__ = true;
    window.localStorage.clear();
    clearCookies();
  });

  it('reports a registration once per user even if the profile insert is retried', async () => {
    const { trackSignupCompleted } = await loadTracking();

    expect(trackSignupCompleted({ userId: 'user-42', method: 'google' })).toBe(true);
    expect(trackSignupCompleted({ userId: 'user-42', method: 'google' })).toBe(false);

    const registrations = window.fbq.mock.calls.filter(
      (call) => call[1] === 'CompleteRegistration'
    );
    expect(registrations).toHaveLength(1);
  });

  it('reports Google signups, which previously never reached Meta', async () => {
    const { trackSignupCompleted } = await loadTracking();

    trackSignupCompleted({ userId: 'user-99', method: 'google', email: 'A@Example.com ' });

    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'CompleteRegistration',
      expect.objectContaining({ method: 'google' }),
      expect.anything()
    );
  });

  it('treats a different user as a separate registration', async () => {
    const { trackSignupCompleted } = await loadTracking();

    trackSignupCompleted({ userId: 'user-1', method: 'email' });
    trackSignupCompleted({ userId: 'user-2', method: 'google' });

    const registrations = window.fbq.mock.calls.filter(
      (call) => call[1] === 'CompleteRegistration'
    );
    expect(registrations).toHaveLength(2);
  });
});
