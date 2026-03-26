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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, pointsToAdd } = await req.json();

    const authHeader = req.headers.get('Authorization');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader?.split(' ')[1]);
    if (authError || !user || user.id !== userId) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // Rate Limiting for points updates
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const rateLimit = checkRateLimit(rateLimitId, RATE_LIMITS.STANDARD);

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetIn, corsHeaders);
    }

    const { data: currentPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newPoints = (currentPoints?.points || 0) + pointsToAdd;

    const { error: updateError } = await supabase
      .from('user_points')
      .update({ points: newPoints, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ newPoints }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
