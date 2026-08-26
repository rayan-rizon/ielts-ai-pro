import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import {
  getCorsHeaders,
  handleCorsPrelight,
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimitedResponse,
  validateCsrfProtection,
  RATE_LIMITS,
  errorResponse,
} from '../_shared/security.ts';

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  try {
    // CSRF Protection
    const csrfCheck = validateCsrfProtection(req);
    if (!csrfCheck.valid) {
      return errorResponse(csrfCheck.error || 'CSRF validation failed', 403, corsHeaders);
    }

    const authHeader = req.headers.get('Authorization');
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    // SECURITY: Read body first, but authenticate via JWT before trusting any value
    const body = await req.json();
    const { pointsToAdd, actionKey, reason = 'test_completion' } = body;

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(authHeader?.split(' ')[1]);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // SECURITY: Validate pointsToAdd is a safe, bounded positive integer
    // Never trust the client for the amount — cap at server-defined maximum
    const MAX_POINTS_PER_ACTION = 1200;
    if (
      typeof pointsToAdd !== 'number' ||
      !Number.isInteger(pointsToAdd) ||
      pointsToAdd <= 0 ||
      pointsToAdd > MAX_POINTS_PER_ACTION
    ) {
      return errorResponse(
        `pointsToAdd must be a positive integer between 1 and ${MAX_POINTS_PER_ACTION}`,
        400,
        corsHeaders
      );
    }
    if (typeof actionKey !== 'string' || !actionKey.trim() || actionKey.length > 200) {
      return errorResponse('A valid actionKey is required', 400, corsHeaders);
    }

    // Rate Limiting for points updates
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const rateLimit = checkRateLimit(rateLimitId, RATE_LIMITS.STANDARD);

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetIn, corsHeaders);
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: awardResult, error: updateError } = await serviceClient.rpc('award_user_points', {
      p_auth_id: user.id,
      p_points: pointsToAdd,
      p_action_key: actionKey.trim(),
      p_reason: reason,
    });
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ newPoints: awardResult.new_points, awarded: awardResult.awarded }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
