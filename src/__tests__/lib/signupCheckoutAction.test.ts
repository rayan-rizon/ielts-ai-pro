import { describe, expect, it } from 'vitest';
import { getCampaignAction } from '../../../supabase/functions/_shared/marketingOfferAction';

const campaign = {
  cta_url: '/dashboard',
  cta_label: 'Start my first practice',
  metadata: { lifecycle_stage: 'signup' },
};
const offer = { code: 'START20A7C4E92B', expiresAt: '2026-11-04T12:00:00Z', discountPercent: 20 };
const now = Date.parse('2026-11-03T12:00:00Z');

describe('signup offer checkout action', () => {
  it('takes an active signup offer directly to Premium monthly checkout', () => {
    const action = getCampaignAction(campaign, offer, now);
    const url = new URL(action.url, 'https://www.ieltsai.pro');
    expect(url.pathname).toBe('/pricing');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      plan: 'premium',
      interval: 'monthly',
      checkout: '1',
    });
    expect(action.label).toBe('Premium monthly · 20% off');
  });
  it('retains the practice action when the offer has expired or is unavailable', () => {
    for (const value of [
      null,
      { ...offer, expiresAt: new Date(now).toISOString() },
      { ...offer, expiresAt: 'bad' },
    ]) {
      expect(getCampaignAction(campaign, value, now)).toEqual({
        url: '/dashboard',
        label: 'Start my first practice',
      });
    }
  });
  it('keeps other campaigns unchanged', () => {
    expect(
      getCampaignAction({ ...campaign, metadata: { lifecycle_stage: 'quota' } }, offer, now)
    ).toEqual({ url: '/dashboard', label: 'Start my first practice' });
  });
});
