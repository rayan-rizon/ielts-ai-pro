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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('INTERNAL_SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('INTERNAL_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

        // Determine if this is a transient error worth retrying
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTransient = errorMessage.includes('timeout') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('network') ||
            errorMessage.includes('503');

        if (isTransient) {
            // Return 500 so Stripe retries this event
            return new Response(
                JSON.stringify({ error: 'Transient error, will retry' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Permanent errors: return 200 to stop Stripe retries, log for manual review
        console.error(`[Webhook] PERMANENT ERROR for event ${event.type} (${event.id}). Stopping retries.`);
        try {
            await supabase.from('stripe_events').insert({
                id: `error_${event.id}`,
                type: event.type,
                status: 'failed_permanent',
                metadata: {
                    error: errorMessage,
                    event_id: event.id,
                    failed_at: new Date().toISOString(),
                },
            }).onConflict('id').ignore();
        } catch (logErr) {
            console.error('[Webhook] Failed to log permanent error:', logErr);
        }

        return new Response(
            JSON.stringify({ received: true, error: 'Permanent error logged' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
});

/**
 * Handle successful checkout session - new subscription
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
    const userId = session.metadata?.supabase_user_id;
    const authId = session.metadata?.supabase_auth_id;
    const tier = session.metadata?.tier;
    const interval = session.metadata?.interval;

    if (!userId || !authId || !tier) {
        console.error('[Webhook] Missing metadata in checkout session:', session.id);
        return;
    }

    console.log(`[Webhook] Checkout completed for user ${authId}, tier: ${tier}, interval: ${interval}`);

    // Calculate subscription end date
    const endDate = new Date();
    if (interval === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Use the unified RPC with ON CONFLICT handling
    const { data, error } = await supabase.rpc('handle_stripe_event', {
        p_event_id: eventId,
        p_event_type: 'checkout.session.completed',
        p_auth_id: authId,
        p_user_id: userId,
        p_tier: tier,
        p_interval: interval || 'monthly',
        p_amount: (session.amount_total || 0) / 100,
        p_currency: (session.currency || 'usd').toUpperCase(),
        p_transaction_id: session.id,
        p_subscription_id: typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as any)?.id || null,
        p_end_date: endDate.toISOString(),
        p_metadata: { session_id: session.id, customer: session.customer },
    });

    if (error) {
        console.error('[Webhook] RPC error for checkout.session.completed:', error);
        throw error;
    }

    if (data?.success) {
        console.log(`[Webhook] ✅ User ${authId} upgraded to ${tier} successfully`);
        // promo_discount is cleared atomically inside the RPC — no need for a separate update
    } else {
        console.warn('[Webhook] RPC returned:', data);
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
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_id')
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

    if (error) {
        console.error('[Webhook] RPC error for invoice.paid:', error);
        throw error;
    }

    console.log(`[Webhook] ✅ Recurring payment recorded for user ${userData.auth_id}`);

    // Clear any previous payment failure flag (dunning notice)
    await supabase
        .from('users')
        .update({ payment_failed_at: null })
        .eq('id', userData.id);
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
        const { data } = await supabase
            .from('users')
            .select('id, auth_id')
            .eq('id', userId)
            .single();
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
    const tier = subscription.status === 'active'
        ? (PRICE_TO_TIER[priceId] || subscription.metadata?.tier || 'pro')
        : 'free';
    const interval = PRICE_TO_INTERVAL[priceId] || subscription.metadata?.interval || 'monthly';

    const endDate = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : new Date();

    console.log(`[Webhook] Subscription ${subscription.id} updated: status=${subscription.status}, tier=${tier}`);

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

    if (error) {
        console.error('[Webhook] RPC error for subscription update:', error);
        throw error;
    }

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
        const { data } = await supabase.from('users').select('id, auth_id').eq('stripe_customer_id', customerId).single();
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

    if (error) {
        console.error('[Webhook] RPC error for subscription deletion:', error);
        throw error;
    }

    console.log(`[Webhook] ✅ User ${authId} downgraded to free tier via RPC:`, data);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
    const customerId = invoice.customer as string;

    const { data: userData } = await supabase
        .from('users')
        .select('id, auth_id, email')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!userData) {
        console.error('[Webhook] User not found for failed payment:', invoice.id);
        return;
    }

    console.warn(`[Webhook] ⚠️ Payment failed for user ${userData.auth_id} (${userData.email})`);

    // Record the failed event for tracking with attempt count
    const attemptCount = invoice.attempt_count || 1;
    await supabase.from('stripe_events').insert({
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
    }).onConflict('id').ignore();

    // Flag the user's profile so the app can show an in-app dunning notice.
    // This is cleared when a subsequent invoice.paid event is received.
    // Note: Stripe automatically sends dunning emails based on your Smart Retries
    // settings in the Stripe Dashboard (Settings > Billing > Subscriptions and emails).
    await supabase
        .from('users')
        .update({ payment_failed_at: new Date().toISOString() })
        .eq('id', userData.id);

    console.log(`[Webhook] Flagged user ${userData.auth_id} with payment_failed_at for in-app notification (attempt #${attemptCount})`);
}
