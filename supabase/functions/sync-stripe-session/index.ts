/**
 * Sync Stripe Session
 *
 * Frontend fallback to sync subscription status if webhook is delayed.
 * Uses the same unified RPC as the webhook for consistent behavior.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.14.0';
import { getCorsHeaders, handleCorsPrelight, errorResponse } from '../_shared/security.ts';
import { fromStripeAmount } from '../_shared/planPricing.ts';

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('INTERNAL_SUPABASE_URL') || '';
const supabaseServiceKey =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('INTERNAL_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  // Auth check: require authenticated user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse('Missing authorization header', 401, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (authError || !user) {
    return errorResponse('Unauthorized', 401, corsHeaders);
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return errorResponse('Missing session ID', 400, corsHeaders);
    }

    console.log(`[Sync] Syncing Stripe session: ${sessionId} for user: ${user.id}`);

    // 1. Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      console.log(`[Sync] Payment status: ${session.payment_status}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment not completed',
          status: session.payment_status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Extract metadata
    const userId = session.metadata?.supabase_user_id;
    const authId = session.metadata?.supabase_auth_id;
    const tier = session.metadata?.tier;
    const interval = session.metadata?.interval || 'monthly';
    const marketingCampaignId = session.metadata?.marketing_campaign_id || null;
    const marketingDeliveryId = session.metadata?.marketing_delivery_id || null;

    if (!userId || !authId || !tier) {
      console.error('[Sync] Missing metadata in session:', session.id);
      return errorResponse('Session missing metadata', 400, corsHeaders);
    }

    // SECURITY: Ensure the authenticated user matches the session's auth_id
    if (authId !== user.id) {
      console.error(`[Sync] Auth mismatch: JWT user ${user.id} != session auth_id ${authId}`);
      return errorResponse('Session does not belong to authenticated user', 403, corsHeaders);
    }

    // 3. Calculate end date
    const endDate = new Date();
    if (interval === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Use a service-role client for the RPC call
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Use the unified handle_stripe_event RPC (same as webhook)
    // The checkout session is the canonical idempotency key shared with the webhook.
    const { data, error } = await serviceClient.rpc('handle_stripe_event', {
      p_event_id: `checkout_${session.id}`,
      p_event_type: 'checkout.session.completed',
      p_auth_id: authId,
      p_user_id: userId,
      p_tier: tier,
      p_interval: interval,
      p_amount: fromStripeAmount(session.amount_total, session.currency || 'usd'),
      p_currency: (session.currency || 'usd').toUpperCase(),
      p_transaction_id: session.id,
      p_subscription_id:
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || null,
      p_end_date: endDate.toISOString(),
      p_metadata: {
        source: 'sync',
        session_id: session.id,
        marketing_campaign_id: marketingCampaignId,
        marketing_delivery_id: marketingDeliveryId,
        promo_code: session.metadata?.promo_code || null,
      },
      // Same rule as the webhook: a one-time Exam Pass never renews.
      p_cancel_at_period_end: false,
    });

    if (error) {
      console.error('[Sync] RPC Error:', error);
      throw error;
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Stripe session could not be synchronized');
    }
    if (data.claimed === false) {
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Sync] ✅ User ${authId} synced to tier: ${tier}`);

    if (marketingCampaignId && marketingDeliveryId) {
      await serviceClient
        .from('billing_history')
        .update({
          marketing_campaign_id: marketingCampaignId,
          marketing_delivery_id: marketingDeliveryId,
          promo_code: session.metadata?.promo_code || null,
          gross_amount: fromStripeAmount(
            session.amount_subtotal || session.amount_total,
            session.currency || 'usd'
          ),
          discount_amount: fromStripeAmount(
            session.total_details?.amount_discount,
            session.currency || 'usd'
          ),
        })
        .eq('transaction_id', session.id);
      const { error: marketingEventError } = await serviceClient.from('marketing_events').insert({
        campaign_id: marketingCampaignId,
        delivery_id: marketingDeliveryId,
        user_id: userId,
        event_type: 'purchased',
        channel: 'stripe',
        dedupe_key: `${session.id}:purchased`,
        metadata: {
          transaction_id: session.id,
          amount: fromStripeAmount(session.amount_total, session.currency || 'usd'),
          currency: (session.currency || 'usd').toUpperCase(),
          source: 'sync',
        },
      });
      if (marketingEventError && marketingEventError.code !== '23505') {
        console.warn('[Sync] Marketing purchase event failed:', marketingEventError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tier: tier,
        data: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Sync] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
