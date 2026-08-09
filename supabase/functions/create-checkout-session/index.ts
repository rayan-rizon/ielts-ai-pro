/**
 * Create Stripe Checkout Session (Security-Hardened)
 *
 * Creates a checkout session for subscription payments.
 * Uses raw fetch to Stripe API for better local dev performance.
 * Supports both inline pricing (from admin settings) and fixed price IDs.
 *
 * Security features:
 * - Rate limiting (5 req/min per user)
 * - CSRF protection (Origin/Referer validation + custom header)
 * - Server-side pricing only (client priceAmount ignored)
 * - Idempotent Stripe coupon creation (deterministic IDs)
 * - Currency whitelist validation
 * - Open redirect prevention (hardcoded frontend URL)
 * - Active subscription overlap prevention
 * - Sanitized error messages (no internal details leaked)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPrelight,
  errorResponse,
  successResponse,
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimitedResponse,
  validateCsrfProtection,
  RATE_LIMITS,
} from '../_shared/security.ts';

// =============================================================================
// Configuration
// =============================================================================

// Fallback Price IDs from environment (used when inline pricing is not available)
const PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') || '',
    quarterly: Deno.env.get('STRIPE_PRO_QUARTERLY_PRICE_ID') || '',
  },
  premium: {
    monthly: Deno.env.get('STRIPE_PREMIUM_MONTHLY_PRICE_ID') || '',
    quarterly: Deno.env.get('STRIPE_PREMIUM_QUARTERLY_PRICE_ID') || '',
  },
};

// Stripe Product IDs - must exist in Stripe
const PRODUCT_IDS: Record<string, string> = {
  pro: Deno.env.get('STRIPE_PRO_PRODUCT_ID') || 'prod_TsKoWTD1JjXebq',
  premium: Deno.env.get('STRIPE_PREMIUM_PRODUCT_ID') || 'prod_TsKulU8disXiO6',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// SECURITY: Hardcoded frontend URL prevents open redirect attacks
// The Origin header is user-controlled and MUST NOT be used for redirect URLs
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://ieltsai.pro';

// SECURITY: Whitelist of accepted currencies (prevents injection of invalid currencies)
const ALLOWED_CURRENCIES = new Set(['usd', 'bdt']);

// Valid tiers and intervals (prevent injection)
const VALID_TIERS = new Set(['pro', 'premium']);
const VALID_INTERVALS = new Set(['monthly', 'quarterly']);

// =============================================================================
// Stripe API Helper
// =============================================================================

async function stripeRequest(endpoint: string, method: string, body?: Record<string, unknown>) {
  const url = `https://api.stripe.com/v1${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options: RequestInit = { method, headers };

  if (body) {
    // Convert object to URL-encoded form data
    const formData = new URLSearchParams();
    const flatten = (obj: Record<string, unknown>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, fullKey);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              flatten(item as Record<string, unknown>, `${fullKey}[${index}]`);
            } else {
              formData.append(`${fullKey}[${index}]`, String(item));
            }
          });
        } else {
          formData.append(fullKey, String(value));
        }
      }
    };
    flatten(body);
    options.body = formData.toString();
  }

  const response = await fetch(url, options);
  return response.json();
}

// =============================================================================
// Admin Pricing
// =============================================================================

async function getAdminPricing(
  supabase: ReturnType<typeof createClient>,
  tier: string,
  currency: string
): Promise<{ price: number; originalPrice: number } | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'pricing_tiers')
      .single();

    if (error || !data?.value) return null;

    const pricingTiers = data.value as Record<
      string,
      {
        price: number;
        originalPrice: number;
        currency?: string;
        regional?: Array<{ currency?: string; price?: number }>;
      }
    >;
    const tierPricing = pricingTiers[tier];
    if (!tierPricing) return null;

    const regionalPrice = tierPricing.regional?.find(
      (regional) => regional?.currency?.trim().toLowerCase() === currency
    );
    const configuredPrice = regionalPrice?.price ?? tierPricing.price;

    if (Number(configuredPrice) > 0) {
      return {
        price: Number(configuredPrice),
        originalPrice: Number(tierPricing.originalPrice) || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

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
    // Validates Origin/Referer headers and requires custom header
    // =====================================================================
    const csrfCheck = validateCsrfProtection(req);
    if (!csrfCheck.valid) {
      console.warn(`[Checkout] CSRF validation failed: ${csrfCheck.error}`);
      return errorResponse('Request validation failed', 403, corsHeaders);
    }

    // =====================================================================
    // Authentication
    // =====================================================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401, corsHeaders);
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // =====================================================================
    // SECURITY: Rate Limiting (5 req/min per user)
    // Prevents coupon/customer spam attacks
    // =====================================================================
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const rateCheck = checkRateLimit(rateLimitId, RATE_LIMITS.EXPENSIVE);
    if (!rateCheck.allowed) {
      console.warn(`[Checkout] Rate limit exceeded for user ${user.id}`);
      return rateLimitedResponse(rateCheck.resetIn, corsHeaders);
    }

    // =====================================================================
    // Input Validation (strict whitelist)
    // =====================================================================
    const { tier, interval, currency, marketing_campaign_id, marketing_delivery_id } =
      await req.json();
    // NOTE: priceAmount is intentionally NOT destructured — it is IGNORED

    if (!tier || !interval) {
      return errorResponse('Missing tier or interval', 400, corsHeaders);
    }

    if (!VALID_TIERS.has(tier)) {
      return errorResponse('Invalid tier', 400, corsHeaders);
    }

    if (!VALID_INTERVALS.has(interval)) {
      return errorResponse('Invalid interval', 400, corsHeaders);
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let marketingAttribution: { campaignId: string; deliveryId: string } | null = null;

    // SECURITY: Validate currency against whitelist
    const validatedCurrency =
      typeof currency === 'string' && ALLOWED_CURRENCIES.has(currency.toLowerCase())
        ? currency.toLowerCase()
        : 'usd';

    // =====================================================================
    // User Data & Subscription Check
    // =====================================================================
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'id, email, full_name, stripe_customer_id, stripe_subscription_id, subscription_tier, promo_discount'
      )
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return errorResponse('User not found', 404, corsHeaders);
    }

    // Campaign attribution is accepted only when the delivery belongs to the
    // authenticated profile. A copied URL must never credit another learner's
    // delivery or expose whether that delivery exists.
    if (
      uuidPattern.test(marketing_campaign_id || '') &&
      uuidPattern.test(marketing_delivery_id || '')
    ) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: attributedDelivery } = await serviceClient
        .from('marketing_deliveries')
        .select('id,campaign_id,user_id')
        .eq('id', marketing_delivery_id)
        .eq('campaign_id', marketing_campaign_id)
        .eq('user_id', userData.id)
        .single();
      if (attributedDelivery) {
        marketingAttribution = {
          campaignId: attributedDelivery.campaign_id,
          deliveryId: attributedDelivery.id,
        };
      }
    }

    // SECURITY: Prevent overlapping subscriptions
    // Handle legacy bug where stripe_subscription_id was stored as a JSON object
    let existingSubId = userData.stripe_subscription_id;
    if (existingSubId && typeof existingSubId === 'string' && existingSubId.startsWith('{')) {
      try {
        const parsed = JSON.parse(existingSubId);
        existingSubId = parsed?.id || existingSubId;
      } catch {
        /* use raw value */
      }
    }
    if (existingSubId && userData.subscription_tier !== 'free') {
      console.warn(`[Checkout] User ${user.id} already has active subscription: ${existingSubId}`);
      return errorResponse(
        'You already have an active subscription. Please cancel it first or manage it from your account settings.',
        409,
        corsHeaders
      );
    }

    // =====================================================================
    // Stripe Customer (create or retrieve)
    // =====================================================================
    let customerId = userData.stripe_customer_id;

    if (!customerId) {
      const customerData = await stripeRequest('/customers', 'POST', {
        email: userData.email || user.email,
        name: userData.full_name || undefined,
        metadata: {
          supabase_user_id: userData.id,
          supabase_auth_id: user.id,
        },
      });

      if (customerData.error) {
        console.error('[Checkout] Failed to create Stripe customer:', customerData.error);
        return errorResponse('Failed to initialize payment. Please try again.', 500, corsHeaders);
      }

      customerId = customerData.id;

      // Save Stripe customer ID to user record
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userData.id);
    }

    // =====================================================================
    // SERVER-SIDE Promo Discount Validation
    // Uses service-role client (bypasses RLS on promo_codes table)
    // =====================================================================
    let validatedDiscount: { code: string; discount_type: string; discount_value: number } | null =
      null;
    const userPromoDiscount = userData.promo_discount as {
      code?: string;
      discount_type?: string;
      discount_value?: number;
    } | null;

    if (
      userPromoDiscount?.code &&
      userPromoDiscount?.discount_type &&
      userPromoDiscount?.discount_value
    ) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: promoData } = await serviceClient
          .from('promo_codes')
          .select(
            'id, code, discount_type, discount_value, is_active, valid_until, offer_expires_at, assigned_user_id, max_uses, current_uses'
          )
          .ilike('code', userPromoDiscount.code)
          .eq('is_active', true)
          .single();

        if (promoData) {
          const isNotExpired =
            (!promoData.valid_until || new Date(promoData.valid_until) > new Date()) &&
            (!promoData.offer_expires_at || new Date(promoData.offer_expires_at) > new Date());
          const isNotMaxedOut =
            !promoData.max_uses || (promoData.current_uses || 0) < promoData.max_uses;
          const isAssignedToUser =
            !promoData.assigned_user_id || promoData.assigned_user_id === userData.id;

          if (isNotExpired && isNotMaxedOut && isAssignedToUser) {
            validatedDiscount = {
              code: promoData.code,
              discount_type: promoData.discount_type,
              discount_value: Number(promoData.discount_value),
            };
            console.log(
              `[Checkout] Validated promo code: ${promoData.code} (${promoData.discount_type}: ${promoData.discount_value})`
            );
          } else {
            console.log(
              `[Checkout] Promo code ${userPromoDiscount.code} is expired or maxed out, skipping discount`
            );
          }
        } else {
          console.log(
            `[Checkout] Promo code ${userPromoDiscount.code} not found or inactive, skipping discount`
          );
        }
      } catch (promoErr) {
        console.error('[Checkout] Error validating promo code:', promoErr);
        // Silently skip discount on validation error — user pays full price (safe default)
      }
    }

    // =====================================================================
    // Pricing Calculation (server-side only)
    // =====================================================================
    const adminPricing = await getAdminPricing(supabase, tier, validatedCurrency);

    let finalPriceInCents: number | null = null;

    if (adminPricing) {
      const basePrice = adminPricing.price;
      if (interval === 'quarterly') {
        // 15% off, billed for 3 months
        finalPriceInCents = Math.round(basePrice * 0.85 * 3 * 100);
      } else {
        finalPriceInCents = Math.round(basePrice * 100);
      }
    }

    // =====================================================================
    // SECURITY: Idempotent Stripe Coupon Creation
    // Uses deterministic coupon ID to prevent orphan coupon accumulation
    // Duration: 'once' (applies to first payment only)
    // =====================================================================
    let stripeCouponId: string | null = null;
    if (validatedDiscount && finalPriceInCents && finalPriceInCents > 0) {
      try {
        // Generate deterministic coupon ID from promo code + discount params
        // This ensures the same promo code always maps to the same Stripe coupon
        const couponIdBase =
          `promo_${validatedDiscount.code}_${validatedDiscount.discount_type}_${validatedDiscount.discount_value}`
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_');

        // Try to retrieve existing coupon first
        const existingCoupon = await stripeRequest(`/coupons/${couponIdBase}`, 'GET');

        if (existingCoupon && !existingCoupon.error) {
          // Coupon already exists — reuse it
          stripeCouponId = existingCoupon.id;
          console.log(`[Checkout] Reusing existing Stripe coupon: ${stripeCouponId}`);
        } else {
          // Create new coupon with deterministic ID
          const couponBody: Record<string, unknown> = {
            id: couponIdBase,
            duration: 'once', // SECURITY: Only apply to first payment, not forever
            name: `PROMO-${validatedDiscount.code}`,
          };

          if (validatedDiscount.discount_type === 'percentage') {
            couponBody.percent_off = String(validatedDiscount.discount_value);
          } else {
            // fixed discount — amount_off is in cents
            couponBody.amount_off = String(Math.round(validatedDiscount.discount_value * 100));
            couponBody.currency = validatedCurrency;
          }

          const couponResult = await stripeRequest('/coupons', 'POST', couponBody);

          if (couponResult.error) {
            console.error('[Checkout] Failed to create Stripe coupon:', couponResult.error);
            // Continue without discount — safe fallback
          } else {
            stripeCouponId = couponResult.id;
            console.log(`[Checkout] Created Stripe coupon: ${stripeCouponId}`);
          }
        }
      } catch (couponErr) {
        console.error('[Checkout] Error creating coupon:', couponErr);
        // Continue without discount — safe fallback
      }
    }

    // =====================================================================
    // Build Line Items
    // =====================================================================
    let lineItems: Record<string, unknown>[];

    if (finalPriceInCents && finalPriceInCents > 0) {
      const productId = PRODUCT_IDS[tier];
      const intervalCount = interval === 'quarterly' ? 3 : 1;

      lineItems = [
        {
          price_data: {
            currency: validatedCurrency,
            product: productId,
            unit_amount: finalPriceInCents,
            recurring: {
              interval: 'month',
              interval_count: intervalCount,
            },
          },
          quantity: 1,
        },
      ];
    } else {
      // Fallback to fixed price IDs
      const priceId = PRICE_IDS[tier]?.[interval];
      if (!priceId) {
        return errorResponse('Price not configured. Please contact support.', 500, corsHeaders);
      }
      lineItems = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    }

    // =====================================================================
    // Build Checkout Session
    // SECURITY: success_url and cancel_url use hardcoded FRONTEND_URL
    // =====================================================================
    const checkoutBody: Record<string, unknown> = {
      customer: customerId,
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing`,
    };

    // Apply discount: use server-validated coupon OR allow manual promo codes
    // Stripe doesn't allow both discounts[] and allow_promotion_codes simultaneously
    if (stripeCouponId) {
      checkoutBody['discounts[0][coupon]'] = stripeCouponId;
    } else {
      checkoutBody['allow_promotion_codes'] = 'true';
    }

    // Add line_items manually using Stripe's array format
    lineItems.forEach((item, index) => {
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'object' && value !== null) {
          for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
            if (typeof subValue === 'object' && subValue !== null) {
              for (const [deepKey, deepValue] of Object.entries(
                subValue as Record<string, unknown>
              )) {
                checkoutBody[`line_items[${index}][${key}][${subKey}][${deepKey}]`] = deepValue;
              }
            } else {
              checkoutBody[`line_items[${index}][${key}][${subKey}]`] = subValue;
            }
          }
        } else {
          checkoutBody[`line_items[${index}][${key}]`] = value;
        }
      }
    });

    // Add payment method types
    checkoutBody['payment_method_types[0]'] = 'card';

    // Add metadata (including promo code for audit trail)
    checkoutBody['metadata[supabase_user_id]'] = userData.id;
    checkoutBody['metadata[supabase_auth_id]'] = user.id;
    checkoutBody['metadata[tier]'] = tier;
    checkoutBody['metadata[interval]'] = interval;
    if (marketingAttribution) {
      checkoutBody['metadata[marketing_campaign_id]'] = marketingAttribution.campaignId;
      checkoutBody['metadata[marketing_delivery_id]'] = marketingAttribution.deliveryId;
    }
    if (validatedDiscount) {
      checkoutBody['metadata[promo_code]'] = validatedDiscount.code;
      checkoutBody['metadata[promo_discount_type]'] = validatedDiscount.discount_type;
      checkoutBody['metadata[promo_discount_value]'] = String(validatedDiscount.discount_value);
    }
    checkoutBody['subscription_data[metadata][supabase_user_id]'] = userData.id;
    checkoutBody['subscription_data[metadata][supabase_auth_id]'] = user.id;
    checkoutBody['subscription_data[metadata][tier]'] = tier;
    checkoutBody['subscription_data[metadata][interval]'] = interval;
    if (marketingAttribution) {
      checkoutBody['subscription_data[metadata][marketing_campaign_id]'] =
        marketingAttribution.campaignId;
      checkoutBody['subscription_data[metadata][marketing_delivery_id]'] =
        marketingAttribution.deliveryId;
    }

    // =====================================================================
    // Create Checkout Session
    // =====================================================================
    const sessionData = await stripeRequest('/checkout/sessions', 'POST', checkoutBody);

    if (sessionData.error) {
      console.error('[Checkout] Failed to create checkout session:', sessionData.error);
      // SECURITY: Do NOT expose Stripe error details to client
      return errorResponse(
        'Failed to create checkout session. Please try again.',
        500,
        corsHeaders
      );
    }

    const amountInMinorUnits = Number(sessionData.amount_total ?? finalPriceInCents);
    if (!sessionData.url || !sessionData.id || !Number.isFinite(amountInMinorUnits)) {
      console.error('[Checkout] Stripe returned an incomplete checkout session');
      return errorResponse('Failed to initialize payment. Please try again.', 500, corsHeaders);
    }

    return successResponse(
      {
        url: sessionData.url,
        session_id: sessionData.id,
        amount: amountInMinorUnits / 100,
        currency: String(sessionData.currency || validatedCurrency).toUpperCase(),
      },
      corsHeaders
    );
  } catch (error) {
    console.error('[Checkout] Unexpected error:', error);
    // SECURITY: Generic error message — never leak stack traces or internal details
    return errorResponse('An unexpected error occurred. Please try again.', 500, corsHeaders);
  }
});
