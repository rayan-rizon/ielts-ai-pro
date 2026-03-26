/**
 * Create Stripe Customer Portal Session (Security-Hardened)
 * 
 * Industry-standard subscription management that allows users to:
 * - View and download invoices
 * - Update payment methods
 * - Cancel or change subscriptions
 * - View billing history
 *
 * Security features:
 * - Hardcoded return URL (prevents open redirect)
 * - CSRF protection logic (matches checkout flow)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
    getCorsHeaders,
    handleCorsPrelight,
    errorResponse,
    successResponse,
    validateCsrfProtection,
} from '../_shared/security.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// SECURITY: Hardcoded frontend URL prevents open redirect attacks
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://ieltsai.pro';

/**
 * Helper to call Stripe API directly
 */
async function stripeRequest(endpoint: string, method: string, body?: Record<string, unknown>) {
    const url = `https://api.stripe.com/v1${endpoint}`;
    const headers: HeadersInit = {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
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
    return response.json();
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
            console.warn(`[CustomerPortal] CSRF validation failed: ${csrfCheck.error}`);
            return errorResponse('Request validation failed', 403, corsHeaders);
        }

        // Authentication
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

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, stripe_customer_id, subscription_tier')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userData) {
            return errorResponse('User not found', 404, corsHeaders);
        }

        if (!userData.stripe_customer_id) {
            return errorResponse('No active subscription found. Please subscribe first.', 400, corsHeaders);
        }

        // =====================================================================
        // SECURITY: Hardcoded return URL prevents open redirect
        // =====================================================================
        const portalSession = await stripeRequest('/billing_portal/sessions', 'POST', {
            customer: userData.stripe_customer_id,
            return_url: `${FRONTEND_URL}/settings?tab=billing`,
        });

        if (portalSession.error) {
            console.error('[CustomerPortal] Stripe error:', portalSession.error);
            return errorResponse('Failed to create billing portal session. Please contact support.', 500, corsHeaders);
        }

        console.log(`[CustomerPortal] Created portal session for user ${user.id}`);

        return successResponse({ url: portalSession.url }, corsHeaders);
    } catch (error) {
        console.error('[CustomerPortal] Unexpected error:', error);
        return errorResponse('An unexpected error occurred. Please try again.', 500, corsHeaders);
    }
});
