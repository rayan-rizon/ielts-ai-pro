import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import {
  errorResponse,
  getCorsHeaders,
  handleCorsPrelight,
  validateCsrfProtection,
} from '../_shared/security.ts';

/**
 * Browser-originated XP awards are deliberately disabled.
 *
 * An authenticated browser can create or edit several learner-progress rows,
 * so treating one of those rows as award evidence creates a minting endpoint.
 * Authoritative server workflows (for example evaluateSpeakingTest) call the
 * service-only award_user_points RPC after persisting their own evidence.
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);

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
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(authHeader?.split(' ')[1]);
  if (authError || !user) return errorResponse('Unauthorized', 401, corsHeaders);

  return errorResponse('XP is recorded only by verified server workflows', 403, corsHeaders);
});
