import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCampaignTemplate } from '../../../supabase/functions/_shared/templates';

const input = {
  title: 'Your first IELTS result starts here',
  message: 'Start with Free practice.',
  subject: 'Welcome to IELTS AI Pro',
  objective: 'activation',
  lifecycleStage: 'signup',
  ctaLabel: 'Start my first practice',
  recipientName: 'ielts_runner',
  clickUrl: 'https://www.ieltsai.pro/dashboard?promo=START20-PERSONALTEST',
  openUrl: 'https://www.ieltsai.pro/open',
  unsubscribeUrl: 'https://www.ieltsai.pro/unsubscribe',
};
describe('personal offer email', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());
  it('renders an accurate send-time countdown and keeps previously issued long codes readable', () => {
    const code = 'START20-84A1D329B6704F809A8736D1593F2C8E';
    const result = getCampaignTemplate({
      ...input,
      offer: {
        code,
        discountPercent: 20,
        expiresAt: '2026-10-08T14:45:00Z',
        firstPaymentOnly: true,
      },
    });
    expect(result.text).toContain('Time remaining when sent: 3 days, 2 hours, 45 minutes.');
    expect(result.html).toContain('Limited time');
    expect(result.html).toContain('Your personal 20% offer');
    expect(result.html).toContain('Ends in');
    expect(result.html).toContain(code);
    expect(result.html).toContain('word-break:break-all');
    expect(result.html).not.toContain('<script');
    expect(result.html).not.toContain('EXAMPLE-PERSONAL-CODE');
  });
  it('shows a new short personal code centred without changing its value', () => {
    const code = 'START20A7C4E92B';
    const result = getCampaignTemplate({
      ...input,
      offer: {
        code,
        discountPercent: 20,
        expiresAt: '2026-10-12T12:00:00Z',
        firstPaymentOnly: true,
      },
    });
    expect(result.html).toContain(code);
    expect(result.html).toContain('text-align:center');
    expect(result.text).toContain(code);
    expect(result.html).toContain('Copy the code below');
    expect(result.html).not.toContain('START20-A7C4E92B');
  });
  it('does not advertise expired or invalid codes', () => {
    for (const expiresAt of ['2026-10-05T12:00:00Z', '2026-10-04T12:00:00Z', 'invalid']) {
      const result = getCampaignTemplate({
        ...input,
        offer: { code: 'EXPIRED-CODE', expiresAt, discountPercent: 20 },
      });
      expect(result.html).not.toContain('EXPIRED-CODE');
      expect(result.text).not.toContain('Time remaining');
    }
  });
  it('shows less than a minute without extending the expiry', () => {
    const result = getCampaignTemplate({
      ...input,
      offer: { code: 'LAST-MINUTE', expiresAt: '2026-10-05T12:00:30Z' },
    });
    expect(result.text).toContain('Less than 1 minute remaining when sent.');
    expect(result.text).toContain('12:00 PM UTC');
  });
  it('shows the username, personal code, absolute deadline and first-payment terms', () => {
    const result = getCampaignTemplate({
      ...input,
      offer: {
        code: 'START20-PERSONALTEST',
        discountPercent: 20,
        expiresAt: '2026-10-20T12:00:00Z',
        firstPaymentOnly: true,
      },
    });
    expect(result.html).toContain('Hi ielts_runner');
    expect(result.text).toContain('START20-PERSONALTEST');
    expect(result.text).toContain('Oct 20, 2026');
    expect(result.text).toContain('12:00 PM UTC');
    expect(result.text).toContain('Once per account');
    expect(result.text).toContain('Future renewals use the regular plan price');
  });
  it('keeps a welcome useful when no valid offer remains', () => {
    const result = getCampaignTemplate({
      ...input,
      clickUrl: 'https://www.ieltsai.pro/dashboard',
      offer: null,
    });
    expect(result.text).toContain('Start with Free practice');
    expect(result.text).not.toContain('20%');
    expect(result.text).not.toContain('START20-PERSONALTEST\n');
  });
  it('does not give another campaign the signup offer percentage', () => {
    const result = getCampaignTemplate({
      ...input,
      offer: {
        code: 'RECOVERY15',
        discountPercent: 15,
        expiresAt: '2026-10-20T12:00:00Z',
        firstPaymentOnly: true,
      },
    });
    expect(result.text).toContain('15% off the first payment');
    expect(result.text).not.toContain('20% off');
  });
});
