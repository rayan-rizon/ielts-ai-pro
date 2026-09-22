import { describe, it, expect } from 'vitest';
import {
  formatReason,
  getProviderUrl,
  verdictMeta,
  formatMoney,
  formatElapsed,
  windowRemaining,
} from '@/components/admin/billing/billingFormat';

describe('billingFormat helpers', () => {
  it('cleans up single practice test singular/plural grammar', () => {
    const rawSingle =
      '1 practice test(s) were started after purchase — check whether they were paid-only.';
    expect(formatReason(rawSingle)).toBe(
      '1 practice test was started after purchase — verify if it required paid access.'
    );

    const rawMultiple =
      '3 practice test(s) were started after purchase — check whether they were paid-only.';
    expect(formatReason(rawMultiple)).toBe(
      '3 practice tests were started after purchase — verify if they required paid access.'
    );
  });

  it('generates correct provider deep-links for Stripe', () => {
    expect(getProviderUrl('stripe', 'cs_live_12345')).toBe(
      'https://dashboard.stripe.com/payments?query=cs_live_12345'
    );
    expect(getProviderUrl('stripe', 'pi_12345')).toBe(
      'https://dashboard.stripe.com/payments/pi_12345'
    );
    expect(getProviderUrl('bkash', 'trx_12345')).toBeNull();
    expect(getProviderUrl(null, null)).toBeNull();
  });

  it('returns valid verdict metadata', () => {
    const eligible = verdictMeta('eligible');
    expect(eligible.tone).toBe('ok');
    expect(eligible.title).toContain('Eligible');

    const expired = verdictMeta('window_expired');
    expect(expired.tone).toBe('neutral');
    expect(expired.title).toContain('window');
  });

  it('formats money and elapsed time accurately', () => {
    expect(formatMoney(14.99, 'USD')).toBe('$14.99');
    expect(formatElapsed(45)).toBe('45m');
    expect(formatElapsed(90)).toBe('1h 30m');
  });
});
