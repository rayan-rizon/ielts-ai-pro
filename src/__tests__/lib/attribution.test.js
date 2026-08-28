import { beforeEach, describe, expect, it } from 'vitest';
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
