import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { sendEmail } from '../_shared/resend.ts';
import { errorResponse, getCorsHeaders, handleCorsPrelight } from '../_shared/security.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(supabaseUrl, serviceKey);

const escapeHtml = (value: unknown) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
};

const campaignEmail = (
  campaign: Record<string, any>,
  recipient: Record<string, any>,
  offer: CampaignOffer | null,
  clickUrl: string,
  openUrl: string
) => {
  const name = escapeHtml(
    recipient.username ||
      recipient.full_name?.split(' ')[0] ||
      recipient.email?.split('@')[0] ||
      'there'
  );
  const offerBlock = offer
    ? `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px dashed #c9c5f4;border-radius:10px;background:#f7f6ff"><tr><td style="padding:16px;text-align:center;color:#4c43a8;font-size:14px;line-height:1.5"><strong>${offer.discountPercent ? `${escapeHtml(offer.discountPercent)}% offer code` : 'Offer code'}: ${escapeHtml(offer.code)}</strong><br /><span style="font-size:13px;color:#625d82">${offer.expiresAt ? `Use it within seven days when you choose your next plan.` : 'Use it when you choose your next plan.'}</span></td></tr></table>`
    : '';
  const baseUrl = 'https://ieltsai.pro';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${escapeHtml(campaign.subject || campaign.title)}</title></head><body style="margin:0;padding:0;min-width:100%;background-color:#f6f5f3;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased"><div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(campaign.message)}</div><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-spacing:0;border-collapse:collapse;background-color:#f6f5f3"><tr><td align="center" valign="top" style="padding:36px 16px"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-spacing:0;border-collapse:collapse;background-color:#fff;border-radius:20px;overflow:hidden;border:1px solid #e9e7e3"><tr><td align="center" style="padding:20px 40px;background:#111113"><a href="${baseUrl}" aria-label="IELTS AI Pro" style="display:inline-block;text-decoration:none"><img src="${baseUrl}/footer.svg" width="176" height="42" alt="IELTS AI Pro" style="display:block;width:176px;height:auto;margin:0 auto;border:0" /></a></td></tr><tr><td style="padding:36px 40px 28px"><h1 style="margin:0 0 16px;font-size:26px;font-weight:800;letter-spacing:-.03em;color:#18181b;line-height:1.22">${escapeHtml(campaign.title)}</h1><p style="margin:0 0 18px;font-size:18px;line-height:1.5;color:#3f3f46">Hi ${name},</p><p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#52525b">${escapeHtml(campaign.message)}</p><p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#52525b">A focused next step can make your preparation more consistent. Use your dashboard to continue from where you left off, review your recent feedback, and decide what will help you move closer to your target band.</p>${offerBlock}<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px auto"><tr><td><a href="${escapeHtml(clickUrl)}" style="display:inline-block;padding:13px 22px;background:#6c4cff;color:#fff;text-decoration:none;border-radius:9px;font-weight:800;font-size:15px">${escapeHtml(campaign.cta_label || 'Learn more')}</a></td></tr></table><p style="margin:0;font-size:14px;line-height:1.6;color:#64748b">Your progress and practice history are saved in your account, so you can return whenever you are ready.</p></td></tr><tr><td align="center" style="padding:28px 40px 32px;background-color:#faf9f7;border-top:1px solid #ebe9e5"><p style="margin:0 0 16px;font-size:12px;line-height:1.6;text-align:center"><a href="${baseUrl}/settings?tab=subscription" style="display:inline-block;margin:0 7px;font-size:12px;color:#52525b;text-decoration:none">Manage</a><span style="color:#a1a1aa">•</span><a href="${baseUrl}/privacy" style="display:inline-block;margin:0 7px;font-size:12px;color:#52525b;text-decoration:none">Privacy</a><span style="color:#a1a1aa">•</span><a href="${baseUrl}/terms" style="display:inline-block;margin:0 7px;font-size:12px;color:#52525b;text-decoration:none">Terms</a><span style="color:#a1a1aa">•</span><a href="${baseUrl}/settings?tab=preferences" style="display:inline-block;margin:0 7px;font-size:12px;color:#52525b;text-decoration:none">Unsubscribe</a></p><p style="margin:0 0 10px;font-size:12px;color:#71717a;line-height:1.6;text-align:center">You are receiving this because you enabled marketing communications.</p><p style="margin:12px 0 0;font-size:11px;color:#71717a;line-height:1.6;text-align:center">&copy; ${new Date().getFullYear()} IELTS AI Pro · <a href="mailto:support@ieltsai.pro" style="color:#71717a;text-decoration:none;font-weight:600">support@ieltsai.pro</a></p></td></tr></table></td></tr></table><img src="${escapeHtml(openUrl)}" width="1" height="1" alt="" style="display:none" /></body></html>`;
};

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

async function dispatchCampaign(campaignId: string, journey: Record<string, any> | null = null) {
  const { data: campaign, error: campaignError } = await admin
    .from('marketing_campaigns')
    .select(
      '*, segment:marketing_segments(*), promo:promo_codes!marketing_campaigns_promo_code_id_fkey(id,code,discount_value,is_active,valid_until,max_uses,current_uses)'
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
      (campaign.promo.valid_until && new Date(campaign.promo.valid_until) <= now) ||
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
  const audience = members || [];
  const userIds = audience.map((member: any) => member.user_id);
  const { data: usernameRows } = userIds.length
    ? await admin.from('users').select('id,username').in('id', userIds)
    : { data: [] };
  const usernames = new Map((usernameRows || []).map((row: any) => [row.id, row.username]));
  const { data: history } = userIds.length
    ? await admin
        .from('marketing_deliveries')
        .select('user_id,channel,campaign_id,attempt,status,failure_reason,created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const existing = new Map<string, any[]>();
  (history || []).forEach((row: any) => {
    const key = `${row.user_id}:${row.channel}`;
    existing.set(key, [...(existing.get(key) || []), row]);
  });

  const staticOffer = campaign.promo?.code
    ? { code: campaign.promo.code, discountPercent: Number(campaign.promo.discount_value) || null }
    : null;
  const issuesCheckoutRecoveryOffer =
    Number(campaign.metadata?.checkout_recovery_offer_percent) === 15;
  const stats = { accepted: 0, skipped: 0, failed: 0 };
  await mapLimit(audience, 5, async (member: any) => {
    const recipient = { ...member, username: usernames.get(member.user_id) || null };
    if (
      journey?.delay_hours > 0 &&
      member.triggered_at &&
      now.getTime() < new Date(member.triggered_at).getTime() + journey.delay_hours * 3_600_000
    ) {
      stats.skipped += campaign.channels.length;
      return;
    }
    for (const channel of campaign.channels) {
      const key = `${member.user_id}:${channel}`;
      const rows = existing.get(key) || [];
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
      const overCap = campaignRows.length >= campaign.frequency_cap;
      const lacksConsent = channel === 'email' && !member.consent_marketing;
      const attempt = allCampaignRows.length + 1;
      const content = {
        title: campaign.title,
        message: campaign.message,
        subject: campaign.subject || campaign.title,
        cta_label: campaign.cta_label,
        cta_url: campaign.cta_url,
        promo_code: staticOffer?.code || null,
      };

      if (cooldownOpen || overCap || lacksConsent) {
        const reason = lacksConsent
          ? 'marketing_consent_required'
          : overCap
            ? 'frequency_cap'
            : 'cooldown';
        const alreadyRecorded = allCampaignRows.some(
          (row) => row.status === 'skipped' && row.failure_reason === reason
        );
        if (!alreadyRecorded) {
          await admin.from('marketing_deliveries').insert({
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

      const { data: delivery, error: deliveryError } = await admin
        .from('marketing_deliveries')
        .insert({
          campaign_id: campaign.id,
          journey_id: journey?.id || null,
          user_id: member.user_id,
          channel,
          attempt,
          status: channel === 'email' ? 'processing' : 'accepted',
          content,
          delivered_at: channel === 'email' ? null : now.toISOString(),
        })
        .select('id,tracking_token')
        .single();
      if (deliveryError || !delivery) {
        stats.failed += 1;
        continue;
      }

      if (channel !== 'email') {
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

      let offer: CampaignOffer | null = staticOffer;
      if (issuesCheckoutRecoveryOffer) {
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
      await admin
        .from('marketing_deliveries')
        .update({
          content: {
            ...content,
            cta_url: `${destination.pathname}${destination.search}`,
            promo_code: offer?.code || null,
            offer_expires_at: offer?.expiresAt || null,
          },
        })
        .eq('id', delivery.id);
      const result = await sendEmail({
        to: member.email,
        subject: campaign.subject || campaign.title,
        html: campaignEmail(
          campaign,
          recipient,
          offer,
          trackingEndpoint(delivery.id, delivery.tracking_token, 'click', destination.toString()),
          trackingEndpoint(delivery.id, delivery.tracking_token, 'view')
        ),
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
        .select('id,name,segment_id,campaign_id,delay_hours,cooldown_hours')
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
