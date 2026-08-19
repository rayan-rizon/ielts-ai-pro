/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { capturePromoCode, clearPendingPromoCode, getPendingPromoCode } from '@/lib/promoOffer';

/**
 * An ad that promises "30% off with FIRST30" sends an anonymous visitor to the
 * site. They sign up, and only reach /pricing several screens later. The code
 * has to survive that whole gap. It previously did not: /pricing read the code
 * from the URL, stripped it immediately, then bailed out on `!user` — so every
 * ad visitor was quoted full price and the offer silently vanished.
 */
describe('pending promo offer', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('survives the logged-out landing that every ad click starts with', () => {
    capturePromoCode('FIRST30');

    // …signup happens here, many route changes later…
    expect(getPendingPromoCode()).toBe('FIRST30');
  });

  it('normalises casing and whitespace from the link', () => {
    capturePromoCode('  first30  ');

    expect(getPendingPromoCode()).toBe('FIRST30');
  });

  it.each(['', '   ', 'ab', 'no', '<script>', 'has space', null, undefined])(
    'ignores %o rather than storing junk for the redemption RPC',
    (value) => {
      expect(capturePromoCode(value)).toBeNull();
      expect(getPendingPromoCode()).toBeNull();
    }
  );

  it('is cleared only once the offer is actually resolved', () => {
    capturePromoCode('FIRST30');
    expect(getPendingPromoCode()).toBe('FIRST30');

    clearPendingPromoCode();
    expect(getPendingPromoCode()).toBeNull();
  });

  it('reports no code when a stored value is not a usable code', () => {
    window.localStorage.setItem('pending_promo_code', 'x');

    expect(getPendingPromoCode()).toBeNull();
  });
});
