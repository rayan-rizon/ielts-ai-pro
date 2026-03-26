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
    const body = await req.json();
    const { targetUserId, updates } = body;

    if (!targetUserId || !updates) {
      return errorResponse('Missing required fields', 400, corsHeaders);
    }

    // Verify requesting user is an admin
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', requestingUser.id)
      .single();

    if (profileError || adminProfile?.role !== 'admin') {
      return errorResponse('Admin access required', 403, corsHeaders);
    }

    // Perform the update
    // Admins are created via SQL only - any admin can manage users
    // The BEFORE UPDATE trigger on users table provides column-level protection
    // We update based on 'id' (UUID) or 'auth_id'?
    // The UserManagement passed `userId`. Let's assume it matches the `id` column in `users` table.
    // However, `deleteUser` used `auth_id`.
    // Let's check UserManagement.jsx again.
    // It calls `User.update(userId, updates)`.
    // And `userId` comes from `user.id`.
    // In `User.js`, the update is `.eq('id', id)`.
    // So we should query by `id`.

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', targetUserId)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return errorResponse(updateError.message, 500, corsHeaders);
    }

    if (!updatedUser || updatedUser.length === 0) {
      return errorResponse(
        'User not found in the database. If you are testing locally, make sure your Edge Function is also running locally.',
        404,
        corsHeaders
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: updatedUser[0],
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
