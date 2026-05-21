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

const ALLOWED_USER_UPDATE_FIELDS = new Set([
  'full_name',
  'subscription_tier',
  'role',
]);

function buildSafeUserUpdates(updates: Record<string, unknown>): Record<string, unknown> {
  const safeUpdates: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates || {})) {
    if (!ALLOWED_USER_UPDATE_FIELDS.has(key)) continue;

    if (key === 'subscription_tier') {
      if (!['free', 'pro', 'premium'].includes(String(value))) {
        throw new Error('Invalid subscription tier');
      }
    }

    if (key === 'role') {
      if (!['user', 'admin'].includes(String(value))) {
        throw new Error('Invalid user role');
      }
    }

    if (key === 'full_name') {
      const fullName = String(value ?? '').trim();
      if (fullName.length > 120) {
        throw new Error('Full name is too long');
      }
      safeUpdates[key] = fullName;
      continue;
    }

    safeUpdates[key] = value;
  }

  return safeUpdates;
}

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

    let safeUpdates: Record<string, unknown>;
    try {
      safeUpdates = buildSafeUserUpdates(updates);
    } catch (validationError) {
      return errorResponse((validationError as Error).message || 'Invalid update fields', 400, corsHeaders);
    }
    if (Object.keys(safeUpdates).length === 0) {
      return errorResponse('No allowed user fields provided', 400, corsHeaders);
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
      .update(safeUpdates)
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
