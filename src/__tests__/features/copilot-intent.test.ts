import { describe, it, expect } from 'vitest';
import { pricingIntentCandidate } from '../../../supabase/functions/_shared/copilotIntent';

const now = Date.parse('2026-09-13T12:00:00Z');
const user = { id: 'learner', subscription_tier: 'free' };
const event = {
  event_type: 'plan_selected',
  plan_tier: 'premium',
  occurred_at: '2026-09-13T11:00:00Z',
};
describe('Pricing intent actions', () => {
  it('prepares useful help after a plan selection, with a stable dedupe key', () => {
    const first = pricingIntentCandidate(user, [event], null, now);
    expect(first.destination).toBe('/pricing');
    expect(first.evidence[0]).toEqual({ metric: 'plan_selected', value: 'premium' });
    expect(first.content.title).toContain('20%');
    expect(first.content.message).toContain('48 hours');
    expect(first.evidence).toContainEqual({ metric: 'offer_discount_percent', value: 20 });
    expect(pricingIntentCandidate(user, [event], null, now + 1000).dedupeKey).toBe(first.dedupeKey);
  });
  it('does not infer intent from one pricing view, fresh clicks, or old events', () => {
    expect(
      pricingIntentCandidate(user, [{ ...event, event_type: 'pricing_viewed' }], null, now)
    ).toBeNull();
    expect(
      pricingIntentCandidate(user, [{ ...event, occurred_at: '2026-09-13T11:50:00Z' }], null, now)
    ).toBeNull();
    expect(
      pricingIntentCandidate(user, [{ ...event, occurred_at: '2026-08-01T11:00:00Z' }], null, now)
    ).toBeNull();
  });
  it('does not compete with an existing checkout or contact a paid subscriber', () => {
    expect(pricingIntentCandidate(user, [event], { status: 'pending' }, now)).toBeNull();
    expect(
      pricingIntentCandidate({ ...user, subscription_tier: 'premium' }, [event], null, now)
    ).toBeNull();
  });
});
