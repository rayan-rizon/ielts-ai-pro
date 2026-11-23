import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { getCampaignAction } from '../../../supabase/functions/_shared/marketingOfferAction';
import { checkoutPlanFor } from '../../../supabase/functions/_shared/marketingDelivery';
import { getCampaignTemplate } from '../../../supabase/functions/_shared/templates';

const campaign = {
  cta_url: '/pricing',
  cta_label: 'Finish your plan',
  metadata: { lifecycle_stage: 'checkout' },
};
const now = Date.parse('2026-11-23T12:00:00Z');
const offer = { code: 'START20A7C4E92B', expiresAt: '2026-11-24T00:00:00Z', discountPercent: 20 };
const params = (url: string) =>
  Object.fromEntries(new URL(url, 'https://www.ieltsai.pro').searchParams);

describe('checkout recovery action', () => {
  it('returns the learner to the plan and billing period they chose', () => {
    const action = getCampaignAction(campaign, null, now, { tier: 'pro', interval: 'quarterly' });
    expect(params(action.url)).toEqual({ plan: 'pro', interval: 'quarterly', checkout: '1' });
    expect(action.label).toBe('Continue with Pro');
  });
  it('names the live 20% offer on the button, and drops it once it has ended', () => {
    const plan = { tier: 'premium', interval: 'monthly' };
    expect(getCampaignAction(campaign, offer, now, plan).label).toBe(
      'Continue with Premium · 20% off'
    );
    const ended = { ...offer, expiresAt: new Date(now - 1000).toISOString() };
    expect(getCampaignAction(campaign, ended, now, plan).label).toBe('Continue with Premium');
  });
  it('falls back to the plan page for an unknown plan instead of guessing one', () => {
    for (const plan of [null, undefined, { tier: 'enterprise', interval: 'monthly' }]) {
      expect(getCampaignAction(campaign, offer, now, plan)).toEqual({
        url: '/pricing',
        label: 'Finish your plan',
      });
    }
  });
  it('ignores an interval it does not recognise', () => {
    const action = getCampaignAction(campaign, null, now, { tier: 'pro', interval: 'weekly' });
    expect(params(action.url)).toEqual({ plan: 'pro', checkout: '1' });
  });
  it('leaves the signup action unchanged', () => {
    const signup = { ...campaign, metadata: { lifecycle_stage: 'signup' } };
    expect(getCampaignAction(signup, offer, now, { tier: 'pro', interval: 'monthly' }).label).toBe(
      'Premium monthly · 20% off'
    );
  });
});

describe('checkout plan lookup', () => {
  const db = (row: any, error: any = null) => {
    const calls: any[] = [];
    const chain: any = new Proxy(
      {},
      {
        get: (_t, prop: string) => {
          if (prop === 'maybeSingle') return async () => ({ data: row, error });
          return (...args: any[]) => (calls.push([prop, ...args]), chain);
        },
      }
    );
    return { from: (table: string) => (calls.push(['from', table]), chain), calls };
  };
  it('only queries for the checkout stage', async () => {
    const fake = db({ plan_tier: 'pro', billing_interval: 'monthly' });
    expect(
      await checkoutPlanFor(fake, { metadata: { lifecycle_stage: 'signup' } }, 'u1')
    ).toBeNull();
    expect(fake.calls).toHaveLength(0);
  });
  it('reads the most recent initiated checkout for the learner', async () => {
    const fake = db({ plan_tier: 'premium', billing_interval: 'quarterly' });
    expect(await checkoutPlanFor(fake, campaign, 'u1')).toEqual({
      tier: 'premium',
      interval: 'quarterly',
    });
    expect(fake.calls).toEqual(
      expect.arrayContaining([
        ['from', 'marketing_checkout_intents'],
        ['eq', 'user_id', 'u1'],
        ['eq', 'status', 'initiated'],
        ['order', 'initiated_at', { ascending: false }],
      ])
    );
  });
  it('returns null with no checkout and throws on a read error', async () => {
    expect(await checkoutPlanFor(db(null), campaign, 'u1')).toBeNull();
    await expect(checkoutPlanFor(db(null, new Error('boom')), campaign, 'u1')).rejects.toThrow(
      'boom'
    );
  });
});

describe('checkout recovery email', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });
  afterEach(() => vi.useRealTimers());
  const base = {
    title: 'You were one step away',
    message: 'You started checkout but did not finish, so we kept your plan ready.',
    subject: 'Your plan is saved — finish in one click',
    objective: 'paid_conversion',
    lifecycleStage: 'checkout',
    ctaLabel: 'Continue with Pro · 20% off',
    recipientName: 'amina',
    clickUrl: 'https://www.ieltsai.pro/t/click?to=pricing',
    openUrl: 'https://www.ieltsai.pro/t/view',
    unsubscribeUrl: 'https://www.ieltsai.pro/unsubscribe',
  };
  it('renders the saved-plan checklist, the button and a one-click unsubscribe', () => {
    const { html, text, subject } = getCampaignTemplate(base);
    expect(subject).toBe('Your plan is saved — finish in one click');
    expect(html).toContain('Your plan is saved');
    expect(html).toContain('The plan and billing period you chose are ready to continue.');
    expect(html).toContain('Continue with Pro · 20% off');
    expect(html).toContain('https://www.ieltsai.pro/unsubscribe');
    expect(text).toContain('- Manage or cancel your subscription from your account settings');
  });
  it('shows the real deadline when the learner has a live code, and no offer otherwise', () => {
    const withOffer = getCampaignTemplate({
      ...base,
      offer: {
        code: 'START20A7C4E92B',
        discountPercent: 20,
        expiresAt: '2026-11-24T00:00:00Z',
        firstPaymentOnly: true,
      },
    });
    expect(withOffer.text).toContain('Time remaining when sent: 12 hours, 0 minutes.');
    expect(withOffer.html).toContain('START20A7C4E92B');
    const without = getCampaignTemplate(base);
    expect(without.html).not.toContain('Limited time');
    expect(without.text).not.toContain('START20');
  });
  it('never advertises an offer that has already ended', () => {
    const ended = getCampaignTemplate({
      ...base,
      offer: { code: 'START20A7C4E92B', discountPercent: 20, expiresAt: '2026-11-23T11:00:00Z' },
    });
    expect(ended.html).not.toContain('START20A7C4E92B');
  });
});

describe('checkout recovery email: selected plan and live countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });
  afterEach(() => vi.useRealTimers());
  const base = {
    title: 'You were one step away',
    message: 'You started checkout but did not finish.',
    subject: 'Your plan is saved — finish in one click',
    objective: 'paid_conversion',
    lifecycleStage: 'checkout',
    ctaLabel: 'Continue',
    recipientName: 'amina',
    clickUrl: 'https://www.ieltsai.pro/t/click',
    unsubscribeUrl: 'https://www.ieltsai.pro/unsubscribe',
  };
  it.each([
    ['pro', 'monthly', 'Pro', 'Monthly'],
    ['premium', 'quarterly', 'Premium', 'Quarterly'],
  ])('shows the plan the learner chose: %s %s', (tier, interval, name, period) => {
    const { html, subject } = getCampaignTemplate({ ...base, plan: { tier, interval } });
    expect(subject).toBe(`Your ${name} plan is saved — finish in one click`);
    expect(html).toContain('Your selected plan');
    expect(html).toContain(`${name} <span`);
    expect(html).toContain(`· ${period}`);
    const other = name === 'Pro' ? 'Premium' : 'Pro';
    expect(html).not.toContain(`>${other} <span`);
  });
  it('shows no plan card and keeps the generic subject when the plan is unknown', () => {
    for (const plan of [null, undefined, { tier: 'enterprise', interval: 'monthly' }]) {
      const { html, subject } = getCampaignTemplate({ ...base, plan });
      expect(html).not.toContain('Your selected plan');
      expect(subject).toBe('Your plan is saved — finish in one click');
    }
  });
  it('does not show a plan card outside the checkout stage', () => {
    const { html } = getCampaignTemplate({
      ...base,
      lifecycleStage: 'signup',
      plan: { tier: 'pro', interval: 'monthly' },
    });
    expect(html).not.toContain('Your selected plan');
  });
  it('embeds the live countdown image with a send-time fallback in the alt text', () => {
    const offer = {
      code: 'START20A7C4E92B',
      discountPercent: 20,
      expiresAt: '2026-11-24T00:00:00Z',
      firstPaymentOnly: true,
    };
    const live = getCampaignTemplate({
      ...base,
      offer,
      countdownImageUrl: 'https://x.supabase.co/functions/v1/email-countdown?e=1795478400',
    });
    expect(live.html).toContain(
      '<img src="https://x.supabase.co/functions/v1/email-countdown?e=1795478400"'
    );
    expect(live.html).toContain('alt="Time remaining when sent: 12 hours, 0 minutes."');
    expect(live.html).toContain('live countdown');
    expect(live.html).not.toMatch(/>12<\/span><span[^>]*>Hours<\/span>/);
    const still = getCampaignTemplate({ ...base, offer });
    expect(still.html).not.toContain('email-countdown');
    expect(still.html).toMatch(/>12<\/span><span[^>]*>Hours<\/span>/);
  });
  it('drops the countdown image when the offer has ended', () => {
    const ended = getCampaignTemplate({
      ...base,
      offer: { code: 'START20A7C4E92B', discountPercent: 20, expiresAt: '2026-11-23T11:00:00Z' },
      countdownImageUrl: 'https://x.supabase.co/functions/v1/email-countdown?e=1',
    });
    expect(ended.html).not.toContain('email-countdown');
  });
});

describe('checkout recovery migration', () => {
  const sql = readFileSync(
    'supabase/migrations/20261123060000_checkout_recovery_email.sql',
    'utf8'
  );
  it('creates the campaign paused so nothing is sent on deploy', () => {
    expect(sql).toMatch(
      /INSERT INTO public\.marketing_campaigns[\s\S]*'paid_conversion', 'paused'/
    );
    expect(sql).not.toMatch(/'paid_conversion', 'active'/);
    expect(sql).not.toMatch(/is_active\s*=\s*true/i);
  });
  it('reads checkout starts and purchases from checkout intents, not only events', () => {
    expect(sql).toContain('FROM public.marketing_checkout_intents i');
    expect(sql).toContain("paid_intent.status = 'settled'");
    expect(sql).toContain('checkout_abandoned_hours_max');
  });
  it('keeps learners who applied a code in the audience and allows the checkout stage', () => {
    const segmentUpdate = sql.slice(
      sql.indexOf('UPDATE public.marketing_segments'),
      sql.indexOf('-- One email')
    );
    expect(segmentUpdate).toContain("'checkout_abandoned_hours_max', 336");
    expect(segmentUpdate).not.toContain('exclude_active_promo');
    expect(sql).toContain("IN ('signup','first_result','quota','checkout')");
  });
  it('keeps the email opt-out the audience already honours', () => {
    expect(sql).toContain('u.marketing_email_unsubscribed_at IS NULL');
  });
});
