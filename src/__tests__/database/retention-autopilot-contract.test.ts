import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const migration = read('supabase/migrations/20260906014911_personalized_retention_autopilot.sql');
const coordinatorMigration = read(
  'supabase/migrations/20260906024932_make_retention_autopilot_primary_coordinator.sql'
);
const journeyExpansionMigration = read(
  'supabase/migrations/20260906031224_expand_retention_autopilot_journeys.sql'
);
const deliveryStrategyMigration = read(
  'supabase/migrations/20260906163336_refine_autopilot_delivery_strategy.sql'
);
const offerMigration = read(
  'supabase/migrations/20260920215530_add_20_percent_retention_offer.sql'
);
const worker = read('supabase/functions/retention-autopilot/index.ts');
const dispatcher = read('supabase/functions/marketing-campaign-dispatch/index.ts');
const learnerSurface = [
  'src/features/marketing/components/LearnerMarketingSurface.jsx',
  'src/features/marketing/components/LearnerInAppNotification.jsx',
  'src/features/marketing/components/InAppNotificationCard.jsx',
  'src/features/marketing/hooks/useVisibleImpression.js',
]
  .map(read)
  .join('\n');
const deliveryService = read('src/features/marketing/services/MarketingDelivery.js');
const adminPanel = read('src/components/admin/marketing/AutopilotPanel.jsx');
const marketingService = read('src/features/admin/services/MarketingService.js');
const checkout = read('supabase/functions/create-checkout-session/index.ts');
const stripeWebhook = read('supabase/functions/stripe-webhook/index.ts');

describe('Personalized retention autopilot contracts', () => {
  it('ships the full learner journey set disabled and review-first', () => {
    for (const playbook of [
      'first_practice',
      'next_practice',
      'subscriber_feature_help',
      'quota_upgrade',
      're_engagement',
      'cancellation_support',
      'referral_bonus_reminder',
      'score_plateau',
      'incomplete_test',
      'exam_countdown',
      'checkout_recovery',
    ]) {
      expect(`${migration}\n${journeyExpansionMigration}`).toContain(`'${playbook}'`);
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
    expect(worker).toContain('answers saved`');
    expect(worker).toContain("cta_label: 'Resume my test'");
    expect(worker).not.toMatch(/18\/20|unlock your.*band/i);
  });

  it('reads only the JSON fields needed for retention decisions', () => {
    const reconcile = worker.slice(worker.indexOf('async function reconcile('));
    const sessionRead = reconcile.match(
      /\.from\('test_sessions'\)\s*\.select\(\s*'([^']+)'\s*\)\s*\.gte\('created_at'/
    )?.[1];
    const pathRead = reconcile.match(/\.from\('learning_paths'\)\s*\.select\('([^']+)'\)/)?.[1];

    expect(sessionRead).toBeDefined();
    expect(pathRead).toBeDefined();
    expect(sessionRead?.split(',')).toEqual(
      expect.arrayContaining([
        'user_responses',
        'type_stats:content_data->typeStats',
        'question_type_accuracy:content_data->question_type_accuracy',
        'scheduled_break_until:content_data->scheduled_break_until',
        'total_questions:content_data->total_questions',
        'question_count:content_data->question_count',
      ])
    );
    expect(sessionRead?.split(',')).not.toContain('content_data');
    expect(pathRead?.split(',')).toContain('goal_snapshot:path_data->goal_snapshot');
    expect(pathRead?.split(',')).not.toContain('path_data');
    expect(worker).toContain('typeStats: session.type_stats');
    expect(worker).toContain('path_data: { goal_snapshot: path.goal_snapshot }');
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
    expect(dispatcher).toContain('chooseJourneyChannel');
    expect(dispatcher).toMatch(/journey\s*\?\s*\[\s*chooseJourneyChannel/);
  });

  it('chooses one policy-specific channel and explains the active and away routes in the admin UI', () => {
    expect(journeyExpansionMigration).toContain("'channel_priority'");
    expect(worker).toContain('channelPriority');
    expect(worker).toContain('deliveryStrategy');
    expect(worker).toContain('email is attempted first');
    expect(worker).toContain('return channel;');
    expect(adminPanel).toContain('Show on the next eligible visit');
    expect(adminPanel).toContain('Send after approval, if still eligible');
    expect(deliveryStrategyMigration).toContain("'exam_countdown'");
    expect(deliveryStrategyMigration).toContain('\'["banner"]\'::jsonb');
    expect(deliveryStrategyMigration).toContain('\'["email", "push"]\'::jsonb');
  });

  it('returns a useful privacy-safe preview instead of only a toast count', () => {
    expect(worker).toContain('automation_preview');
    expect(worker).toContain('suppressed_by_reason');
    expect(adminPanel).toContain('Nothing sent.');
    expect(adminPanel).toContain('prepared.suppressed');
  });

  it('implements the additional learner situations from the extended plan', () => {
    expect(worker).toContain('firstPracticeCandidate');
    expect(worker).toContain('nextPracticeCandidate');
    expect(worker).toContain('subscriberFeatureCandidate');
    expect(worker).toContain('quotaUpgradeCandidate');
    expect(worker).toContain('reEngagementCandidate');
    expect(worker).toContain('cancellationSupportCandidate');
    expect(worker).toContain('referralBonusCandidate');
  });

  it('adds push only with opt-in storage, delivery, and cleanup', () => {
    expect(migration).toContain("CHECK (channel IN ('in_app', 'banner', 'email', 'push'))");
    expect(migration).toContain('marketing_push_subscriptions');
    expect(deliveryService).toContain('Notification.requestPermission()');
    expect(deliveryService).toContain('disablePush');
    expect(migration).toContain('replace_my_marketing_push_subscription');
    expect(worker).toContain('[404, 410]');
    expect(worker).toContain("title: candidate.content.title || 'IELTS AI Pro'");
    expect(worker).toContain("body: candidate.content.message || 'Your next IELTS step is ready.'");
  });

  it('provisions an approved 20 percent offer in the same high-intent intervention', () => {
    expect(worker).toContain("policy.playbook_key === 'checkout_recovery'");
    expect(journeyExpansionMigration).toContain(
      `WHEN 'checkout_recovery' THEN jsonb_build_array('in_app','email')`
    );
    expect(worker).toContain('chooseChannel(policy, preference, activeRecently, user)');
    expect(worker).toContain('provision_autopilot_subscription_offer');
    expect(offerMigration).toContain("'percentage', 20");
    expect(offerMigration).toContain("interval '48 hours'");
    expect(offerMigration).toContain("item->>'metric' IN ('plan_selected', 'pricing_visits')");
    expect(worker).toContain('promo_code: offer.code');
    expect(worker).toContain('offerDurationHours === 48');
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
    expect(adminPanel).toContain('Results monitor');
    expect(adminPanel).toContain('Priority actions');
    expect(adminPanel).toContain('Held back');
    expect(adminPanel).toContain('Approve message');
    expect(worker).toContain('claim causality, diagnose emotions');
    expect(worker).toContain('experiment_holdout');
    expect(worker).toContain("body.action === 'generate_copy'");
    expect(worker).toContain("status: 'needs_approval'");
    expect(adminPanel).toContain('New draft ready to review');
  });

  it('loads the learner through the intervention user foreign key during review', () => {
    expect(worker).toContain(
      'user:users!marketing_interventions_user_id_fkey(id,email,full_name,marketing_email_unsubscribed_at)'
    );
  });

  it('stores only evidence-grounded recommendations in familiar language', () => {
    expect(worker).toContain('<allowed_evidence_facts>');
    expect(worker).toContain('factMap.has(item.metric_id)');
    expect(worker).toContain('recommendation.sample_size > 0');
    expect(worker).toContain('never expose internal keys or the word "playbook"');
    expect(worker).toContain('groundedRecommendations.length');
    expect(worker).toContain('recommendations: groundedRecommendations');
    expect(worker).toContain("RETENTION_ANALYSIS_VERSION = '2026-09-21-lifecycle-experiment-v4'");
    expect(worker).toContain('Prefer repairing product friction at the losing stage');
    expect(worker).toContain('A selected plan is intent, not payment.');
  });

  it('uses GLM for every AI task in the Marketing Autopilot', () => {
    expect(worker.match(/openRouterModel: 'z-ai\/glm-5\.3-flash'/g)).toHaveLength(4);
    expect(worker.match(/openRouterDisableReasoning: false/g)).toHaveLength(4);
  });
});
