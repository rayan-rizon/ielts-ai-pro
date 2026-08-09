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
// The hub was split out of one 1,900-line file; each panel is now its own
// module, so these contracts assert against the module that actually owns the
// behaviour rather than one giant string.
const marketingFile = (name: string) =>
  readFileSync(resolve(process.cwd(), `src/components/admin/marketing/${name}`), 'utf8');
const campaignsPanel = marketingFile('CampaignsPanel.jsx');
const segmentsPanel = marketingFile('SegmentsPanel.jsx');
const analyticsPanel = marketingFile('AnalyticsPanel.jsx');
const commandStrip = marketingFile('CommandStrip.jsx');
const emailPreviewDialog = marketingFile('dialogs/EmailPreviewDialog.jsx');
const marketingPanels = [
  campaignsPanel,
  segmentsPanel,
  analyticsPanel,
  marketingFile('TemplatesPanel.jsx'),
  marketingFile('JourneysPanel.jsx'),
];
const emailTemplates = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/templates.ts'),
  'utf8'
);
const customerPortal = readFileSync(
  resolve(process.cwd(), 'supabase/functions/create-customer-portal/index.ts'),
  'utf8'
);
const resend = readFileSync(resolve(process.cwd(), 'supabase/functions/_shared/resend.ts'), 'utf8');
const unsubscribeFn = readFileSync(
  resolve(process.cwd(), 'supabase/functions/marketing-unsubscribe/index.ts'),
  'utf8'
);
const optOutMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260809140000_marketing_email_opt_out.sql'),
  'utf8'
);
const settingsPage = readFileSync(
  resolve(process.cwd(), 'src/features/settings/pages/Settings.jsx'),
  'utf8'
);
const scheduledEmails = readFileSync(
  resolve(process.cwd(), 'supabase/functions/scheduled-emails/index.ts'),
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
    expect(segmentsPanel).toContain('Toggle ${segment.name}');
    expect(segmentsPanel).toContain(
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

  it('uses a progressively denser desktop layout for marketing card views', () => {
    // Card grids step 1/2/3/4 columns at sm/lg/xl so a wide desktop reaches
    // four cards per row instead of stalling at three. Every card-grid panel
    // must follow the same stepping — an outlier reads as a layout bug.
    const denseGrids = marketingPanels.flatMap(
      (source) => source.match(/grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/g) || []
    );
    expect(denseGrids.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps the conversion campaign workflow visible and previewable', () => {
    expect(emailPreviewDialog).toContain('const EmailPreviewDialog');
    expect(emailPreviewDialog).toContain('Email preview');
    expect(emailPreviewDialog).toContain('Inbox subject');
    expect(emailPreviewDialog).toContain('Hi alex');
    expect(emailPreviewDialog).toContain('src="/footer.png"');
    expect(emailPreviewDialog).toContain('target band');
    expect(campaignsPanel).toContain("(c.objective === 'paid_conversion' ? 0 : 1)");
    // The "paid conversion first" framing moved from a banner inside the
    // campaigns tab to the always-visible command strip, so it is stated even
    // when the operator is looking at another tab.
    expect(commandStrip).toContain('No paid-conversion campaign is live');
    expect(analyticsPanel).toContain('From delivery to paid learner');
    expect(analyticsPanel).toContain('Checkout started');
    expect(dispatcher).toContain("select('id,username')");
    expect(dispatcher).toContain('recipient.username');
    // Campaign mail renders through the shared shell now, so the brand header
    // and the closing reassurance line live in templates.ts, not the dispatcher.
    expect(dispatcher).toContain('getCampaignTemplate');
    expect(emailTemplates).toContain('${baseUrl}/footer.png');
    expect(emailTemplates).toContain(
      'Your progress and practice history stay saved in your account'
    );
  });

  it('serves email logos and links from the host that actually answers', () => {
    // The apex `ieltsai.pro` has DNS records but nothing listening, so anything
    // built from it times out. Every outbound URL must use `www`.
    expect(emailTemplates).toContain("const BASE_URL = 'https://www.ieltsai.pro'");
    expect(emailTemplates).not.toContain("'https://ieltsai.pro'");
    expect(checkoutSession).toContain("Deno.env.get('FRONTEND_URL') || 'https://www.ieltsai.pro'");
    expect(customerPortal).toContain("Deno.env.get('FRONTEND_URL') || 'https://www.ieltsai.pro'");

    // Gmail, Outlook and Yahoo do not render SVG in email — the mark must be a
    // raster, and every auth template must use the same one.
    // Match the URL form, not the word — the shell's comment explains why the
    // SVG was dropped and legitimately names the file.
    expect(emailTemplates).not.toContain('/footer.svg');
    for (const template of [
      'confirm-signup',
      'magic-link',
      'reset-password',
      'email-change',
      'invite',
      'password-changed',
    ]) {
      const html = readFileSync(resolve(process.cwd(), `supabase/emails/${template}.html`), 'utf8');
      expect(html, template).toContain('https://www.ieltsai.pro/footer.png');
      expect(html, template).not.toContain('footer.svg');
    }
  });

  it('sends a plain-text alternative alongside every HTML email', () => {
    // An HTML-only body is a long-standing spam heuristic; Resend only produces
    // a multipart message when `text` is supplied.
    expect(emailTemplates).toContain('text: wrapText(');
    expect(resend).toContain('...(text ? { text } : {})');
    for (const caller of [stripeWebhook, scheduledEmails, dispatcher]) {
      expect(caller).toContain('text:');
    }
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

  it('gives every marketing email a working, token-authenticated unsubscribe', () => {
    // The footer used to link to `/settings?tab=preferences`, which matched no
    // Settings tab — the page fell back to Profile and opting out was
    // impossible. Both halves of that must stay fixed: a real endpoint, and a
    // real tab for the link to land on.
    expect(unsubscribeFn).toContain('unsubscribe_marketing_email');
    expect(unsubscribeFn).toContain("req.method === 'POST'");
    expect(optOutMigration).toContain('marketing_email_unsubscribed_at');
    expect(optOutMigration).toContain(
      'AND (NOT p_require_marketing_consent OR u.marketing_email_unsubscribed_at IS NULL)'
    );
    expect(settingsPage).toContain("id: 'preferences'");
    expect(settingsPage).toContain("activeTab === 'preferences'");

    // Marketing mail must carry the per-delivery URL, not the generic page,
    // and the RFC 8058 headers Gmail/Yahoo require of bulk senders.
    expect(dispatcher).toContain('unsubscribeEndpoint(delivery.id, delivery.tracking_token)');
    expect(dispatcher).toContain('headers: unsubscribeHeaders(unsubscribeUrl)');
    expect(resend).toContain("'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'");
    expect(emailTemplates).toContain('unsubscribeUrl');

    // Email eligibility must never read the cookie banner's toggle again.
    expect(optOutMigration).not.toContain('COALESCE(u.consent_marketing, false))');
  });

  it('puts the live checkout recovery snapshot in analytics', () => {
    expect(marketingService).toContain('getCheckoutRecoveryDashboard');
    expect(analyticsPanel).toContain('const RecoveryPanel');
    expect(analyticsPanel).toContain('Two-hour 15% offer');
    expect(analyticsPanel).toContain('Eligible now');
    expect(analyticsPanel).toContain('Offer sent');
    expect(analyticsPanel).toContain('Recovered');
    // An unconfigured recovery engine is silent failure — the hub must say so.
    expect(commandStrip).toContain('Checkout recovery is not configured');
  });
});
