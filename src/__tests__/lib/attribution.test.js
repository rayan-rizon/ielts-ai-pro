import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  classifyChannel,
  getSignupAttribution,
  getStoredAttribution,
  isInternalReferrer,
} from '@/lib/attribution';

const STORAGE_KEY = 'attribution_first_touch';

describe('signup attribution', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    expect(getSignupAttribution()).toEqual({ signup_channel: 'direct' });
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
    expect(getSignupAttribution()).toEqual({ signup_channel: 'direct' });
  });

  it('does not capture Google authentication as first touch before React starts', () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const captureBlock = indexHtml.match(
      /var captureAttribution = function \(\) \{[\s\S]*?\n\s{8}captureAttribution\(\);/
    )?.[0];
    const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

    expect(captureBlock).toBeTruthy();
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://accounts.google.com/',
    });

    try {
      Function(captureBlock)();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
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
});
