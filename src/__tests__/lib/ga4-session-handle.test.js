/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getGaClientId, getGaSessionHandle, getGaSessionId } from '@/lib/tracking';

/** The stream half of the configured GA4 measurement id G-GF63SJZ9ZJ. */
const SESSION_COOKIE = '_ga_GF63SJZ9ZJ';

const setCookie = (name, value) => {
  document.cookie = `${name}=${value}; path=/`;
};

const clearCookies = () => {
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

describe('GA4 session handle', () => {
  beforeEach(clearCookies);
  afterEach(clearCookies);

  describe('client id', () => {
    it('reads the client id out of a standard _ga cookie', () => {
      setCookie('_ga', 'GA1.1.1234567890.1699999999');
      expect(getGaClientId()).toBe('1234567890.1699999999');
    });

    it('is not confused by a different domain-depth digit', () => {
      setCookie('_ga', 'GA1.2.987654321.1700000001');
      expect(getGaClientId()).toBe('987654321.1700000001');
    });

    it('returns null when the cookie is absent', () => {
      expect(getGaClientId()).toBeNull();
    });

    it('returns null rather than a malformed value', () => {
      setCookie('_ga', 'GA1.1.not-a-client-id');
      expect(getGaClientId()).toBeNull();
    });
  });

  describe('session id', () => {
    // Google ships two encodings and both are live in the wild. Parsing only
    // one of them silently loses session attribution for half of all payers.
    it('parses the dot-separated GS1 encoding', () => {
      setCookie(SESSION_COOKIE, 'GS1.1.1700000123.4.1.1700000456.0.0.0');
      expect(getGaSessionId()).toBe('1700000123');
    });

    it('parses the $-delimited GS2 encoding', () => {
      setCookie(SESSION_COOKIE, 'GS2.1.s1700000789$o3$g1$t1700000900$j60$l0$h0');
      expect(getGaSessionId()).toBe('1700000789');
    });

    it('returns null when the per-stream cookie is absent', () => {
      setCookie('_ga', 'GA1.1.1234567890.1699999999');
      expect(getGaSessionId()).toBeNull();
    });
  });

  describe('combined handle', () => {
    it('returns both ids under the keys the checkout endpoint expects', () => {
      setCookie('_ga', 'GA1.1.1234567890.1699999999');
      setCookie(SESSION_COOKIE, 'GS1.1.1700000123.4.1.1700000456.0.0.0');

      expect(getGaSessionHandle()).toEqual({
        ga_client_id: '1234567890.1699999999',
        ga_session_id: '1700000123',
      });
    });

    it('degrades to nulls instead of throwing when GA never set its cookies', () => {
      expect(getGaSessionHandle()).toEqual({
        ga_client_id: null,
        ga_session_id: null,
      });
    });
  });
});
