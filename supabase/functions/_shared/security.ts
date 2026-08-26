/**
 * Shared Edge Function Utilities
 *
 * Provides CORS, rate limiting, and security helpers for all Supabase Edge Functions.
 */
import { sendEmail } from './resend.ts';
import { getEmailTemplate } from './templates.ts';
import { isAllowedOrigin } from './originValidation.ts';

// =============================================================================
// CORS Configuration
// =============================================================================

/**
 * Allowed origins for CORS.
 * Add your production domain(s) here.
 */
/**
 * Get CORS headers based on the request origin.
 * Returns specific origin if allowed, or null if not.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';

  const baseHeaders = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-csrf-token, x-requested-with, x-upload-purpose',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };

  if (!isAllowedOrigin(origin)) return baseHeaders;

  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPrelight(req: Request): Response {
  return new Response(null, {
    headers: getCorsHeaders(req),
    status: 204,
  });
}

// =============================================================================
// Rate Limiting (In-Memory - suitable for edge functions)
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on cold start, but OK for edge function isolation)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
}

// Default configs per function type
export const RATE_LIMITS = {
  AI_FUNCTION: { maxRequests: 10, windowMs: 60000 }, // 10/minute for AI
  STANDARD: { maxRequests: 60, windowMs: 60000 }, // 60/minute for standard
  EXPENSIVE: { maxRequests: 5, windowMs: 60000 }, // 5/minute for expensive ops
};

/**
 * Check rate limit for a user/IP combination.
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.STANDARD
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get rate limit identifier from request (user ID or IP)
 */
export function getRateLimitIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  // Fallback to IP (from various headers or connection)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limited response with proper headers
 */
export function rateLimitedResponse(
  resetIn: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(resetIn / 1000),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}

// =============================================================================
// CSRF Protection
// =============================================================================

/**
 * Validate CSRF token from request.
 * For Supabase edge functions, we use several strategies:
 * 1. Check Origin/Referer headers match allowed origins
 * 2. For state-changing requests, verify custom header is present
 *
 * Note: Supabase Auth handles CSRF for auth operations automatically.
 * This is for custom state-changing endpoints.
 */
export function validateCsrfProtection(req: Request): { valid: boolean; error?: string } {
  // Skip for GET/HEAD/OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return { valid: true };
  }

  const origin = req.headers.get('Origin');
  const referer = req.headers.get('Referer');

  // Check origin matches allowed list
  if (origin) {
    if (!isAllowedOrigin(origin)) {
      return { valid: false, error: 'Invalid request origin' };
    }
  }

  // If no Origin, check Referer (some browsers/proxies strip Origin)
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (!isAllowedOrigin(refererOrigin)) {
        return { valid: false, error: 'Invalid request referer' };
      }
    } catch {
      return { valid: false, error: 'Invalid referer header' };
    }
  }

  // For maximum security, require x-csrf-token header for state-changing operations
  // The client should include this header (value can be any non-empty string for SameSite approach)
  // This prevents simple CSRF attacks from forms
  const csrfToken = req.headers.get('x-csrf-token') || req.headers.get('x-requested-with');

  // CSRF protection enabled: Require token for state-changing operations
  // The frontend must include 'x-csrf-token' or 'x-requested-with' header
  if (!csrfToken) {
    return { valid: false, error: 'Missing CSRF token' };
  }

  return { valid: true };
}

// =============================================================================
// Response Helpers
// =============================================================================

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  details?: Record<string, unknown>
): Response {
  return new Response(JSON.stringify({ error: message, ...details }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a standardized success response
 */
export function successResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// =============================================================================
// Database-Driven Quota Management (Hybrid Approach)
// =============================================================================

interface QuotaCheckResult {
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyUsed: number;
  monthlyUsed: number;
  error?: string;
}

export interface QuotaReservationResult extends QuotaCheckResult {
  reservationId?: string;
  alreadyReserved?: boolean;
}

/**
 * Atomically checks quota and records usage before provider work begins.
 * Subscription tier is resolved in the database from the authenticated user.
 */
export async function reserveDatabaseQuota(
  // @ts-ignore
  supabase: any,
  authId: string,
  endpoint: string,
  featureType: string | null = null,
  idempotencyKey: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<QuotaReservationResult> {
  try {
    const { data, error } = await supabase.rpc('reserve_ai_api_usage', {
      p_auth_id: authId,
      p_endpoint: endpoint,
      p_feature_type: featureType,
      p_idempotency_key: idempotencyKey,
      p_metadata: metadata,
    });

    if (error) {
      console.error('AI quota reservation failed:', error);
      return {
        allowed: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        dailyUsed: 0,
        monthlyUsed: 0,
        error: 'Could not reserve AI quota — access denied',
      };
    }

    const result = data?.[0] || data;
    return {
      allowed: result?.allowed ?? false,
      dailyRemaining: result?.daily_remaining ?? 0,
      monthlyRemaining: result?.monthly_remaining ?? 0,
      dailyUsed: result?.daily_used ?? 0,
      monthlyUsed: result?.monthly_used ?? 0,
      reservationId: result?.reservation_id || undefined,
      alreadyReserved: result?.already_reserved ?? false,
    };
  } catch (err) {
    console.error('AI quota reservation exception:', err);
    return {
      allowed: false,
      dailyRemaining: 0,
      monthlyRemaining: 0,
      dailyUsed: 0,
      monthlyUsed: 0,
      error: 'Could not reserve AI quota — access denied',
    };
  }
}

/**
 * Adds provider usage details to an existing reservation.
 */
export async function finalizeApiUsage(
  // @ts-ignore
  supabase: any,
  reservationId: string | undefined,
  tokensUsed: number = 0,
  cached: boolean = false,
  metadata: Record<string, unknown> = {},
  status: 'completed' | 'failed' = 'completed'
): Promise<boolean> {
  if (!reservationId) return false;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { data, error } = await supabase.rpc('finalize_ai_api_usage', {
        p_reservation_id: reservationId,
        p_tokens_used: Math.max(0, Math.round(tokensUsed)),
        p_cached: cached,
        p_metadata: metadata,
        p_status: status,
      });

      if (!error && data === true) return true;
      console.warn(`Failed to finalize AI usage reservation (attempt ${attempt}/3):`, error);
    } catch (err) {
      console.warn(`AI usage finalization exception (attempt ${attempt}/3):`, err);
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 50));
    }
  }

  return false;
}

/**
 * Recover a response that was finalized before the client received it. This
 * closes the gap between provider completion and a lost HTTP response without
 * invoking the paid provider again.
 */
export async function getFinalizedReservationResult<T>(
  // @ts-ignore
  supabase: any,
  reservationId: string | undefined,
  metadataKey = 'response'
): Promise<T | null> {
  if (!reservationId) return null;

  try {
    const { data, error } = await supabase
      .from('ai_api_usage')
      .select('request_metadata')
      .eq('id', reservationId)
      .maybeSingle();
    if (error || data?.request_metadata?.reservationStatus !== 'completed') return null;
    return (data.request_metadata?.[metadataKey] as T) ?? null;
  } catch (error) {
    console.warn('Could not recover finalized AI reservation response:', error);
    return null;
  }
}

/**
 * Check user's quota against database-stored tier limits.
 * This is the persistent quota check (daily/monthly limits).
 * Use in combination with in-memory burst limiting for hybrid approach.
 */
export async function checkDatabaseQuota(
  // @ts-ignore
  supabase: any,
  userId: string,
  tier: string,
  featureType: string | null = null
): Promise<QuotaCheckResult> {
  try {
    // First get user's profile ID and role from auth_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role, email, full_name')
      .eq('auth_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Failed to get user profile:', profileError);
      // SECURITY: Fail-closed — deny access when quota cannot be verified
      return {
        allowed: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        dailyUsed: 0,
        monthlyUsed: 0,
        error: 'Could not verify quota — access denied',
      };
    }

    // Admin role always gets admin-tier limits regardless of subscription_tier
    let effectiveTier = tier.toLowerCase();
    if (userProfile.role === 'admin') {
      effectiveTier = 'admin';
    }

    // Call the database function to check rate limits (feature-aware)
    const { data, error } = await supabase.rpc('check_user_rate_limit', {
      p_user_id: userProfile.id,
      p_tier: effectiveTier,
      p_feature_type: featureType,
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // SECURITY: Fail-closed — deny access when rate limit check fails
      return {
        allowed: false,
        dailyRemaining: 0,
        monthlyRemaining: 0,
        dailyUsed: 0,
        monthlyUsed: 0,
        error: 'Rate limit check failed — access denied',
      };
    }

    const result = data?.[0] || data;

    // Trigger low quota / conversion email for free users ONLY when exactly 1 credit remains
    if (
      effectiveTier === 'free' &&
      result?.allowed &&
      (result?.daily_remaining === 1 || result?.monthly_remaining === 1) &&
      userProfile.email
    ) {
      const template = getEmailTemplate('quota_conversion', { full_name: userProfile.full_name });
      sendEmail({
        to: userProfile.email,
        subject: template.subject,
        type: 'quota_conversion',
        html: template.html,
        text: template.text,
      }).catch((err) => console.error('Failed to send quota email:', err));
    }

    return {
      allowed: result?.allowed ?? false,
      dailyRemaining: result?.daily_remaining ?? 0,
      monthlyRemaining: result?.monthly_remaining ?? 0,
      dailyUsed: result?.daily_used ?? 0,
      monthlyUsed: result?.monthly_used ?? 0,
    };
  } catch (err) {
    console.error('Quota check exception:', err);
    // SECURITY: Fail-closed — deny access on unexpected exceptions
    return {
      allowed: false,
      dailyRemaining: 0,
      monthlyRemaining: 0,
      dailyUsed: 0,
      monthlyUsed: 0,
      error: 'Quota check exception — access denied',
    };
  }
}

/**
 * Log API usage to the database for tracking and analytics.
 * This should be called after a successful AI API call.
 */
export async function logApiUsage(
  // @ts-ignore
  supabase: any,
  authId: string,
  endpoint: string,
  cached: boolean = false,
  tokensUsed: number = 0,
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    // Get user's profile ID from auth_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authId)
      .single();

    if (profileError || !userProfile) {
      console.warn('Could not find user profile for usage logging:', profileError);
      return false;
    }

    const { error } = await supabase.from('ai_api_usage').insert({
      user_id: userProfile.id,
      endpoint,
      cached,
      request_metadata: metadata,
      tokens_used: tokensUsed,
    });

    if (error) {
      console.warn('Failed to log API usage:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Usage logging exception:', err);
    return false;
  }
}

/**
 * Create a quota exceeded response with usage details
 */
export function quotaExceededResponse(
  quotaResult: QuotaCheckResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Daily or monthly API quota exceeded',
      dailyUsed: quotaResult.dailyUsed,
      dailyRemaining: quotaResult.dailyRemaining,
      monthlyUsed: quotaResult.monthlyUsed,
      monthlyRemaining: quotaResult.monthlyRemaining,
      upgradeMessage: 'Upgrade your subscription for higher limits',
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Stop an idempotent request that is already reserved or completed before it
 * reaches a paid provider. Failed reservations are reactivated by the database
 * and therefore arrive with `alreadyReserved = false`.
 */
export function duplicateReservationResponse(
  corsHeaders: Record<string, string>,
  message = 'This request is already being processed or has already completed.'
): Response {
  return new Response(
    JSON.stringify({
      error: 'duplicate_request',
      message,
      retryable: false,
    }),
    {
      status: 409,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Get burst limit config from tier.
 * Maps database tier to in-memory burst limit configuration.
 */
export function getBurstLimitConfig(tier: string): RateLimitConfig {
  const burstLimits: Record<string, RateLimitConfig> = {
    free: { maxRequests: 3, windowMs: 60000 },
    pro: { maxRequests: 10, windowMs: 60000 },
    premium: { maxRequests: 20, windowMs: 60000 },
    admin: { maxRequests: 50, windowMs: 60000 },
  };
  return burstLimits[tier] || burstLimits['free'];
}

// =============================================================================
// Tier Access Control
// =============================================================================

/**
 * Check if a user's subscription tier is allowed to access a feature.
 * Returns null if access is granted, or a Response object if denied.
 *
 * Usage:
 *   const denied = checkTierAccess(tier, ['pro', 'premium', 'admin'], corsHeaders);
 *   if (denied) return denied;
 */
export function checkTierAccess(
  userTier: string,
  allowedTiers: string[],
  corsHeaders: Record<string, string>,
  featureName = 'this feature'
): Response | null {
  if (allowedTiers.includes(userTier)) {
    return null; // Access granted
  }

  return new Response(
    JSON.stringify({
      error: `Your current plan (${userTier}) does not include access to ${featureName}. Please upgrade to continue.`,
      requiredTier: allowedTiers[0],
      currentTier: userTier,
      rateLimitType: 'quota', // Mark as an upgrade-worthy event for frontend
    }),
    {
      status: 403,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
