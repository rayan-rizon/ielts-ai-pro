import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260808165249_admin_marketing_hub.sql'),
  'utf8'
);
const templatesMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260808173040_add_marketing_campaign_templates.sql'),
  'utf8'
);
const builtinCampaignsMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260808174528_seed_builtin_marketing_campaigns.sql'),
  'utf8'
);
const conversionSetupMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260808182048_configure_marketing_conversion_journeys.sql'
  ),
  'utf8'
);
const checkoutRecoveryMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260809042731_checkout_recovery_engine.sql'),
  'utf8'
);
const checkoutSession = readFileSync(
  resolve(process.cwd(), 'supabase/functions/create-checkout-session/index.ts'),
  'utf8'
);
const pricing = readFileSync(
  resolve(process.cwd(), 'src/features/subscription/pages/Pricing.jsx'),
  'utf8'
);
const toaster = readFileSync(resolve(process.cwd(), 'src/components/ui/sonner.jsx'), 'utf8');
const dispatcher = readFileSync(
  resolve(process.cwd(), 'supabase/functions/marketing-campaign-dispatch/index.ts'),
  'utf8'
);
const tracker = readFileSync(
  resolve(process.cwd(), 'supabase/functions/marketing-track/index.ts'),
  'utf8'
);
const stripeWebhook = readFileSync(
  resolve(process.cwd(), 'supabase/functions/stripe-webhook/index.ts'),
  'utf8'
);
const resendWebhook = readFileSync(
  resolve(process.cwd(), 'supabase/functions/resend-marketing-webhook/index.ts'),
  'utf8'
);
const marketingService = readFileSync(
  resolve(process.cwd(), 'src/features/admin/services/MarketingService.js'),
  'utf8'
);
const marketingHub = readFileSync(
  resolve(process.cwd(), 'src/components/admin/marketing/MarketingHub.jsx'),
  'utf8'
);

describe('Admin Marketing Hub contracts', () => {
  it('keeps campaign writes admin-only and learner delivery reads owner-scoped', () => {
    expect(migration).toContain('marketing_campaigns_admin_all');
    expect(migration).toContain('marketing_deliveries_owner_select');
    expect(migration).toContain('user_id = (SELECT public.get_my_public_user_id())');
    expect(migration).toContain('REVOKE ALL ON public.marketing_segments');
  });

  it('enforces consent, cooldowns, caps, and scheduler authentication', () => {
    expect(dispatcher).toContain("channel === 'email' && !member.consent_marketing");
    expect(dispatcher).toContain("'marketing_consent_required'");
    expect(dispatcher).toContain('campaignRows.length >= campaign.frequency_cap');
    expect(dispatcher).toContain("req.headers.get('X-Scheduler-Secret')");
    expect(migration).toContain("'hourly-marketing-journeys'");
  });

  it('deduplicates the funnel and uses token-bound email tracking', () => {
    expect(migration).toContain('marketing_events_dedupe_idx');
    expect(migration).toContain('tracking_token uuid NOT NULL');
    expect(tracker).toContain(".eq('tracking_token', token)");
    expect(tracker).toContain('`${delivery.id}:${eventType}`');
    expect(resendWebhook).toContain("req.headers.get('svix-signature')");
    expect(resendWebhook).toContain("'email.delivered': 'delivered'");
    expect(resendWebhook).toContain('`resend:${svixId}`');
  });

  it('attributes revenue only from server-confirmed settlement handling', () => {
    expect(stripeWebhook).toContain('recordMarketingPurchase');
    expect(stripeWebhook).toContain("event_type: 'purchased'");
    expect(migration).toContain('marketing_attribute_manual_payment');
    expect(migration).toContain("NEW.status = 'approved'");
  });

  it('keeps currency totals separate and exposes required intelligence RPCs', () => {
    expect(migration).toContain('GROUP BY marketing_campaign_id, currency');
    expect(migration).toContain('get_marketing_offer_intelligence');
    expect(migration).toContain('get_marketing_breakdowns');
    expect(migration).toContain('get_marketing_journey_metrics');
  });

  it('provides editable, admin-only campaign templates without automatic delivery', () => {
    expect(templatesMigration).toContain('CREATE TABLE public.marketing_campaign_templates');
    expect(templatesMigration).toContain('marketing_templates_admin_all');
    expect(templatesMigration).toContain('Finish your first practice');
    expect(templatesMigration).toContain('Continue your IELTS progress');
    expect(templatesMigration).toContain('Templates are never dispatched');
  });

  it('keeps error notifications readable in the resolved app theme', () => {
    expect(toaster).toContain("const { resolvedTheme = 'light' } = useTheme()");
    expect(toaster).toContain('theme={resolvedTheme}');
    expect(toaster).toContain('!bg-white');
    expect(toaster).toContain('dark:!bg-[#18171d]');
  });

  it('pins the campaign promo embed to its direct foreign key', () => {
    expect(marketingService).toContain('promo_codes!marketing_campaigns_promo_code_id_fkey');
    expect(dispatcher).toContain('promo_codes!marketing_campaigns_promo_code_id_fkey');

    const selectPayload = marketingService.match(/const CAMPAIGN_SELECT = `([\s\S]*?)`;/)?.[1];
    expect(selectPayload).toBeTruthy();
    expect(selectPayload).not.toContain('//');
    expect(selectPayload?.replace(/\s+/g, '')).toBe(
      '*,segment:marketing_segments(id,name,description,rules),promo:promo_codes!marketing_campaigns_promo_code_id_fkey(id,code,label,discount_type,discount_value)'
    );
  });

  it('lets admins toggle a built-in segment without editing its rules', () => {
    expect(marketingHub).toContain('Toggle ${segment.name}');
    expect(marketingHub).toContain(
      'MarketingService.updateSegment(segment.id, { is_active: isActive })'
    );
  });

  it('seeds editable built-in campaigns in a safe paused state', () => {
    expect(builtinCampaignsMigration).toContain("'paused'");
    expect(builtinCampaignsMigration).toContain('Welcome: complete your first practice');
    expect(builtinCampaignsMigration).toContain('Free learners ready to upgrade');
    expect(builtinCampaignsMigration).toContain('Returning learners after two weeks');
  });

  it('configures every conversion journey with an active campaign and the right channels', () => {
    expect(conversionSetupMigration).toContain(
      "status = CASE WHEN spec->>'objective' = 'paid_conversion' THEN 'active' ELSE 'paused' END"
    );
    expect(conversionSetupMigration).toContain(
      "is_active = spec->>'objective' = 'paid_conversion'"
    );
    expect(conversionSetupMigration).toContain('"trigger":"signup_incomplete"');
    expect(conversionSetupMigration).toContain('"trigger":"exam_upcoming"');
    expect(conversionSetupMigration).toContain('"trigger":"payment_failed"');
    expect(conversionSetupMigration).toContain('"channels":["in_app"]');
    expect(conversionSetupMigration).toContain('"channels":["in_app","banner","email"]');
    expect(conversionSetupMigration).toContain('"name":"Auto: checkout reminder"');
    expect(conversionSetupMigration).toContain('automatic discount');
  });

  it('uses a three-column desktop layout for dense marketing card views', () => {
    const threeColumnGrids = marketingHub.match(/xl:grid-cols-3/g) || [];
    expect(threeColumnGrids.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps the conversion campaign workflow visible and previewable', () => {
    expect(marketingHub).toContain('const EmailPreviewDialog');
    expect(marketingHub).toContain('Email preview');
    expect(marketingHub).toContain('Inbox subject');
    expect(marketingHub).toContain('Hi alex');
    expect(marketingHub).toContain('src="/footer.svg"');
    expect(marketingHub).toContain('target band');
    expect(marketingHub).toContain("const aCore = a.objective === 'paid_conversion' ? 0 : 1");
    expect(marketingHub).toContain('Paid conversion is the live focus');
    expect(marketingHub).toContain('From delivery to paid learner');
    expect(marketingHub).toContain('Checkout started');
    expect(dispatcher).toContain("const baseUrl = 'https://ieltsai.pro'");
    expect(dispatcher).toContain('${baseUrl}/footer.svg');
    expect(dispatcher).toContain("select('id,username')");
    expect(dispatcher).toContain('recipient.username');
    expect(dispatcher).toContain('Your progress and practice history are saved in your account');
  });

  it('runs a two-hour checkout recovery offer without issuing a shared promo code', () => {
    expect(checkoutRecoveryMigration).toContain('checkout_abandoned_hours_min":2');
    expect(checkoutRecoveryMigration).toContain('checkout_recovery_offer_percent');
    expect(checkoutRecoveryMigration).toContain("'quarter-hour-marketing-journeys'");
    expect(checkoutRecoveryMigration).toContain('provision_checkout_recovery_offer');
    expect(checkoutRecoveryMigration).toContain('assigned_user_id');
    expect(checkoutRecoveryMigration).toContain("interval '7 days'");
    expect(checkoutRecoveryMigration).toContain("'automatic_discount', true");
    expect(checkoutRecoveryMigration).toContain('latest checkout event');
    expect(dispatcher).toContain('issuesCheckoutRecoveryOffer');
    expect(dispatcher).toContain('p_campaign_id: campaign.id');
    expect(dispatcher).toContain("destination.searchParams.set('promo', offer.code)");
    expect(checkoutSession).toContain('assigned_user_id === userData.id');
    expect(pricing).toContain("params.get('promo')");
    expect(pricing).toContain("supabase.rpc('redeem_promo_code'");
  });

  it('puts the live checkout recovery snapshot in analytics', () => {
    expect(marketingService).toContain('getCheckoutRecoveryDashboard');
    expect(marketingHub).toContain('const CheckoutRecoverySnapshot');
    expect(marketingHub).toContain('Two-hour 15% offer recovery');
    expect(marketingHub).toContain('Eligible now');
    expect(marketingHub).toContain('Recovery sent');
  });
});
