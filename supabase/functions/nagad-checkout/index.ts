/**
 * Start a Nagad payment for a Bangladesh learner.
 *
 * GET answers whether this learner may pay with Nagad right now (the payment
 * modal uses it to show or hide the option); POST starts the payment and
 * enforces the same rule.
 *
 * Prices server-side from the BD admin price book (same maths as the card and
 * as Stripe), records the order, opens a Nagad session and returns the Nagad
 * page to redirect to. Access is granted later, only after nagad-callback,
 * nagad-payment-status or nagad-reconcile verifies the payment with Nagad.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  checkRateLimit,
  errorResponse,
  getCorsHeaders,
  getRateLimitIdentifier,
  handleCorsPrelight,
  rateLimitedResponse,
  RATE_LIMITS,
  successResponse,
  validateCsrfProtection,
} from '../_shared/security.ts';
import { computePlanCharge, resolvePriceBook } from '../_shared/planPricing.ts';
import { existingAccessError, validateAppliedPromo } from '../_shared/checkoutEligibility.ts';
import { loadNagadAudience, nagadAvailability } from '../_shared/nagadAvailability.ts';
import {
  clientIpv4,
  completePayment,
  initializePayment,
  loadNagadConfig,
  NagadError,
  newOrderId,
} from '../_shared/nagad.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const serviceClient = createClient(supabaseUrl, serviceKey);

const VALID_TIERS = new Set(['pro', 'premium']);
const VALID_INTERVALS = new Set(['monthly', 'quarterly']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAGAD_COUNTRY = 'BD';

const callbackUrl = () =>
  Deno.env.get('NAGAD_CALLBACK_URL') || `${supabaseUrl}/functions/v1/nagad-callback`;

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405, cors);
  }

  const csrf = validateCsrfProtection(req);
  if (!csrf.valid) return errorResponse('Request validation failed', 403, cors);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return errorResponse('Missing authorization header', 401, cors);
  const {
    data: { user: authUser },
    error: authError,
  } = await serviceClient.auth.getUser(token);
  if (authError || !authUser) return errorResponse('Unauthorized', 401, cors);

  const config = loadNagadConfig();
  const [{ data: profile }, audience] = await Promise.all([
    serviceClient.from('users').select('role').eq('auth_id', authUser.id).maybeSingle(),
    loadNagadAudience(serviceClient),
  ]);
  const availability = nagadAvailability(config, audience, profile?.role === 'admin');

  if (req.method === 'GET') return successResponse(availability, cors);

  if (!config || !availability.available) {
    if (!config) console.error('[NagadCheckout] Nagad is not configured');
    return errorResponse('Nagad payment is not available right now.', 503, cors, {
      code: 'nagad_unavailable',
    });
  }

  const rate = checkRateLimit(
    `nagad-checkout:${getRateLimitIdentifier(req, authUser.id)}`,
    RATE_LIMITS.EXPENSIVE
  );
  if (!rate.allowed) return rateLimitedResponse(rate.resetIn, cors);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid request body', 400, cors);
  }
  const tier = String(body.tier || '');
  const interval = String(body.interval || '');
  if (!VALID_TIERS.has(tier)) return errorResponse('Invalid tier', 400, cors);
  if (!VALID_INTERVALS.has(interval)) return errorResponse('Invalid interval', 400, cors);
  const expectedAmount = body.expected_amount == null ? null : Number(body.expected_amount);

  try {
    const { data: user, error: userError } = await serviceClient
      .from('users')
      .select(
        'id, role, stripe_subscription_id, subscription_tier, subscription_end_date, promo_discount'
      )
      .eq('auth_id', authUser.id)
      .single();
    if (userError || !user) return errorResponse('User not found', 404, cors);

    const accessError = existingAccessError(user);
    if (accessError) return errorResponse(accessError, 409, cors, { code: 'already_subscribed' });

    // Nagad settles taka only, so the price is always the Bangladesh row.
    const { data: settings } = await serviceClient
      .from('system_settings')
      .select('value')
      .eq('key', 'pricing_tiers')
      .single();
    const priceBook = resolvePriceBook(settings?.value, tier, NAGAD_COUNTRY);
    if (!priceBook || priceBook.currency !== 'BDT') {
      console.error(`[NagadCheckout] No BDT price for ${tier}`);
      return errorResponse('Nagad payment is not available for this plan.', 400, cors, {
        code: 'currency_unavailable',
      });
    }

    const discount = await validateAppliedPromo(serviceClient, user, tier);
    const charge = computePlanCharge(priceBook.price, interval, 'BDT', discount);
    if (!(charge.amount > 0)) {
      return errorResponse('This plan has no amount to charge.', 400, cors);
    }

    // The learner must be charged what the card showed. A stale page (prices or
    // offer changed since it loaded) is sent back to refresh, never charged.
    if (expectedAmount != null && Number.isFinite(expectedAmount)) {
      if (Math.round(expectedAmount * 100) !== Math.round(charge.amount * 100)) {
        if (user.promo_discount?.code && !discount) {
          return errorResponse(
            'Your offer is no longer valid. The page now shows the full price.',
            409,
            cors,
            { code: 'offer_unavailable' }
          );
        }
        return errorResponse(
          'Prices were just updated. Please refresh the page to see the current price.',
          409,
          cors,
          { code: 'price_changed' }
        );
      }
    }

    let campaignId: string | null = null;
    let deliveryId: string | null = null;
    if (
      UUID.test(String(body.marketing_campaign_id || '')) &&
      UUID.test(String(body.marketing_delivery_id || ''))
    ) {
      const { data: delivery } = await serviceClient
        .from('marketing_deliveries')
        .select('id, campaign_id')
        .eq('id', body.marketing_delivery_id)
        .eq('campaign_id', body.marketing_campaign_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (delivery) {
        campaignId = delivery.campaign_id;
        deliveryId = delivery.id;
      }
    }

    const orderId = newOrderId();
    const { error: insertError } = await serviceClient.from('nagad_payments').insert({
      order_id: orderId,
      user_id: user.id,
      auth_id: authUser.id,
      tier,
      billing_interval: interval,
      amount: charge.amount,
      currency: 'BDT',
      environment: config.environment,
      promo_code: discount?.code || null,
      marketing_campaign_id: campaignId,
      marketing_delivery_id: deliveryId,
    });
    if (insertError) {
      console.error('[NagadCheckout] Could not record order:', insertError.message);
      return errorResponse('Failed to start payment. Please try again.', 500, cors);
    }

    const ip = clientIpv4(req);
    const clientType = /Mobi|Android|iPhone/i.test(req.headers.get('user-agent') || '')
      ? 'MOBILE_WEB'
      : 'PC_WEB';

    let redirectUrl: string;
    try {
      const session = await initializePayment(config, orderId, { ip, clientType });
      // Stored before the learner can pay, so every later check can find it.
      const { error: refError } = await serviceClient
        .from('nagad_payments')
        .update({
          payment_ref_id: session.paymentReferenceId,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);
      if (refError) throw new Error(`Could not store payment reference: ${refError.message}`);

      redirectUrl = await completePayment(config, {
        paymentReferenceId: session.paymentReferenceId,
        orderId,
        amount: charge.amount,
        challenge: session.challenge,
        callbackUrl: callbackUrl(),
        ip,
        clientType,
        additionalMerchantInfo: {
          serviceName: 'IELTS Ai Pro',
          additionalFieldNameEN: 'Plan',
          additionalFieldNameBN: 'প্ল্যান',
          additionalFieldValue: `${tier === 'pro' ? 'Pro' : 'Premium'} ${interval === 'quarterly' ? '3 months' : 'monthly'}`,
        },
      });
    } catch (error) {
      const reason = error instanceof NagadError ? error.reason || error.message : String(error);
      console.error(`[NagadCheckout] Nagad rejected order ${orderId}:`, reason);
      await serviceClient
        .from('nagad_payments')
        .update({
          status: 'failed',
          failure_reason: `checkout: ${reason}`.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)
        .in('status', ['initiated', 'pending']);
      return errorResponse('Nagad could not start the payment. Please try again.', 502, cors, {
        code: 'nagad_unavailable',
      });
    }

    // Sandbox orders are admin tests: keep them out of the growth funnel.
    if (config.environment === 'live') {
      await serviceClient.from('marketing_checkout_intents').upsert(
        {
          user_id: user.id,
          provider: 'nagad',
          external_session_id: orderId,
          plan_tier: tier,
          billing_interval: interval,
          status: 'initiated',
          metadata: { currency: 'BDT', amount: charge.amount, priced_country: NAGAD_COUNTRY },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'external_session_id' }
      );
    }

    return successResponse(
      {
        url: redirectUrl,
        order_id: orderId,
        amount: charge.amount,
        currency: 'BDT',
        test_mode: availability.testMode,
      },
      cors
    );
  } catch (error) {
    console.error('[NagadCheckout] Unexpected error:', error);
    return errorResponse('An unexpected error occurred. Please try again.', 500, cors);
  }
});
