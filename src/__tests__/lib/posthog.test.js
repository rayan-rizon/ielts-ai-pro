import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '@/lib/trackingConfig';
import { __posthogTesting } from '@/lib/posthog';

describe('PostHog product analytics policy', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    vi.stubEnv('VITE_POSTHOG_ENABLE_DEVELOPMENT', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('starts automatically on an allowed host even when analytics cookies are declined', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ functional: true, analytics: false, marketing: false })
    );

    expect(__posthogTesting.shouldCapture()).toBe(true);
  });

  it('keeps only reviewed, low-risk event properties', () => {
    expect(
      __posthogTesting.sanitizeProperties({
        test_type: 'writing',
        overall_band: 7.5,
        path: '/writing-task',
        email: 'learner@example.com',
        session_id: 'private-session-id',
        transcript: 'private speaking transcript',
        answers: { 1: 'private answer' },
      })
    ).toEqual({
      test_type: 'writing',
      overall_band: 7.5,
      path: '/writing-task',
    });
  });

  it('uses an explicit event contract for acquisition, activation, learning, and revenue', () => {
    expect(__posthogTesting.PRODUCT_EVENTS.has('signup_completed')).toBe(true);
    expect(__posthogTesting.PRODUCT_EVENTS.has('onboarding_completed')).toBe(true);
    expect(__posthogTesting.PRODUCT_EVENTS.has('test_completed')).toBe(true);
    expect(__posthogTesting.PRODUCT_EVENTS.has('subscription_purchase')).toBe(true);
    expect(__posthogTesting.PRODUCT_EVENTS.has('auth_failed')).toBe(false);
  });
});

describe('PostHog SDK bridge', () => {
  it('initializes automatically and sends only sanitized properties', async () => {
    const client = {
      capture: vi.fn(),
      identify: vi.fn(),
      init: vi.fn(),
      opt_in_capturing: vi.fn(),
      opt_out_capturing: vi.fn(),
      reset: vi.fn(),
    };

    vi.resetModules();
    vi.doMock('posthog-js', () => ({ default: client }));
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    vi.stubEnv('VITE_POSTHOG_ENABLE_DEVELOPMENT', 'true');
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false }));

    const { captureProductEvent } = await import('@/lib/posthog');
    await captureProductEvent('test_completed', {
      test_type: 'reading',
      overall_band: 7,
      session_id: 'must-not-leave-browser',
      answers: { 1: 'private' },
    });

    expect(client.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        autocapture: false,
        capture_exceptions: false,
        capture_pageleave: false,
        capture_pageview: false,
        disable_external_dependency_loading: true,
        disable_session_recording: true,
        advanced_disable_flags: true,
        person_profiles: 'identified_only',
      })
    );
    expect(client.capture).toHaveBeenCalledWith('test_completed', {
      test_type: 'reading',
      overall_band: 7,
    });

    vi.doUnmock('posthog-js');
    vi.unstubAllEnvs();
    localStorage.clear();
  });
});
