import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260913120000_subscription_growth_cockpit.sql');
const pricing = read('src/features/subscription/pages/Pricing.jsx');
const service = read('src/features/admin/services/MarketingService.js');
const worker = read('supabase/functions/retention-autopilot/index.ts');

describe('Subscription growth cockpit contracts', () => {
  it('stores account-scoped pricing intent without personal data', () => {
    expect(migration).toContain('public.get_my_public_user_id()');
    expect(migration).toContain("p_metadata, '{}'::jsonb) - 'email' - 'name' - 'user_id'");
    expect(migration).toContain('UNIQUE (user_id, event_type, dedupe_key)');
    expect(migration).toContain('REVOKE ALL ON TABLE public.subscription_funnel_events');
    expect(migration).toContain('TO authenticated;');
  });

  it('separates August history from the newer pricing-intent coverage', () => {
    expect(migration).toContain("'2026-08-01 00:00:00+00'");
    expect(migration).toContain("'intent_tracking_from'");
    expect(migration).toContain('Pricing views and plan selections are first-party only');
    expect(service).toContain('get_subscription_growth_dashboard');
  });

  it('counts the requested countries, funnel, plan demand, and cohorts', () => {
    for (const value of [
      "'stages'",
      "'countries'",
      "'selected_plans'",
      "'at_risk_paid'",
      "'broken_streak'",
      "'exam_countdown'",
      "'high_intent_free'",
      "'score_plateau'",
    ]) {
      expect(migration).toContain(value);
    }
    expect(migration).toContain("b.status IN ('completed', 'paid', 'succeeded', 'approved')");
  });

  it('captures pricing view, selection, checkout start, and checkout failure', () => {
    for (const event of [
      'pricing_viewed',
      'plan_selected',
      'checkout_started',
      'checkout_failed',
    ]) {
      expect(pricing).toContain(`recordSubscriptionFunnel('${event}'`);
    }
  });

  it('feeds growth facts to the grounded daily AI analysis', () => {
    expect(worker).toContain('get_subscription_growth_dashboard');
    expect(worker).toContain('primary subscription-growth and retention operations analyst');
    expect(worker).toContain('factMap.has(item.metric_id)');
    expect(worker).toContain('Automatic discounts, invented credits, pressure');
  });
});
