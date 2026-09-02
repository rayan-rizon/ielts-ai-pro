/* @vitest-environment jsdom */

import { webcrypto } from 'node:crypto';
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
      expect.not.objectContaining({ value: expect.anything(), currency: expect.anything() }),
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
    vi.stubGlobal('crypto', webcrypto);
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

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
    const pixelEventId = window.fbq.mock.calls[0][3].eventID;
    const capiBody = JSON.parse(window.fetch.mock.calls[0][1].body);

    expect(window.fetch.mock.calls[0][0]).toBe('/api/meta-capi');
    expect(capiBody.event_name).toBe('CompleteRegistration');
    expect(capiBody.event_id).toBe(pixelEventId);
    expect(capiBody).not.toHaveProperty('value');
    expect(capiBody).not.toHaveProperty('currency');
  });

  it('hashes CAPI identity in the browser and never serializes raw values', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', {
      method: 'email',
      email: ' Learner@Example.com ',
      user_id: 'user-42',
    });

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
    const body = window.fetch.mock.calls[0][1].body;
    const capiBody = JSON.parse(body);

    expect(body).not.toContain('Learner@Example.com');
    expect(body).not.toContain('user-42');
    expect(capiBody.user).toEqual({
      em: '2d985f691975ed96ce710fc7f6272a38c0c6ae910798dfd12c24365ed185bfd4',
      external_id: '6d894aa3ee802549d7f340e7c1cf0d1c1cb14cd84f768d92ffaa6785337c4997',
    });
  });

  it('adds hashed identity to authenticated funnel events without exposing raw values', async () => {
    const { trackAuthenticatedAppEvent } = await loadTracking();

    trackAuthenticatedAppEvent(
      'onboarding_completed',
      { path: '/onboarding' },
      { id: 'user-42', email: ' Learner@Example.com ' }
    );

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
    const body = window.fetch.mock.calls[0][1].body;
    const capiBody = JSON.parse(body);

    expect(body).not.toContain('Learner@Example.com');
    expect(body).not.toContain('user-42');
    expect(capiBody.user).toEqual({
      em: '2d985f691975ed96ce710fc7f6272a38c0c6ae910798dfd12c24365ed185bfd4',
      external_id: '6d894aa3ee802549d7f340e7c1cf0d1c1cb14cd84f768d92ffaa6785337c4997',
    });
  });

  it('omits identity rather than falling back to plaintext without Web Crypto', async () => {
    vi.stubGlobal('crypto', undefined);
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', {
      method: 'email',
      email: 'learner@example.com',
      user_id: 'user-42',
    });

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
    const body = window.fetch.mock.calls[0][1].body;

    expect(body).not.toContain('learner@example.com');
    expect(body).not.toContain('user-42');
    expect(JSON.parse(body).user).toEqual({});
  });

  it('keeps direct identity and learner content out of Pixel and dataLayer payloads', async () => {
    const { trackAppEvent } = await loadTracking();

    trackAppEvent('signup_completed', {
      method: 'email',
      email: 'learner@example.com',
      user_id: 'user-42',
      session_id: 'session-42',
      transcript: 'private learner response',
    });

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
    const pixelPayload = window.fbq.mock.calls.find(
      (call) => call[1] === 'CompleteRegistration'
    )[2];
    const dataLayerPayload = window.dataLayer.find((entry) => entry.event === 'signup_completed');

    for (const payload of [pixelPayload, dataLayerPayload]) {
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('user_id');
      expect(payload).not.toHaveProperty('session_id');
      expect(payload).not.toHaveProperty('transcript');
    }
  });

  it('hashes profile identity before the Pixel init and dataLayer event', async () => {
    const { pushUserIdentity } = await loadTracking();

    pushUserIdentity({
      id: 'user-42',
      email: ' Learner@Example.com ',
      full_name: 'Learner Example',
      subscription_tier: 'pro',
      role: 'user',
    });

    await vi.waitFor(() =>
      expect(window.fbq.mock.calls.some((call) => call[0] === 'init')).toBe(true)
    );
    const initPayload = window.fbq.mock.calls.find((call) => call[0] === 'init')[2];
    const identityEvent = window.dataLayer.find((entry) => entry.event === 'user_identified');

    expect(initPayload).toEqual({
      em: '2d985f691975ed96ce710fc7f6272a38c0c6ae910798dfd12c24365ed185bfd4',
      fn: '1210f10c3412994f89ce378289d7ffdabf0aa594b5f3c010ff301a1d309ee421',
      ln: expect.stringMatching(/^[a-f0-9]{64}$/),
      external_id: '6d894aa3ee802549d7f340e7c1cf0d1c1cb14cd84f768d92ffaa6785337c4997',
    });
    expect(identityEvent).toEqual(
      expect.objectContaining({
        event: 'user_identified',
        user_id_hash: '6d894aa3ee802549d7f340e7c1cf0d1c1cb14cd84f768d92ffaa6785337c4997',
        subscription_tier: 'pro',
        is_authenticated: true,
        is_admin: false,
      })
    );
    expect(JSON.stringify(initPayload)).not.toContain('Learner');
  });

  it('still reports server-side when the Pixel is blocked', async () => {
    const { trackAppEvent } = await loadTracking();
    delete window.fbq;

    trackAppEvent('signup_completed', { method: 'email' });

    await vi.waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(1));
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
