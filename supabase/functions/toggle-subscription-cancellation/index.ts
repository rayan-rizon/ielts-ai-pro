/**
 * Toggle Subscription Cancellation (Industry-Standard, Server-Authoritative)
 *
 * SECURITY MODEL:
 *  - Auth: JWT verification via Supabase (user must own the subscription)
 *  - CSRF: X-Requested-With / X-CSRF-Token header required
 *  - Rate limit: 5 requests/minute (EXPENSIVE tier)
 *  - Stripe is the source of truth — DB is only updated AFTER Stripe confirms
 *  - User can only modify their own subscription (ownership enforced server-side)
 *
 * ACTION:
 *  - cancel: true  → set cancel_at_period_end = true on Stripe
 *  - cancel: false → reactivate subscription (set cancel_at_period_end = false)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
    getCorsHeaders,
    handleCorsPrelight,
    errorResponse,
    successResponse,
    validateCsrfProtection,
    checkRateLimit,
    getRateLimitIdentifier,
    rateLimitedResponse,
    RATE_LIMITS,
} from '../_shared/security.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!STRIPE_SECRET_KEY) {
    console.error('[ToggleCancel] STRIPE_SECRET_KEY is not set');
}

/**
 * Call the Stripe REST API directly (no SDK needed — smaller cold start)
 */
async function stripeRequest(
    endpoint: string,
    method: string,
    body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const url = `https://api.stripe.com/v1${endpoint}`;
    const headers: HeadersInit = {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    const options: RequestInit = { method, headers };

    if (body) {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
            formData.append(key, String(value));
        }
        options.body = formData.toString();
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `Stripe API error (${response.status}): ${(data as { error?: { message?: string } }).error?.message || 'Unknown Stripe error'
            }`
        );
    }

    return data as Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return handleCorsPrelight(req);
    }

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405, corsHeaders);
    }

    try {
        // =====================================================================
        // SECURITY: CSRF Protection
        // =====================================================================
        const csrfCheck = validateCsrfProtection(req);
        if (!csrfCheck.valid) {
            console.warn(`[ToggleCancel] CSRF validation failed: ${csrfCheck.error}`);
            return errorResponse('Request validation failed', 403, corsHeaders);
        }

        // =====================================================================
        // SECURITY: Authentication — verify JWT and extract user
        // =====================================================================
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse('Missing or invalid authorization header', 401, corsHeaders);
        }

        const token = authHeader.replace('Bearer ', '');

        // Use service-role client so we can securely look up the user record
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the JWT token is valid and get the authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
            console.warn('[ToggleCancel] Auth failed:', authError?.message);
            return errorResponse('Unauthorized', 401, corsHeaders);
        }

        // =====================================================================
        // SECURITY: Rate Limiting — 5 requests/minute per user
        // =====================================================================
        const rateLimitKey = getRateLimitIdentifier(req, authUser.id);
        const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.EXPENSIVE);
        if (!rateLimit.allowed) {
            console.warn(`[ToggleCancel] Rate limit exceeded for user ${authUser.id}`);
            return rateLimitedResponse(rateLimit.resetIn, corsHeaders);
        }

        // =====================================================================
        // Parse and validate request body
        // =====================================================================
        let requestBody: { cancel?: boolean };
        try {
            requestBody = await req.json();
        } catch {
            return errorResponse('Invalid request body — expected JSON', 400, corsHeaders);
        }

        const { cancel } = requestBody;
        if (typeof cancel !== 'boolean') {
            return errorResponse('Missing required field: cancel (boolean)', 400, corsHeaders);
        }

        // =====================================================================
        // Fetch user's subscription ID from DB — ownership enforced here
        // We only return data for the authenticated user's own auth_id
        // =====================================================================
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, stripe_subscription_id, stripe_customer_id, subscription_tier, cancel_at_period_end')
            .eq('auth_id', authUser.id)       // <-- ownership check
            .single();

        if (userError || !userData) {
            console.error('[ToggleCancel] User not found:', userError?.message);
            return errorResponse('User not found', 404, corsHeaders);
        }

        let subscriptionIdStr = userData.stripe_subscription_id;

        // BUG FIX: sync-stripe-session previously stored the full expanded Stripe subscription object 
        // as a JSON string instead of just the ID. Handle both cases gracefully.
        if (subscriptionIdStr && subscriptionIdStr.startsWith('{')) {
            try {
                const parsed = JSON.parse(subscriptionIdStr);
                if (parsed && typeof parsed === 'object' && parsed.id) {
                    subscriptionIdStr = parsed.id;
                    console.log(`[ToggleCancel] Extracted subscription ID ${subscriptionIdStr} from JSON`);
                }
            } catch (e) {
                // Ignore parse errors, fallback to raw string
            }
        }

        if (!subscriptionIdStr) {
            return errorResponse(
                'No active Stripe subscription found. Please contact support if you believe this is an error.',
                400,
                corsHeaders
            );
        }

        if (!userData.stripe_customer_id) {
            return errorResponse('No Stripe customer record found', 400, corsHeaders);
        }

        // Guard: prevent no-op (idempotency)
        if (userData.cancel_at_period_end === cancel) {
            const message = cancel
                ? 'Subscription is already scheduled for cancellation'
                : 'Subscription is already active';
            return successResponse(
                {
                    success: true,
                    cancel_at_period_end: cancel,
                    message,
                    noOp: true,
                },
                corsHeaders
            );
        }

        console.log(
            `[ToggleCancel] User ${authUser.id} requesting cancel=${cancel} for subscription ${subscriptionIdStr}`
        );

        // =====================================================================
        // Call Stripe API — Stripe is the source of truth
        // =====================================================================
        let stripeSubscription: Record<string, unknown>;

        if (cancel) {
            // Set cancel_at_period_end = true: subscription stays active until period ends, then cancels
            stripeSubscription = await stripeRequest(
                `/subscriptions/${subscriptionIdStr}`,
                'POST',
                {
                    cancel_at_period_end: 'true',
                }
            );
        } else {
            // Reactivate: remove the scheduled cancellation
            stripeSubscription = await stripeRequest(
                `/subscriptions/${subscriptionIdStr}`,
                'POST',
                {
                    cancel_at_period_end: 'false',
                }
            );
        }

        // Verify Stripe returned expected state
        const stripeConfirmedCancelAtPeriodEnd = stripeSubscription.cancel_at_period_end as boolean;

        if (stripeConfirmedCancelAtPeriodEnd !== cancel) {
            // This should not happen, but guard against inconsistency
            console.error(
                '[ToggleCancel] Stripe returned unexpected cancel_at_period_end:',
                stripeConfirmedCancelAtPeriodEnd,
                'expected:',
                cancel
            );
            return errorResponse(
                'Stripe returned an unexpected state. Please try again or contact support.',
                500,
                corsHeaders
            );
        }

        // =====================================================================
        // Sync DB — only after Stripe has confirmed the change
        // =====================================================================
        const { error: updateError } = await supabase
            .from('users')
            .update({
                cancel_at_period_end: stripeConfirmedCancelAtPeriodEnd,
                updated_at: new Date().toISOString(),
            })
            .eq('auth_id', authUser.id); // ownership check again

        if (updateError) {
            // Stripe is already updated; log but don't fail — webhook will re-sync
            console.error('[ToggleCancel] DB sync failed (webhook will correct):', updateError.message);
        }

        const actionLabel = cancel ? 'scheduled for cancellation' : 'reactivated';
        console.log(`[ToggleCancel] ✅ Subscription ${actionLabel} for user ${authUser.id}`);

        return successResponse(
            {
                success: true,
                cancel_at_period_end: stripeConfirmedCancelAtPeriodEnd,
                subscription_id: subscriptionIdStr,
                message: `Subscription ${actionLabel} successfully.`,
            },
            corsHeaders
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('[ToggleCancel] Unexpected error:', message);
        return errorResponse(message, 500, corsHeaders);
    }
});
