import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sendEmail, unsubscribeHeaders } from '../_shared/resend.ts';
import { getCampaignTemplate } from '../_shared/templates.ts';
import { errorResponse, getCorsHeaders, handleCorsPrelight } from '../_shared/security.ts';
import {
  nextMarketingAttempt,
  readMarketingAudienceRows,
  reserveMarketingDelivery,
} from '../_shared/marketingDelivery.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(supabaseUrl, serviceKey);

/**
 * Token-authenticated opt-out for one delivery. Marketing mail must carry this:
 * it is the learner's only working unsubscribe, and the URL the mail client
 * uses for its own one-click control.
 */
const unsubscribeEndpoint = (deliveryId: string, token: string) => {
  const url = new URL(`${supabaseUrl}/functions/v1/marketing-unsubscribe`);
  url.searchParams.set('delivery_id', deliveryId);
  url.searchParams.set('token', token);
  return url.toString();
};

const trackingEndpoint = (deliveryId: string, token: string, event: string, target?: string) => {
  const url = new URL(`${supabaseUrl}/functions/v1/marketing-track`);
  url.searchParams.set('delivery_id', deliveryId);
  url.searchParams.set('token', token);
  url.searchParams.set('event', event);
  if (target) url.searchParams.set('target', target);
  return url.toString();
};

type CampaignOffer = {
  code: string;
  discountPercent?: number | null;
  expiresAt?: string | null;
  firstPaymentOnly?: boolean;
};

/**
 * Marketing emails now render through the same shell as every transactional
 * email (`_shared/templates.ts`). This used to be a full inline copy of the
 * document, which is how the two drifted: a fix to the footer, the button
 * treatment or the Outlook fallbacks only ever landed on one of them.
 */
const campaignEmail = (
  campaign: Record<string, any>,
  recipient: Record<string, any>,
  offer: CampaignOffer | null,
  clickUrl: string,
  openUrl: string,
  unsubscribeUrl: string
) =>
  getCampaignTemplate({
    title: campaign.title,
    message: campaign.message,
    subject: campaign.subject || campaign.title,
    objective: campaign.objective,
    lifecycleStage: campaign.metadata?.lifecycle_stage,
    ctaLabel: campaign.cta_label,
    recipientName: recipient.username?.trim() || 'there',
    clickUrl,
    openUrl,
    unsubscribeUrl,
    offer,
  });

async function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
  return profile?.role === 'admin';
}

async function requireScheduler(req: Request) {
  const token = req.headers.get('X-Scheduler-Secret');
  if (!token) return false;
  const { data, error } = await admin.rpc('verify_scheduled_email_token', { p_token: token });
  return !error && data === true;
}

async function mapLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  for (let index = 0; index < items.length; index += limit) {
    await Promise.all(items.slice(index, index + limit).map(task));
  }
}

function externalContactWindowOpen(preference: Record<string, any> | undefined, now: Date) {
  try {
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: preference?.timezone || 'Asia/Dhaka',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(now)
    );
    return hour >= 9 && hour < 19;
  } catch {
    return false;
  }
}

function chooseJourneyChannel(
  channels: string[],
  preference: Record<string, any> | undefined,
  member: Record<string, any>,
  triggerType: string | undefined,
  now: Date
) {
  const eligible = channels.filter((channel) => {
    if (['in_app', 'banner'].includes(channel)) return preference?.in_app_enabled !== false;
    if (channel === 'email')
      return (
        member.consent_marketing &&
        preference?.email_enabled !== false &&
        externalContactWindowOpen(preference, now)
      );
    return false;
  });
  const priority = ['inactivity', 'trial_expiry'].includes(String(triggerType))
    ? ['email', 'in_app', 'banner']
    : ['in_app', 'banner', 'email'];
  return priority.find((channel) => eligible.includes(channel)) || null;
}

async function dispatchCampaign(campaignId: string, journey: Record<string, any> | null = null) {
  const { data: campaign, error: campaignError } = await admin
    .from('marketing_campaigns')
    .select(
      '*, segment:marketing_segments(*), promo:promo_codes!marketing_campaigns_promo_code_id_fkey(id,code,discount_type,discount_value,is_signup_offer_template,assigned_user_id,is_active,valid_from,valid_until,offer_expires_at,max_uses,current_uses)'
    )
    .eq('id', campaignId)
    .single();
  if (campaignError || !campaign) throw new Error('Campaign not found');
  if (!['active', 'scheduled'].includes(campaign.status))
    throw new Error('Campaign must be active or scheduled');

  const now = new Date();
  if (campaign.starts_at && now < new Date(campaign.starts_at)) {
    return {
      campaign_id: campaign.id,
      audience: 0,
      accepted: 0,
      skipped: 0,
      failed: 0,
      reason: 'not_started',
    };
  }
  if (campaign.ends_at && now >= new Date(campaign.ends_at)) {
    await admin
      .from('marketing_campaigns')
      .update({ status: 'completed', completed_at: now.toISOString() })
      .eq('id', campaign.id);
    return {
      campaign_id: campaign.id,
      audience: 0,
      accepted: 0,
      skipped: 0,
      failed: 0,
      reason: 'ended',
    };
  }

  const promoExhausted =
    campaign.promo &&
    (!campaign.promo.is_active ||
      (campaign.promo.valid_until && campaign.promo.valid_until < now.toISOString().slice(0, 10)) ||
      (campaign.promo.max_uses && campaign.promo.current_uses >= campaign.promo.max_uses));
  if (promoExhausted) {
    await admin.from('marketing_campaigns').update({ status: 'paused' }).eq('id', campaign.id);
    return {
      campaign_id: campaign.id,
      audience: 0,
      accepted: 0,
      skipped: 0,
      failed: 0,
      reason: 'offer_exhausted',
    };
  }

  const segmentId = journey?.segment_id || campaign.segment_id;
  const { data: members, error: memberError } = await admin.rpc('marketing_segment_members', {
    p_segment_id: segmentId,
    p_require_marketing_consent: false,
    p_limit: 10000,
  });
  if (memberError) throw memberError;
  const audience = [
    ...new Map((members || []).map((member: any) => [member.user_id, member])).values(),
  ] as any[];
  const userIds = audience.map((member: any) => member.user_id);
  const usernameRows = await readMarketingAudienceRows(
    admin,
    'users',
    'id,username,promo_discount,used_promo_codes',
    userIds,
    'id'
  );
  const profiles = new Map((usernameRows || []).map((row: any) => [row.id, row]));
  const usernames = new Map((usernameRows || []).map((row: any) => [row.id, row.username]));
  const preferenceRows = await readMarketingAudienceRows(
    admin,
    'learner_marketing_preferences',
    '*',
    userIds,
    'user_id',
    'user_id'
  );
  const preferenceByUser = new Map((preferenceRows || []).map((row: any) => [row.user_id, row]));
  const history = await readMarketingAudienceRows(
    admin,
    'marketing_deliveries',
    'user_id,channel,campaign_id,attempt,status,failure_reason,created_at,campaign:marketing_campaigns(objective)',
    userIds
  );
  history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const existing = new Map<string, any[]>();
  const historyByUser = new Map<string, any[]>();
  (history || []).forEach((row: any) => {
    const key = `${row.user_id}:${row.channel}`;
    existing.set(key, [...(existing.get(key) || []), row]);
    historyByUser.set(row.user_id, [...(historyByUser.get(row.user_id) || []), row]);
  });

  const todayUtc = now.toISOString().slice(0, 10);
  const promo = campaign.promo;
  const staticOffer =
    promo?.code &&
    !promo.is_signup_offer_template &&
    promo.is_active &&
    (!promo.valid_from || promo.valid_from <= todayUtc) &&
    (!promo.valid_until || promo.valid_until >= todayUtc) &&
    (!promo.offer_expires_at || new Date(promo.offer_expires_at) > now) &&
    (promo.max_uses == null || Number(promo.current_uses || 0) < promo.max_uses)
      ? {
          code: promo.code,
          discountPercent:
            promo.discount_type === 'percentage' ? Number(promo.discount_value) : null,
          expiresAt:
            promo.offer_expires_at ||
            (promo.valid_until
              ? new Date(
                  new Date(`${promo.valid_until}T00:00:00Z`).getTime() + 86400000
                ).toISOString()
              : null),
          firstPaymentOnly: true,
        }
      : null;
  const issuesCheckoutRecoveryOffer =
    Number(campaign.metadata?.checkout_recovery_offer_percent) === 15;
  const issuesSignupOffer =
    campaign.promo?.is_signup_offer_template ||
    (Number(campaign.metadata?.signup_offer_percent) === 20 &&
      ['signup', 'first_result', 'quota'].includes(campaign.metadata?.lifecycle_stage));
  const stats = { accepted: 0, skipped: 0, failed: 0 };
  await mapLimit(audience, 5, async (member: any) => {
    const recipient = { ...member, username: usernames.get(member.user_id) || null };
    const preference = preferenceByUser.get(member.user_id);
    if (
      journey &&
      journey.delay_hours > 0 &&
      member.triggered_at &&
      now.getTime() < new Date(member.triggered_at).getTime() + journey.delay_hours * 3_600_000
    ) {
      stats.skipped += 1;
      return;
    }
    const selectedChannels = journey
      ? [
          chooseJourneyChannel(campaign.channels, preference, member, journey.trigger_type, now),
        ].filter((channel): channel is string => Boolean(channel))
      : campaign.channels;
    if (!selectedChannels.length) {
      const fallbackChannel = campaign.channels[0] || 'in_app';
      const priorSkip = (existing.get(`${member.user_id}:${fallbackChannel}`) || []).some(
        (row) =>
          row.campaign_id === campaign.id &&
          row.status === 'skipped' &&
          row.failure_reason === 'no_eligible_channel'
      );
      if (!priorSkip) {
        await reserveMarketingDelivery(admin, {
          campaign_id: campaign.id,
          journey_id: journey?.id || null,
          user_id: member.user_id,
          channel: fallbackChannel,
          attempt: nextMarketingAttempt(
            (existing.get(`${member.user_id}:${fallbackChannel}`) || []).filter(
              (row) => row.campaign_id === campaign.id
            )
          ),
          status: 'skipped',
          content: {
            title: campaign.title,
            message: campaign.message,
            subject: campaign.subject || campaign.title,
            cta_label: campaign.cta_label,
            cta_url: campaign.cta_url,
          },
          failure_reason: 'no_eligible_channel',
        });
      }
      stats.skipped += 1;
      return;
    }
    for (const channel of selectedChannels) {
      const key = `${member.user_id}:${channel}`;
      const rows = existing.get(key) || [];
      const allUserRows = historyByUser.get(member.user_id) || [];
      const allCampaignRows = rows.filter((row) => row.campaign_id === campaign.id);
      const campaignRows = allCampaignRows.filter(
        (row) => !['skipped', 'failed'].includes(row.status)
      );
      const latest = rows.find((row) =>
        ['accepted', 'delivered', 'viewed', 'clicked'].includes(row.status)
      );
      const cooldownHours = journey?.cooldown_hours ?? campaign.cooldown_hours;
      const cooldownOpen =
        latest && now.getTime() - new Date(latest.created_at).getTime() < cooldownHours * 3_600_000;
      const latestCrossChannel = allUserRows.find((row: any) =>
        ['accepted', 'delivered', 'viewed', 'clicked'].includes(row.status)
      );
      const crossChannelCooldownOpen =
        latestCrossChannel &&
        now.getTime() - new Date(latestCrossChannel.created_at).getTime() < 72 * 3_600_000;
      const contactCapReached =
        allUserRows.filter(
          (row: any) =>
            ['accepted', 'delivered', 'viewed', 'clicked'].includes(row.status) &&
            now.getTime() - new Date(row.created_at).getTime() < 7 * 24 * 3_600_000
        ).length >= 2;
      const upgradePromotionCapReached =
        campaign.objective === 'paid_conversion' &&
        allUserRows.some(
          (row: any) =>
            row.campaign?.objective === 'paid_conversion' &&
            ['accepted', 'delivered', 'viewed', 'clicked'].includes(row.status) &&
            now.getTime() - new Date(row.created_at).getTime() < 7 * 24 * 3_600_000
        );
      const overCap = campaignRows.length >= campaign.frequency_cap;
      const lacksConsent = channel === 'email' && !member.consent_marketing;
      const learnerPaused =
        preference?.proactive_paused_until && new Date(preference.proactive_paused_until) > now;
      const channelDisabled =
        (channel === 'email' && preference?.email_enabled === false) ||
        (['in_app', 'banner'].includes(channel) && preference?.in_app_enabled === false);
      const outsideContactWindow =
        channel === 'email' && !externalContactWindowOpen(preference, now);
      const attempt = nextMarketingAttempt(allCampaignRows);
      const content = {
        title: campaign.title,
        message: campaign.message,
        subject: campaign.subject || campaign.title,
        cta_label: campaign.cta_label,
        cta_url: campaign.cta_url,
        promo_code: staticOffer?.code || null,
      };

      if (
        cooldownOpen ||
        crossChannelCooldownOpen ||
        contactCapReached ||
        upgradePromotionCapReached ||
        overCap ||
        lacksConsent ||
        learnerPaused ||
        channelDisabled ||
        outsideContactWindow
      ) {
        const reason = learnerPaused
          ? 'learner_paused'
          : channelDisabled
            ? 'channel_disabled'
            : outsideContactWindow
              ? 'outside_contact_window'
              : lacksConsent
                ? 'marketing_consent_required'
                : overCap
                  ? 'frequency_cap'
                  : upgradePromotionCapReached
                    ? 'upgrade_promotion_cap'
                    : contactCapReached
                      ? 'cross_channel_contact_cap'
                      : crossChannelCooldownOpen
                        ? 'cross_channel_cooldown'
                        : 'cooldown';
        const alreadyRecorded = allCampaignRows.some(
          (row) => row.status === 'skipped' && row.failure_reason === reason
        );
        if (!alreadyRecorded) {
          await reserveMarketingDelivery(admin, {
            campaign_id: campaign.id,
            journey_id: journey?.id || null,
            user_id: member.user_id,
            channel,
            attempt,
            status: 'skipped',
            content,
            failure_reason: reason,
          });
        }
        stats.skipped += 1;
        continue;
      }

      const delivery = await reserveMarketingDelivery(admin, {
        campaign_id: campaign.id,
        journey_id: journey?.id || null,
        user_id: member.user_id,
        channel,
        attempt,
        status: 'processing',
        content,
        delivered_at: null,
      });
      if (!delivery) {
        stats.skipped += 1;
        continue;
      }

      if (campaign.promo?.assigned_user_id && campaign.promo.assigned_user_id !== member.user_id) {
        stats.skipped += 1;
        await admin
          .from('marketing_deliveries')
          .update({ status: 'skipped', failure_reason: 'offer_assigned_to_another_account' })
          .eq('id', delivery.id);
        continue;
      }
      let offer: CampaignOffer | null = staticOffer;
      if (staticOffer && !issuesSignupOffer) {
        const { data: personalOffer, error: personalError } = await admin
          .from('promo_codes')
          .select('code,discount_value,discount_type,is_active,offer_expires_at,current_uses')
          .eq('assigned_user_id', member.user_id)
          .not('signup_offer_template_id', 'is', null)
          .maybeSingle();
        if (
          personalError ||
          (personalOffer &&
            (!personalOffer.is_active ||
              !personalOffer.offer_expires_at ||
              new Date(personalOffer.offer_expires_at) <= now ||
              personalOffer.discount_type !== 'percentage' ||
              Number(personalOffer.discount_value) !== staticOffer.discountPercent))
        ) {
          stats.skipped += 1;
          await admin
            .from('marketing_deliveries')
            .update({ status: 'skipped', failure_reason: 'account_offer_conflict_or_expired' })
            .eq('id', delivery.id);
          continue;
        }
        if (personalOffer)
          offer = {
            code: personalOffer.code,
            discountPercent: Number(personalOffer.discount_value),
            expiresAt: personalOffer.offer_expires_at,
            firstPaymentOnly: true,
          };
      }
      const account = profiles.get(member.user_id) as any;
      if (
        !issuesSignupOffer &&
        offer &&
        account?.used_promo_codes?.length &&
        account?.promo_discount?.code !== offer.code
      ) {
        stats.skipped += 1;
        await admin
          .from('marketing_deliveries')
          .update({ status: 'skipped', failure_reason: 'account_promo_already_used' })
          .eq('id', delivery.id);
        continue;
      }
      if (issuesSignupOffer) {
        const { data: signupOffer, error: signupOfferError } = await admin.rpc(
          'provision_signup_subscription_offer',
          { p_campaign_id: campaign.id, p_user_id: member.user_id, p_delivery_id: delivery.id }
        );
        if (signupOfferError) {
          stats.failed += 1;
          await admin
            .from('marketing_deliveries')
            .update({ status: 'failed', failure_reason: signupOfferError.message })
            .eq('id', delivery.id);
          continue;
        }
        offer = signupOffer?.available
          ? {
              code: signupOffer.code,
              discountPercent: 20,
              expiresAt: signupOffer.expires_at,
              firstPaymentOnly: true,
            }
          : null;
        if (!offer && campaign.metadata?.lifecycle_stage !== 'signup') {
          stats.skipped += 1;
          await admin
            .from('marketing_deliveries')
            .update({
              status: 'skipped',
              failure_reason: signupOffer?.reason || 'signup_offer_unavailable',
            })
            .eq('id', delivery.id);
          continue;
        }
      }
      if (!issuesSignupOffer && issuesCheckoutRecoveryOffer && channel === 'email') {
        const { data: recoveryOffer, error: recoveryOfferError } = await admin.rpc(
          'provision_checkout_recovery_offer',
          {
            p_campaign_id: campaign.id,
            p_user_id: member.user_id,
            p_delivery_id: delivery.id,
          }
        );
        if (recoveryOfferError) {
          stats.failed += 1;
          await admin
            .from('marketing_deliveries')
            .update({
              status: 'failed',
              failure_reason: `checkout_recovery_offer: ${recoveryOfferError.message}`.slice(
                0,
                500
              ),
            })
            .eq('id', delivery.id);
          continue;
        }
        if (!recoveryOffer?.available || !recoveryOffer.code) {
          stats.skipped += 1;
          await admin
            .from('marketing_deliveries')
            .update({
              status: 'skipped',
              failure_reason: recoveryOffer?.reason || 'checkout_recovery_offer_unavailable',
            })
            .eq('id', delivery.id);
          continue;
        }
        offer = {
          code: recoveryOffer.code,
          discountPercent: Number(campaign.metadata?.checkout_recovery_offer_percent) || null,
          expiresAt: recoveryOffer.expires_at || null,
        };
      }

      const destination = new URL(campaign.cta_url || '/pricing', 'https://www.ieltsai.pro');
      destination.searchParams.set('campaign_id', campaign.id);
      destination.searchParams.set('delivery_id', delivery.id);
      if (offer?.code) destination.searchParams.set('promo', offer.code);
      const { error: contentError } = await admin
        .from('marketing_deliveries')
        .update({
          content: {
            ...content,
            cta_url: `${destination.pathname}${destination.search}`,
            promo_code: offer?.code || null,
            offer_expires_at: offer?.expiresAt || null,
            discount_percent: offer?.discountPercent || null,
          },
        })
        .eq('id', delivery.id);
      if (contentError) {
        stats.failed += 1;
        await admin
          .from('marketing_deliveries')
          .update({ status: 'failed', failure_reason: contentError.message })
          .eq('id', delivery.id);
        continue;
      }
      if (channel !== 'email') {
        const { error: acceptError } = await admin
          .from('marketing_deliveries')
          .update({ status: 'accepted', delivered_at: now.toISOString() })
          .eq('id', delivery.id);
        if (acceptError) {
          stats.failed += 1;
          continue;
        }
        stats.accepted += 1;
        await admin.from('marketing_events').insert({
          campaign_id: campaign.id,
          delivery_id: delivery.id,
          user_id: member.user_id,
          event_type: 'delivered',
          channel,
          dedupe_key: `${delivery.id}:delivered`,
        });
        continue;
      }

      const unsubscribeUrl = unsubscribeEndpoint(delivery.id, delivery.tracking_token);
      const email = campaignEmail(
        campaign,
        recipient,
        offer,
        trackingEndpoint(delivery.id, delivery.tracking_token, 'click', destination.toString()),
        trackingEndpoint(delivery.id, delivery.tracking_token, 'view'),
        unsubscribeUrl
      );
      const result = await sendEmail({
        to: member.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: unsubscribeHeaders(unsubscribeUrl),
        type: 'marketing_campaign',
      });
      if ('error' in result && result.error) {
        stats.failed += 1;
        await admin
          .from('marketing_deliveries')
          .update({ status: 'failed', failure_reason: String(result.error).slice(0, 500) })
          .eq('id', delivery.id);
      } else if ('skipped' in result && result.skipped) {
        stats.skipped += 1;
        await admin
          .from('marketing_deliveries')
          .update({ status: 'skipped', failure_reason: 'email_preference_disabled' })
          .eq('id', delivery.id);
      } else {
        stats.accepted += 1;
        await admin
          .from('marketing_deliveries')
          .update({
            status: 'accepted',
            provider_message_id: result.id || null,
            delivered_at: now.toISOString(),
          })
          .eq('id', delivery.id);
      }
    }
  });

  await admin
    .from('marketing_campaigns')
    .update({
      status: 'active',
      activated_at: campaign.activated_at || now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', campaign.id);
  return {
    campaign_id: campaign.id,
    journey_id: journey?.id || null,
    audience: audience.length,
    ...stats,
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405, corsHeaders);

  try {
    const body = await req.json();
    const scheduler = body?.process_journeys === true && (await requireScheduler(req));
    const adminUser = await requireAdmin(req);
    if (!scheduler && !adminUser) return errorResponse('Admin access required', 403, corsHeaders);

    if (body?.process_journeys === true) {
      if (!scheduler && !adminUser)
        return errorResponse('Scheduler access required', 403, corsHeaders);
      const { data: journeys, error } = await admin
        .from('marketing_journeys')
        .select('id,name,segment_id,campaign_id,delay_hours,cooldown_hours,trigger_type')
        .eq('is_active', true)
        .not('campaign_id', 'is', null);
      if (error) throw error;
      const results = [];
      for (const journey of journeys || []) {
        try {
          results.push({
            journey: journey.name,
            ...(await dispatchCampaign(journey.campaign_id, journey)),
          });
        } catch (error) {
          results.push({
            journey: journey.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      const { data: scheduledCampaigns, error: scheduledError } = await admin
        .from('marketing_campaigns')
        .select('id,name')
        .eq('status', 'scheduled')
        .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`);
      if (scheduledError) throw scheduledError;
      const scheduled = [];
      for (const campaign of scheduledCampaigns || []) {
        try {
          scheduled.push({ name: campaign.name, ...(await dispatchCampaign(campaign.id)) });
        } catch (error) {
          scheduled.push({
            name: campaign.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return new Response(JSON.stringify({ success: true, journeys: results, scheduled }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body?.campaign_id) return errorResponse('campaign_id is required', 400, corsHeaders);
    const result = await dispatchCampaign(body.campaign_id);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[marketing-dispatch]', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Campaign dispatch failed',
      500,
      corsHeaders
    );
  }
});
