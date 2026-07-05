import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore
import {
  getCorsHeaders,
  handleCorsPrelight,
  errorResponse,
  checkRateLimit,
  RATE_LIMITS,
  getRateLimitIdentifier,
  rateLimitedResponse,
} from '../_shared/security.ts';

Deno.serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  // Apply Rate Limiting
  // We use the ID if authenticated, or IP fallback (though deleteUser requires auth header usually)
  // Actually, we process auth AFTER rate limit in standard flow, but for robust rate limiting
  // it's better to limit by IP first if possible, or limit by User ID after auth parse.
  // However, parsing auth is cheap. Let's do it after basic auth checks or use IP for unauth.
  // For this strict endpoint, let's just use the strict IP-based limit for now to prevent DoS,
  // and then we can also use user-based limit if we want (but shared security generic helper typically uses one).

  // Let's use IP-based identifier for pre-auth protection
  const rateLimitKey = getRateLimitIdentifier(req);
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.EXPENSIVE);

  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.resetIn, corsHeaders);
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Admin client for operations (uses service role key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requesting user from the token
    const token = authHeader.split(' ')[1];
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return errorResponse('Invalid or expired token', 401, corsHeaders);
    }

    // Parse request body
    let targetAuthId = null;
    try {
      const body = await req.json();
      targetAuthId = body.targetAuthId;
    } catch {
      // Empty body is fine for self-deletion
    }

    // Determine if this is self-deletion or admin deletion
    const isSelfDeletion = !targetAuthId || targetAuthId === requestingUser.id;
    const authIdToDelete = isSelfDeletion ? requestingUser.id : targetAuthId;

    // If not self-deletion, verify the requesting user is an admin
    if (!isSelfDeletion) {
      const { data: adminProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('auth_id', requestingUser.id)
        .single();

      if (profileError || adminProfile?.role !== 'admin') {
        return errorResponse('Admin access required to delete other users', 403, corsHeaders);
      }

      // Prevent admins from deleting other admins
      const { data: targetProfile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('auth_id', authIdToDelete)
        .single();

      if (targetProfile?.role === 'admin') {
        return errorResponse('Cannot delete admin users', 403, corsHeaders);
      }
    }

    // ── Clean up FK-blocking references BEFORE deleting the auth user ──
    // Some tables reference public.users or auth.users WITHOUT ON DELETE CASCADE.
    // We must nullify / remove those references first so the cascade can proceed.

    // 1. Get the public.users row to find the profile id
    const { data: profileRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_id', authIdToDelete)
      .maybeSingle();

    const profileId = profileRow?.id;

    if (profileId) {
      // Nullify non-cascade FK columns that reference public.users(id)
      const cleanupOps = [
        supabaseAdmin
          .from('vocabulary_items')
          .update({ created_by: null })
          .eq('created_by', profileId),
        supabaseAdmin
          .from('referral_reward_tiers')
          .update({ updated_by: null })
          .eq('updated_by', profileId),
        supabaseAdmin
          .from('tier_rate_limits')
          .update({ updated_by: null })
          .eq('updated_by', profileId),
        // Self-referencing FK: users.referred_by → users.id
        supabaseAdmin.from('users').update({ referred_by: null }).eq('referred_by', profileId),
      ];

      const results = await Promise.allSettled(cleanupOps);
      for (const r of results) {
        if (r.status === 'rejected') {
          console.warn('Non-critical cleanup warning:', r.reason);
        }
      }
    }

    // 2. Nullify non-cascade FK columns that reference auth.users(id) directly
    const authCleanupOps = [
      supabaseAdmin
        .from('notifications')
        .update({ created_by: null })
        .eq('created_by', authIdToDelete),
      supabaseAdmin
        .from('system_settings')
        .update({ updated_by: null })
        .eq('updated_by', authIdToDelete),
    ];

    const authResults = await Promise.allSettled(authCleanupOps);
    for (const r of authResults) {
      if (r.status === 'rejected') {
        console.warn('Non-critical auth cleanup warning:', r.reason);
      }
    }

    // ── Now delete the auth user (cascades to public.users via FK) ──
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authIdToDelete);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return errorResponse(deleteError.message, 500, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isSelfDeletion ? 'Account deleted successfully' : 'User deleted successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('An unexpected error occurred', 500, corsHeaders);
  }
});
