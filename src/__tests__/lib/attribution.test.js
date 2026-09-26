import { beforeEach, describe, expect, it } from 'vitest';
import { signupAttributionScript } from '../../../shared/signupAttributionCapture.js';
import {
  classifyChannel,
  getMissingSignupProfileFields,
  getSignupAttribution,
  getStoredAttribution,
  isAuthenticationReferrer,
  isInternalReferrer,
  sanitizeSignupLandingPage,
} from '@/lib/attribution';

const STORAGE_KEY = 'attribution_first_touch';

describe('signup attribution', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.__signupAttribution;
  });

  it('treats same-origin navigation to signup as direct, not a referral', () => {
    const internalReferrer = `${window.location.origin}/signup`;

    expect(isInternalReferrer(internalReferrer)).toBe(true);
    expect(classifyChannel({ referrer: internalReferrer })).toBe('direct');
  });

  it('clears a legacy same-origin first-touch snapshot before signup', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        referrer: `${window.location.origin}/signup`,
        landing_page: '/signup',
        captured_at: '2026-08-28T00:00:00.000Z',
      })
    );

    expect(getStoredAttribution()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getSignupAttribution()).toMatchObject({ signup_channel: 'direct' });
  });

  it('keeps external referrers classified as referrals', () => {
    expect(classifyChannel({ referrer: 'https://partner.example/article' })).toBe('referral');
  });

  it('keeps a real Google Search referrer classified as organic search', () => {
    expect(classifyChannel({ referrer: 'https://www.google.com/' })).toBe('organic_search');
    expect(classifyChannel({ referrer: 'https://www.google.com.bd/search?q=ielts' })).toBe(
      'organic_search'
    );
  });

  it('discards Google authentication as a non-acquisition referrer', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        referrer: 'https://accounts.google.com/',
        landing_page: '/login',
        captured_at: '2026-09-13T00:00:00.000Z',
      })
    );

    expect(classifyChannel({ referrer: 'https://accounts.google.com/' })).toBe('direct');
    expect(getStoredAttribution()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getSignupAttribution()).toMatchObject({ signup_channel: 'direct' });
  });

  it('discards localized Google authentication hosts but preserves Google Search', () => {
    expect(isAuthenticationReferrer('https://accounts.google.com.bd/')).toBe(true);
    expect(isAuthenticationReferrer('https://accounts.google.co.uk/')).toBe(true);
    expect(isAuthenticationReferrer('https://www.google.com.bd/search?q=ielts')).toBe(false);
    expect(classifyChannel({ referrer: 'https://accounts.google.com.bd/' })).toBe('direct');
  });

  it('does not capture Google authentication as first touch before React starts', () => {
    const captureBlock = signupAttributionScript;
    const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

    expect(captureBlock).toBeTruthy();
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://accounts.google.com/',
    });

    try {
      Function(captureBlock)();
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).referrer).toBeNull();
    } finally {
      if (originalReferrer) {
        Object.defineProperty(document, 'referrer', originalReferrer);
      } else {
        delete document.referrer;
      }
    }
  });

  it('keeps paid and UTM signals even when the navigation referrer is internal', () => {
    expect(
      classifyChannel({
        referrer: `${window.location.origin}/pricing`,
        utm_source: 'google',
        utm_medium: 'cpc',
      })
    ).toBe('paid_search');
  });

  it('fills a trigger-created profile without overwriting known attribution', () => {
    const paid = {
      signup_channel: 'paid_social',
      signup_utm_source: 'facebook',
      signup_fbclid: 'click-123',
    };
    const created_at = new Date().toISOString();
    expect(
      getMissingSignupProfileFields({ signup_channel: 'direct', created_at }, paid, {
        capturedAt: created_at,
      })
    ).toMatchObject(paid);
    expect(getMissingSignupProfileFields({ signup_channel: 'organic_search' }, paid)).toEqual({});
  });

  it('removes auth credentials from a captured confirmation landing page', () => {
    const captureBlock = signupAttributionScript;
    const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');
    const originalPath = `${window.location.pathname}${window.location.search}`;

    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://mail.example/inbox',
    });
    window.history.replaceState(
      {},
      '',
      '/auth/confirm?token_hash=one-time-secret&type=signup&utm_source=newsletter&utm_medium=email'
    );

    try {
      Function(captureBlock)();
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      expect(stored.landing_page).toBe('/auth/confirm?utm_source=newsletter&utm_medium=email');
      expect(JSON.stringify(stored)).not.toContain('one-time-secret');
    } finally {
      window.history.replaceState({}, '', originalPath);
      if (originalReferrer) Object.defineProperty(document, 'referrer', originalReferrer);
    }
  });

  it('scrubs a sensitive landing page already stored by an older release', () => {
    expect(
      sanitizeSignupLandingPage('/auth/confirm?token_hash=secret&type=signup&utm_source=email')
    ).toBe('/auth/confirm?type=signup&utm_source=email');

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        utm_source: 'newsletter',
        utm_medium: 'email',
        landing_page: '/auth/confirm?token_hash=secret&type=signup',
      })
    );
    expect(getStoredAttribution().landing_page).toBe('/auth/confirm?type=signup');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain('secret');
  });
});
