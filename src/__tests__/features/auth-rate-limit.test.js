import { describe, expect, it } from 'vitest';
import {
  getAuthRateLimitWaitSeconds,
  isAuthRateLimitError,
} from '@/features/auth/utils/authRateLimit';

describe('authentication rate-limit handling', () => {
  it('does not treat an invalid password as a rate limit', () => {
    expect(isAuthRateLimitError(new Error('Invalid email or password'))).toBe(false);
  });

  it('recognises Supabase 429 and over-request-limit responses', () => {
    expect(isAuthRateLimitError({ status: 429, message: 'Too many requests' })).toBe(true);
    expect(isAuthRateLimitError({ code: 'over_request_rate_limit' })).toBe(true);
  });

  it('uses the provider wait time when it is available', () => {
    expect(getAuthRateLimitWaitSeconds({ message: 'Please wait 55 seconds.' })).toBe(55);
    expect(getAuthRateLimitWaitSeconds({ message: 'Too many requests' })).toBe(60);
  });
});
