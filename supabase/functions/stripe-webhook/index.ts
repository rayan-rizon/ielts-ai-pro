/**
 * Stripe Webhook Handler (Industry Standard)
 *
 * Handles Stripe webhook events for subscription management:
 * - checkout.session.completed: Update user subscription after successful payment
 * - customer.subscription.updated: Handle plan changes
 * - customer.subscription.deleted: Reset to free tier on cancellation
 * - invoice.paid: Record successful recurring payments
 * - invoice.payment_failed: Handle failed payments
 *
 * Uses the unified `handle_stripe_event` RPC for atomic updates with idempotency.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.14.0';
import { sendEmail } from '../_shared/resend.ts';
import { getEmailTemplate } from '../_shared/templates.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('INTERNAL_SUPABASE_URL') || '';
const supabaseServiceKey =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('INTERNAL_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recordServerConversion(
  userId: string | null | undefined,
  dataType: string,
  value: Record<string, unknown>
) {
  if (!userId) return;

  const { error } = await supabase.from('analytics_data').insert({
    user_id: userId,
    data_type: dataType,
    value,
  });

  if (error) {
    console.warn(`[Webhook] Analytics insert failed (${dataType}):`, error.message);
  }
}

async function recordMarketingPurchase(session: Stripe.Checkout.Session, userId: string) {
  const campaignId = session.metadata?.marketing_campaign_id;
  const deliveryId = session.metadata?.marketing_delivery_id;
  const promoCode = session.metadata?.promo_code || null;
  const grossAmount = (session.amount_subtotal || session.amount_total || 0) / 100;
  const discountAmount = (session.total_details?.amount_discount || 0) / 100;
  if (!campaignId || !deliveryId) return;

  const { error: billingError } = await supabase
    .from('billing_history')
    .update({
      marketing_campaign_id: campaignId,
      marketing_delivery_id: deliveryId,
      promo_code: promoCode,
      gross_amount: grossAmount,
      discount_amount: discountAmount,
    })
    .eq('transaction_id', session.id);
  if (billingError)
    console.warn('[Webhook] Marketing billing attribution failed:', billingError.message);

  const { error: eventError } = await supabase.from('marketing_events').insert({
    campaign_id: campaignId,
    delivery_id: deliveryId,
    user_id: userId,
    event_type: 'purchased',
    channel: 'stripe',
    dedupe_key: `${session.id}:purchased`,
    metadata: {
      transaction_id: session.id,
      amount: (session.amount_total || 0) / 100,
      gross_amount: grossAmount,
      discount_amount: discountAmount,
      currency: (session.currency || 'usd').toUpperCase(),
      promo_code: promoCode,
    },
  });
  if (eventError && eventError.code !== '23505') {
    console.warn('[Webhook] Marketing purchase event failed:', eventError.message);
  }
}

// Tier mapping from price IDs
const PRICE_TO_TIER: Record<string, string> = {
  [Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') || '']: 'pro',
  [Deno.env.get('STRIPE_PRO_QUARTERLY_PRICE_ID') || '']: 'pro',
  [Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID') || '']: 'premium',
  [Deno.env.get('STRIPE_PREMIUM_QUARTERLY_PRICE_ID') || '']: 'premium',
};

// Interval mapping from price IDs
const PRICE_TO_INTERVAL: Record<string, string> = {
  [Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') || '']: 'monthly',
  [Deno.env.get('STRIPE_PRO_QUARTERLY_PRICE_ID') || '']: 'quarterly',
  [Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID') || '']: 'monthly',
  [Deno.env.get('STRIPE_PREMIUM_QUARTERLY_PRICE_ID') || '']: 'quarterly',
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('[Webhook] Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    // SECURITY: Webhook bypass is ONLY allowed when DEVELOPMENT_MODE is explicitly set.
    // This prevents accidental production bypass if LOCAL_WEBHOOK_BYPASS_SECRET is set.
    const isDevelopmentMode = Deno.env.get('DEVELOPMENT_MODE') === 'true';
    const bypassSecret = Deno.env.get('LOCAL_WEBHOOK_BYPASS_SECRET');
    const bypassHeader = req.headers.get('x-webhook-bypass-secret');

    if (isDevelopmentMode && bypassSecret && bypassHeader === bypassSecret) {
      console.log('[Webhook] Bypassing signature verification (local dev)');
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
    }
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`, {
      status: 400,
    });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, event.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, event.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, event.id);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    // Signature and payload rejection is handled before this block. A handler
    // error means persistence or a required side effect did not finish, so
    // keep Stripe's bounded retry schedule active.
    return new Response(JSON.stringify({ error: 'Webhook processing failed; retry required' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle successful checkout session - new subscription
 */
function requireClaimedStripeEvent(data: any, error: any, eventType: string): boolean {
  if (error) {
    console.error(`[Webhook] RPC error for ${eventType}:`, error);
    throw error;
  }
  if (!data?.success) {
    throw new Error(data?.error || `Failed to persist ${eventType}`);
  }
  return data.claimed !== false;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.metadata?.supabase_user_id;
  const authId = session.metadata?.supabase_auth_id;
  const tier = session.metadata?.tier;
  const interval = session.metadata?.interval;

  if (!userId || !authId || !tier) {
    console.error('[Webhook] Missing metadata in checkout session:', session.id);
    return;
  }

  console.log(
    `[Webhook] Checkout completed for user ${authId}, tier: ${tier}, interval: ${interval}`
  );

  // Calculate subscription end date
  const endDate = new Date();
  if (interval === 'quarterly') {
    endDate.setMonth(endDate.getMonth() + 3);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Use the unified RPC with ON CONFLICT handling
  const { data, error } = await supabase.rpc('handle_stripe_event', {
    p_event_id: `checkout_${session.id}`,
    p_event_type: 'checkout.session.completed',
    p_auth_id: authId,
    p_user_id: userId,
    p_tier: tier,
    p_interval: interval || 'monthly',
    p_amount: (session.amount_total || 0) / 100,
    p_currency: (session.currency || 'usd').toUpperCase(),
    p_transaction_id: session.id,
    p_subscription_id:
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as any)?.id || null,
    p_end_date: endDate.toISOString(),
    p_metadata: {
      session_id: session.id,
      customer: session.customer,
      marketing_campaign_id: session.metadata?.marketing_campaign_id || null,
      marketing_delivery_id: session.metadata?.marketing_delivery_id || null,
      promo_code: session.metadata?.promo_code || null,
    },
  });

  if (requireClaimedStripeEvent(data, error, 'checkout.session.completed')) {
    console.log(`[Webhook] ✅ User ${authId} upgraded to ${tier} successfully`);
    await recordMarketingPurchase(session, userId);
    // promo_discount is cleared atomically inside the RPC — no need for a separate update

    // Fetch user email for the welcome email
    const { data: userRecord } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    if (userRecord?.email) {
      const template = getEmailTemplate('welcome', { full_name: userRecord.full_name });
      await sendEmail({
        to: userRecord.email,
        subject: template.subject,
        type: 'welcome',
        html: template.html,
        text: template.text,
      });
    }

    await recordServerConversion(userId, 'subscription_purchase_server', {
      event_id: eventId,
      transaction_id: session.id,
      subscription_id:
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as any)?.id || null,
      tier,
      interval: interval || 'monthly',
      amount: (session.amount_total || 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
      marketing_campaign_id: session.metadata?.marketing_campaign_id || null,
      marketing_delivery_id: session.metadata?.marketing_delivery_id || null,
    });
  }
}

/**
 * Handle invoice.paid - recurring payment success
 */
async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Skip if this is the first invoice (already handled by checkout.session.completed)
  if (invoice.billing_reason === 'subscription_create') {
    console.log('[Webhook] Skipping invoice.paid for initial subscription (handled by checkout)');
    return;
  }

  // Lookup user by Stripe customer ID
  // We also need the email for sending the receipt
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !userData) {
    console.error('[Webhook] User not found for customer:', customerId);
    return;
  }

  // Get subscription details for tier/interval
  let tier = 'pro';
  let interval = 'monthly';

  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      tier = PRICE_TO_TIER[priceId] || subscription.metadata?.tier || 'pro';
      interval = PRICE_TO_INTERVAL[priceId] || subscription.metadata?.interval || 'monthly';
    } catch (e) {
      console.warn('[Webhook] Could not retrieve subscription details:', e);
    }
  }

  // Calculate new end date
  const endDate = new Date();
  if (interval === 'quarterly') {
    endDate.setMonth(endDate.getMonth() + 3);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const { data, error } = await supabase.rpc('handle_stripe_event', {
    p_event_id: eventId,
    p_event_type: 'invoice.paid',
    p_auth_id: userData.auth_id,
    p_user_id: userData.id,
    p_tier: tier,
    p_interval: interval,
    p_amount: (invoice.amount_paid || 0) / 100,
    p_currency: (invoice.currency || 'usd').toUpperCase(),
    p_transaction_id: invoice.id,
    p_subscription_id: subscriptionId,
    p_end_date: endDate.toISOString(),
    p_metadata: { invoice_id: invoice.id, billing_reason: invoice.billing_reason },
  });

  if (!requireClaimedStripeEvent(data, error, 'invoice.paid')) return;

  console.log(`[Webhook] ✅ Recurring payment recorded for user ${userData.auth_id}`);

  if (userData.email) {
    const template = getEmailTemplate('renewal_confirmation', { full_name: userData.full_name });
    await sendEmail({
      to: userData.email,
      subject: template.subject,
      type: 'renewal_confirmation',
      html: template.html,
      text: template.text,
    });
  }

  await recordServerConversion(userData.id, 'subscription_renewal_server', {
    event_id: eventId,
    invoice_id: invoice.id,
    subscription_id: subscriptionId,
    tier,
    interval,
    amount: (invoice.amount_paid || 0) / 100,
    currency: (invoice.currency || 'usd').toUpperCase(),
  });

  // Clear any previous payment failure flag (dunning notice)
  await supabase.from('users').update({ payment_failed_at: null }).eq('id', userData.id);
}

/**
 * Handle subscription updates (plan changes, status changes)
 * Routes through the unified RPC to ensure trigger bypass is active.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, eventId: string) {
  const userId = subscription.metadata?.supabase_user_id;
  const customerId = subscription.customer as string;

  // Find the user
  let authId: string | undefined;
  let profileId: string | undefined;

  if (userId) {
    const { data } = await supabase.from('users').select('id, auth_id').eq('id', userId).single();
    if (data) {
      authId = data.auth_id;
      profileId = data.id;
    }
  }

  if (!authId) {
    const { data } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('stripe_customer_id', customerId)
      .single();
    if (data) {
      authId = data.auth_id;
      profileId = data.id;
    }
  }

  if (!authId || !profileId) {
    console.error('[Webhook] User not found for subscription:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier =
    subscription.status === 'active'
      ? PRICE_TO_TIER[priceId] || subscription.metadata?.tier || 'pro'
      : 'free';
  const interval = PRICE_TO_INTERVAL[priceId] || subscription.metadata?.interval || 'monthly';

  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : new Date();

  console.log(
    `[Webhook] Subscription ${subscription.id} updated: status=${subscription.status}, tier=${tier}`
  );

  // Use the unified RPC for trigger bypass
  const { data, error } = await supabase.rpc('handle_stripe_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.updated',
    p_auth_id: authId,
    p_user_id: profileId,
    p_tier: tier,
    p_interval: subscription.status === 'active' ? interval : 'monthly',
    p_amount: 0,
    p_currency: 'USD',
    p_transaction_id: subscription.id,
    p_subscription_id: subscription.status === 'active' ? subscription.id : null,
    p_end_date: endDate.toISOString(),
    p_metadata: { subscription_status: subscription.status },
    p_cancel_at_period_end: subscription.cancel_at_period_end || false,
  });

  if (!requireClaimedStripeEvent(data, error, 'customer.subscription.updated')) return;

  console.log(`[Webhook] ✅ User ${authId} subscription updated via RPC:`, data);
}

/**
 * Handle subscription cancellation
 * Routes through the unified RPC to ensure trigger bypass is active.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  const userId = subscription.metadata?.supabase_user_id;
  const customerId = subscription.customer as string;

  // Find user
  let authId: string | undefined;
  let profileId: string | undefined;

  if (userId) {
    const { data } = await supabase.from('users').select('id, auth_id').eq('id', userId).single();
    if (data) {
      authId = data.auth_id;
      profileId = data.id;
    }
  }

  if (!authId) {
    const { data } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('stripe_customer_id', customerId)
      .single();
    if (data) {
      authId = data.auth_id;
      profileId = data.id;
    }
  }

  if (!authId) {
    console.error('[Webhook] User not found for cancelled subscription:', subscription.id);
    return;
  }

  console.log(`[Webhook] Subscription cancelled for user ${authId}`);

  // Use the unified RPC for trigger bypass
  const { data, error } = await supabase.rpc('handle_stripe_event', {
    p_event_id: eventId,
    p_event_type: 'customer.subscription.deleted',
    p_auth_id: authId,
    p_user_id: profileId || authId,
    p_tier: 'free',
    p_interval: 'monthly',
    p_amount: 0,
    p_currency: 'USD',
    p_transaction_id: subscription.id,
    p_subscription_id: null,
    p_end_date: new Date().toISOString(),
    p_metadata: { cancelled_subscription: subscription.id },
    p_cancel_at_period_end: false,
  });

  if (!requireClaimedStripeEvent(data, error, 'customer.subscription.deleted')) return;

  console.log(`[Webhook] ✅ User ${authId} downgraded to free tier via RPC:`, data);

  await recordServerConversion(profileId, 'subscription_cancelled_server', {
    event_id: eventId,
    subscription_id: subscription.id,
    customer_id: customerId,
  });
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;

  const { data: userData } = await supabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userData) {
    console.error('[Webhook] User not found for failed payment:', invoice.id);
    return;
  }

  console.warn(`[Webhook] ⚠️ Payment failed for user ${userData.auth_id} (${userData.email})`);

  // Record the failed event for tracking with attempt count
  const attemptCount = invoice.attempt_count || 1;
  await supabase
    .from('stripe_events')
    .insert({
      id: eventId,
      type: 'invoice.payment_failed',
      status: 'processed',
      metadata: {
        user_id: userData.id,
        invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        attempt_count: attemptCount,
        next_payment_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null,
      },
    })
    .onConflict('id')
    .ignore();

  // Flag the user's profile so the app can show an in-app dunning notice.
  // This is cleared when a subsequent invoice.paid event is received.
  // Note: Stripe automatically sends dunning emails based on your Smart Retries
  // settings in the Stripe Dashboard (Settings > Billing > Subscriptions and emails).
  await supabase
    .from('users')
    .update({ payment_failed_at: new Date().toISOString() })
    .eq('id', userData.id);

  if (userData.email && attemptCount === 1) {
    // Send email only on the first failure attempt to avoid spamming
    const template = getEmailTemplate('payment_failed', { full_name: userData.full_name });
    await sendEmail({
      to: userData.email,
      subject: template.subject,
      type: 'payment_failed',
      html: template.html,
      text: template.text,
    });
  }

  await recordServerConversion(userData.id, 'subscription_payment_failed_server', {
    event_id: eventId,
    invoice_id: invoice.id,
    amount_due: (invoice.amount_due || 0) / 100,
    currency: (invoice.currency || 'usd').toUpperCase(),
    attempt_count: attemptCount,
  });

  console.log(
    `[Webhook] Flagged user ${userData.auth_id} with payment_failed_at for in-app notification (attempt #${attemptCount})`
  );
}
