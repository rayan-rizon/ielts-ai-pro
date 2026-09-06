import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260906014911_personalized_retention_autopilot.sql');
const coordinatorMigration = read(
  'supabase/migrations/20260906024932_make_retention_autopilot_primary_coordinator.sql'
);
const worker = read('supabase/functions/retention-autopilot/index.ts');
const dispatcher = read('supabase/functions/marketing-campaign-dispatch/index.ts');
const learnerSurface = read('src/features/marketing/components/LearnerMarketingSurface.jsx');
const deliveryService = read('src/features/marketing/services/MarketingDelivery.js');
const adminPanel = read('src/components/admin/marketing/AutopilotPanel.jsx');
const marketingService = read('src/features/admin/services/MarketingService.js');
const checkout = read('supabase/functions/create-checkout-session/index.ts');
const stripeWebhook = read('supabase/functions/stripe-webhook/index.ts');

describe('Personalized retention autopilot contracts', () => {
  it('ships all playbooks disabled and review-first', () => {
    for (const playbook of [
      'score_plateau',
      'incomplete_test',
      'exam_countdown',
      'checkout_recovery',
    ]) {
      expect(migration).toContain(`'${playbook}'`);
    }
    expect(migration).toContain('enabled boolean NOT NULL DEFAULT false');
    expect(migration).toContain("mode text NOT NULL DEFAULT 'review'");
  });

  it('keeps learner state owner-scoped and privileged records admin-only', () => {
    expect(migration).toContain('learner_preferences_owner_select');
    expect(migration).toContain('push_owner_insert');
    expect(migration).toContain('user_id = public.get_my_public_user_id()');
    expect(migration).toContain('autopilot_policies_admin_update');
    expect(migration).toContain('recommendations_admin_all');
    expect(migration).toContain('FROM PUBLIC, anon, authenticated');
  });

  it('lets the trusted worker analyze while retaining the admin-only browser boundary', () => {
    expect(coordinatorMigration).toContain(
      "current_setting('request.jwt.claim.role', true) = 'service_role'"
    );
    expect(coordinatorMigration).toMatch(/IF NOT \(\s*public\.is_admin\(\)\s*OR/);
    expect(coordinatorMigration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_marketing_autopilot_snapshot\(integer\)\s+TO authenticated, service_role/
    );
  });

  it('makes Autopilot the single owner of overlapping retention contact', () => {
    expect(coordinatorMigration).toContain('set_marketing_autopilot_policy_state');
    expect(coordinatorMigration).toContain("'superseded_by_autopilot'");
    expect(coordinatorMigration).toContain("'{inactivity_warning}'");
    expect(coordinatorMigration).toContain("'{trial_expiry}'");
    expect(coordinatorMigration).toContain('false');
    expect(marketingService).toContain("supabase.rpc('set_marketing_autopilot_policy_state'");
    expect(coordinatorMigration).toContain("'Score improvement support'");
    expect(adminPanel).not.toContain('Playbooks enabled');
    expect(adminPanel).not.toContain('Score Plateau Breaker');
  });

  it('does not use learner-reported feelings for commercial eligibility', () => {
    expect(migration).toContain('must not be used to target commercial offers');
    expect(worker).not.toMatch(/preference\.feeling|preference\?\.feeling/);
  });

  it('requires distinct comparable results and supported weakness evidence', () => {
    expect(worker).toContain('item.passage_id === session.passage_id');
    expect(worker).toContain(
      "`${session.test_type || session.module}:${session.test_mode || 'practice'}`"
    );
    expect(worker).toContain('value.attempts >= minimum && value.sessions.size >= 2');
    expect(worker).toContain('no question type met the evidence threshold');
  });

  it('resumes saved progress without exposing correctness or predicted score', () => {
    expect(worker).toContain('answeredCount(session.user_responses)');
    expect(worker).toContain("title: 'Your progress is saved'");
    expect(worker).not.toMatch(/18\/20|unlock your.*band/i);
  });

  it('uses only confirmed exam dates for countdown interventions', () => {
    expect(worker).toContain("user.test_date_source !== 'confirmed'");
    expect(migration).toContain("test_date_source IN ('unknown', 'estimated', 'confirmed')");
  });

  it('coordinates contact limits across existing campaigns and autopilot', () => {
    expect(worker).toContain('contacts.length >= 2');
    expect(worker).toContain('hoursAgo(c.created_at) < 72');
    expect(dispatcher).toContain('cross_channel_contact_cap');
    expect(dispatcher).toContain('cross_channel_cooldown');
    expect(dispatcher).toContain('upgrade_promotion_cap');
    expect(worker).toContain('isExternalContactWindow');
    expect(worker).toContain("source: 'legacy_scheduled_email'");
    expect(worker).toContain(".from('email_delivery_events')");
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('marketing_contact_reservations');
  });

  it('adds push only with opt-in storage, delivery, and cleanup', () => {
    expect(migration).toContain("CHECK (channel IN ('in_app', 'banner', 'email', 'push'))");
    expect(migration).toContain('marketing_push_subscriptions');
    expect(deliveryService).toContain('Notification.requestPermission()');
    expect(deliveryService).toContain('disablePush');
    expect(migration).toContain('replace_my_marketing_push_subscription');
    expect(worker).toContain('[404, 410]');
    expect(worker).toContain("body: 'Your next practice activity is ready.'");
  });

  it('keeps checkout assistance and the approved 15 percent offer in one intervention', () => {
    expect(worker).toContain("policy.playbook_key === 'checkout_recovery'");
    expect(worker).toContain("? 'in_app'");
    expect(worker).toContain('provision_autopilot_checkout_offer');
    expect(migration).toContain("'percentage', 15");
    expect(worker).toContain('promo_code: offer.code');
    expect(migration).toContain('marketing_checkout_intents');
    expect(checkout).toContain("status: 'initiated'");
    expect(stripeWebhook).toContain("status: 'settled'");
  });

  it('records actual in-app exposure and persists learner controls', () => {
    expect(learnerSurface).toContain('entry.intersectionRatio >= 0.5');
    expect(learnerSurface).toContain("visibility: '50_percent_1_second'");
    expect(learnerSurface).toContain('Remind me next week');
    expect(learnerSurface).toContain('Not interested');
    expect(deliveryService).toContain('record_marketing_contact_feedback');
    expect(deliveryService).not.toContain('localStorage');
  });

  it('provides admin monitoring, evidence, review, and quiet decisions', () => {
    expect(adminPanel).toContain('Observe, help, measure');
    expect(adminPanel).toContain('What deserves attention');
    expect(adminPanel).toContain('Stayed quiet');
    expect(adminPanel).toContain('Approve');
    expect(worker).toContain('claim causality, diagnose emotions');
    expect(worker).toContain('experiment_holdout');
    expect(worker).toContain("body.action === 'generate_copy'");
    expect(worker).toContain("status: 'needs_approval'");
    expect(adminPanel).toContain('AI copy draft refreshed for review');
  });

  it('stores only evidence-grounded recommendations in familiar language', () => {
    expect(worker).toContain('<allowed_evidence_facts>');
    expect(worker).toContain('factMap.has(item.metric_id)');
    expect(worker).toContain('recommendation.sample_size > 0');
    expect(worker).toContain('never expose internal keys or the word "playbook"');
    expect(worker).toContain('groundedRecommendations.length');
    expect(worker).toContain('recommendations: groundedRecommendations');
  });
});
