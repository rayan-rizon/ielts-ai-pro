/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackAppEvent } from '@/lib/tracking';

describe('Meta Purchase tracking', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
  });

  it('sends the exact numeric value, ISO currency, and stable event ID', () => {
    trackAppEvent('subscription_purchase', {
      plan_tier: 'premium',
      value: '14.99',
      currency: 'usd',
      transaction_id: 'cs_live_purchase_123',
    });

    expect(window.dataLayer).toEqual([
      expect.objectContaining({
        event: 'subscription_purchase',
        value: 14.99,
        currency: 'USD',
        event_id: 'cs_live_purchase_123',
      }),
    ]);
    expect(window.fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({
        value: 14.99,
        currency: 'USD',
        transaction_id: 'cs_live_purchase_123',
      }),
      { eventID: 'cs_live_purchase_123' }
    );
  });

  it.each([
    { value: undefined, currency: 'USD' },
    { value: 'not-a-number', currency: 'USD' },
    { value: 14.99, currency: 'US' },
  ])('suppresses malformed Purchase payloads: %o', (payload) => {
    trackAppEvent('subscription_purchase', payload);

    expect(window.dataLayer).toEqual([]);
    expect(window.fbq).not.toHaveBeenCalled();
  });
});
