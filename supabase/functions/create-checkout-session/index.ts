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
import {
  computePlanCharge,
  fromStripeAmount,
  resolvePriceBook,
  toStripeAmount,
  UNCHARGEABLE_CURRENCIES,
  type PriceBook,
} from '../_shared/planPricing.ts';

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
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// SECURITY: Hardcoded frontend URL prevents open redirect attacks
// The Origin header is user-controlled and MUST NOT be used for redirect URLs
//
// The fallback must stay on `www`. The apex `ieltsai.pro` has DNS records but
// nothing answering on it, so a missing FRONTEND_URL sent a learner who had
// just paid to a host that times out.
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://www.ieltsai.pro';

// Valid tiers and intervals (prevent injection)
const VALID_TIERS = new Set(['pro', 'premium']);
const VALID_INTERVALS = new Set(['monthly', 'quarterly']);

// `quarterly` is the 3-Month Exam Pass: one charge for three months, no
// auto-renewal (Stripe payment mode). Its price, like every price, comes from
// _shared/planPricing.ts, which the pricing page uses too.

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

/**
 * The admin price book for the country the pricing page priced the learner in.
 *
 * The page sends the country it used; the currency always comes from the
 * admin's row for that country, never from the request, so a learner cannot
 * pick a cheaper currency. Older cached pages sent only a currency: those map
 * to the single regional row using it, else the global price.
 */
async function loadPriceBook(
  supabase: ReturnType<typeof createClient>,
  tier: string,
  country: string | null,
  legacyCurrency: string | null
): Promise<PriceBook | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'pricing_tiers')
      .single();
    if (error || !data?.value) return null;

    const pricingTiers = data.value as Record<string, any>;
    let pricedCountry = country;
    if (!pricedCountry && legacyCurrency) {
      const rows = (pricingTiers[tier]?.regional || []).filter(
        (row: any) => String(row?.currency || '').toLowerCase() === legacyCurrency
      );
      if (rows.length === 1) pricedCountry = rows[0].country;
    }
    return resolvePriceBook(pricingTiers, tier, pricedCountry);
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
    const {
      tier,
      interval,
      currency,
      country,
      expected_amount,
      marketing_campaign_id,
      marketing_delivery_id,
      ga_client_id,
      ga_session_id,
    } = await req.json();
    // NOTE: priceAmount is intentionally NOT destructured — it is IGNORED

    // GA4 session handle, carried through Stripe so the webhook can report the
    // purchase against the session that produced it. Client-supplied and
    // therefore validated to an exact shape before it is stored: GA4 client ids
    // are `<int>.<int>` and session ids are unix seconds. Anything else is
    // dropped, which only costs attribution — never the sale.
    const gaClientId =
      typeof ga_client_id === 'string' && /^\d{1,20}\.\d{1,20}$/.test(ga_client_id.trim())
        ? ga_client_id.trim()
        : null;
    const gaSessionId =
      typeof ga_session_id === 'string' && /^\d{1,20}$/.test(ga_session_id.trim())
        ? ga_session_id.trim()
        : null;

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

    // Only shape-checked here; the price book decides what they mean.
    const requestedCountry =
      typeof country === 'string' && /^[A-Za-z]{2}$/.test(country.trim())
        ? country.trim().toUpperCase()
        : null;
    const legacyCurrency =
      typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim())
        ? currency.trim().toLowerCase()
        : null;
    const expectedAmount = Number(expected_amount);

    // =====================================================================
    // User Data & Subscription Check
    // =====================================================================
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'id, email, full_name, role, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_end_date, promo_discount'
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

    // Paid access that is not a Stripe subscription — an Exam Pass or a bKash
    // payment — cannot be managed in the portal. A second purchase would
    // restart the clock from today and throw away the days already paid for.
    const hasPaidTier = ['pro', 'premium'].includes(userData.subscription_tier);
    const accessEndsAt = userData.subscription_end_date
      ? new Date(userData.subscription_end_date)
      : null;
    if (
      !existingSubId &&
      userData.role !== 'admin' &&
      hasPaidTier &&
      (!accessEndsAt || accessEndsAt > new Date())
    ) {
      const until = accessEndsAt
        ? ` until ${accessEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : '';
      return errorResponse(
        `You already have ${userData.subscription_tier} access${until}. You can buy a new plan once it ends.`,
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
            'id, code, discount_type, discount_value, is_active, valid_until, offer_expires_at, assigned_user_id'
          )
          .ilike('code', userPromoDiscount.code)
          .eq('is_active', true)
          .single();

        if (promoData) {
          const isNotExpired =
            (!promoData.valid_until || new Date(promoData.valid_until) > new Date()) &&
            (!promoData.offer_expires_at || new Date(promoData.offer_expires_at) > new Date());
          const isAssignedToUser =
            !promoData.assigned_user_id || promoData.assigned_user_id === userData.id;

          // Capacity was claimed atomically by redeem_promo_code. Rechecking
          // current_uses here would reject the learner who claimed the final slot.
          if (isNotExpired && isAssignedToUser) {
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
              `[Checkout] Promo code ${userPromoDiscount.code} is expired or assigned to another user, skipping discount`
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
    const priceBook = await loadPriceBook(supabase, tier, requestedCountry, legacyCurrency);
    const validatedCurrency = (priceBook?.currency || 'USD').toLowerCase();

    if (priceBook && UNCHARGEABLE_CURRENCIES.has(priceBook.currency)) {
      console.error(`[Checkout] Regional price uses unchargeable currency ${priceBook.currency}`);
      return errorResponse(
        'Card payment is not available for this region yet. Please contact support.',
        400,
        corsHeaders,
        { code: 'currency_unavailable' }
      );
    }

    const charge = priceBook
      ? computePlanCharge(priceBook.price, interval, priceBook.currency, validatedDiscount)
      : null;

    // The page shows a price; Stripe must charge exactly that price. If the
    // admin changed pricing after the page loaded (it caches for 30 minutes),
    // stop and have the learner refresh rather than charge a surprise amount.
    if (charge && Number.isFinite(expectedAmount) && expected_amount != null) {
      const shownMinor = toStripeAmount(expectedAmount, priceBook!.currency);
      if (shownMinor !== toStripeAmount(charge.amount, priceBook!.currency)) {
        console.warn(
          `[Checkout] Price changed for ${user.id}: shown ${expectedAmount}, now ${charge.amount} ${priceBook!.currency}`
        );
        // The page applied an offer the server no longer honours (expired or
        // reassigned). Say so, so the page can drop it instead of looping.
        if (userPromoDiscount?.code && !validatedDiscount) {
          return errorResponse(
            'Your offer is no longer valid. The page now shows the full price.',
            409,
            corsHeaders,
            { code: 'offer_unavailable' }
          );
        }
        return errorResponse(
          'Prices were just updated. Please refresh the page to see the current price.',
          409,
          corsHeaders,
          { code: 'price_changed' }
        );
      }
    }

    // The line item carries the price before any promo; a promo is a
    // one-time coupon for exactly the difference, so the first charge equals
    // `charge.amount` to the minor unit and renewals return to the list price.
    const finalPriceInCents: number | null = charge
      ? toStripeAmount(charge.listAmount, priceBook!.currency)
      : null;
    const promoAmountOff =
      charge && validatedDiscount
        ? finalPriceInCents! - toStripeAmount(charge.amount, priceBook!.currency)
        : 0;

    // =====================================================================
    // SECURITY: Idempotent Stripe Coupon Creation
    // Uses deterministic coupon ID to prevent orphan coupon accumulation
    // Duration: 'once' (applies to first payment only)
    // =====================================================================
    let stripeCouponId: string | null = null;
    if (validatedDiscount && finalPriceInCents && promoAmountOff > 0) {
      try {
        // Deterministic: the same code, currency and amount always map to the
        // same Stripe coupon, so retries never accumulate orphans.
        const couponIdBase =
          `promo_${validatedDiscount.code}_${validatedCurrency}_${promoAmountOff}`
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_');

        const existingCoupon = await stripeRequest(`/coupons/${couponIdBase}`, 'GET');

        if (existingCoupon && !existingCoupon.error) {
          stripeCouponId = existingCoupon.id;
          console.log(`[Checkout] Reusing existing Stripe coupon: ${stripeCouponId}`);
        } else {
          // A fixed amount off, never a percentage coupon. Stripe rounds percentages itself,
          // which would charge ৳489.30 where the card said ৳489.
          const couponResult = await stripeRequest('/coupons', 'POST', {
            id: couponIdBase,
            duration: 'once', // SECURITY: Only apply to first payment, not forever
            name: `PROMO-${validatedDiscount.code}`,
            amount_off: String(promoAmountOff),
            currency: validatedCurrency,
          });

          if (couponResult.error) {
            console.error('[Checkout] Failed to create Stripe coupon:', couponResult.error);
            // Charging without the promo would not match the page.
            return errorResponse(
              'We could not apply your offer. Please try again.',
              502,
              corsHeaders
            );
          }
          stripeCouponId = couponResult.id;
          console.log(`[Checkout] Created Stripe coupon: ${stripeCouponId}`);
        }
      } catch (couponErr) {
        console.error('[Checkout] Error creating coupon:', couponErr);
        return errorResponse('We could not apply your offer. Please try again.', 502, corsHeaders);
      }
    }

    // =====================================================================
    // Build Line Items
    // =====================================================================
    const isExamPass = interval === 'quarterly';
    let lineItems: Record<string, unknown>[];

    if (finalPriceInCents && finalPriceInCents > 0) {
      const productId = PRODUCT_IDS[tier];
      const priceData: Record<string, unknown> = {
        currency: validatedCurrency,
        product: productId,
        unit_amount: finalPriceInCents,
      };
      if (!isExamPass) {
        priceData.recurring = { interval: 'month', interval_count: 1 };
      }

      lineItems = [{ price_data: priceData, quantity: 1 }];
    } else {
      // Fallback to fixed price IDs. Those are recurring prices, which Stripe
      // refuses in payment mode, so the one-time pass needs admin pricing.
      const priceId = isExamPass ? '' : PRICE_IDS[tier]?.[interval];
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
      mode: isExamPass ? 'payment' : 'subscription',
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
    // Only on the session, not on subscription_data: these identify one
    // browsing session, so copying them onto the subscription would re-attribute
    // every future renewal to the session that happened to start it.
    if (gaClientId) checkoutBody['metadata[ga_client_id]'] = gaClientId;
    if (gaSessionId) checkoutBody['metadata[ga_session_id]'] = gaSessionId;
    // Payment mode has no subscription to carry metadata, and Stripe rejects
    // subscription_data there; the payment intent carries it for refunds.
    const durableMetadataKey = isExamPass ? 'payment_intent_data' : 'subscription_data';
    checkoutBody[`${durableMetadataKey}[metadata][supabase_user_id]`] = userData.id;
    checkoutBody[`${durableMetadataKey}[metadata][supabase_auth_id]`] = user.id;
    checkoutBody[`${durableMetadataKey}[metadata][tier]`] = tier;
    checkoutBody[`${durableMetadataKey}[metadata][interval]`] = interval;
    if (marketingAttribution) {
      checkoutBody[`${durableMetadataKey}[metadata][marketing_campaign_id]`] =
        marketingAttribution.campaignId;
      checkoutBody[`${durableMetadataKey}[metadata][marketing_delivery_id]`] =
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
    const chargedCurrency = String(sessionData.currency || validatedCurrency).toUpperCase();
    const chargedAmount = fromStripeAmount(amountInMinorUnits, chargedCurrency);
    if (!sessionData.url || !sessionData.id || !Number.isFinite(amountInMinorUnits)) {
      console.error('[Checkout] Stripe returned an incomplete checkout session');
      return errorResponse('Failed to initialize payment. Please try again.', 500, corsHeaders);
    }

    const { error: intentError } = await serviceClient.from('marketing_checkout_intents').upsert(
      {
        user_id: userData.id,
        provider: 'stripe',
        external_session_id: sessionData.id,
        plan_tier: tier,
        billing_interval: interval,
        status: 'initiated',
        metadata: {
          currency: chargedCurrency,
          amount: chargedAmount,
          priced_country: priceBook?.country || null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'external_session_id' }
    );
    if (intentError) {
      console.warn('[Checkout] Could not persist recovery intent:', intentError.message);
    }

    return successResponse(
      {
        url: sessionData.url,
        session_id: sessionData.id,
        amount: chargedAmount,
        currency: chargedCurrency,
      },
      corsHeaders
    );
  } catch (error) {
    console.error('[Checkout] Unexpected error:', error);
    // SECURITY: Generic error message — never leak stack traces or internal details
    return errorResponse('An unexpected error occurred. Please try again.', 500, corsHeaders);
  }
});
