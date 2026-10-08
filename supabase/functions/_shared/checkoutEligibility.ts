/**
 * Checks every checkout makes before quoting a price: does the learner already
 * have paid access, and does their applied offer still hold.
 *
 * Mirrors the rules in create-checkout-session so a learner sees the same
 * answer whichever way they pay.
 */

export interface CheckoutUser {
  id: string;
  role: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: string | null;
  subscription_end_date: string | null;
  promo_discount: { code?: string; discount_type?: string; discount_value?: number } | null;
}

export interface ValidatedDiscount {
  code: string;
  discount_type: string;
  discount_value: number;
}

/** A learner-facing refusal, or null when they may buy. */
export function existingAccessError(user: CheckoutUser, now: Date = new Date()): string | null {
  const hasPaidTier = ['pro', 'premium'].includes(user.subscription_tier || '');
  if (user.stripe_subscription_id && user.subscription_tier !== 'free') {
    return 'You already have an active subscription. Please manage it from your account settings.';
  }
  if (user.role === 'admin' || !hasPaidTier) return null;

  const endsAt = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
  if (endsAt && endsAt <= now) return null;
  const until = endsAt
    ? ` until ${endsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '';
  return `You already have ${user.subscription_tier} access${until}. You can buy a new plan once it ends.`;
}

/**
 * The learner's applied promo, if it is still valid for this tier. Capacity was
 * claimed when the code was redeemed, so current_uses is not rechecked here.
 */
export async function validateAppliedPromo(
  serviceClient: any,
  user: CheckoutUser,
  tier: string,
  now: Date = new Date()
): Promise<ValidatedDiscount | null> {
  const applied = user.promo_discount;
  if (!applied?.code || !applied.discount_type || !applied.discount_value) return null;

  const { data: promo } = await serviceClient
    .from('promo_codes')
    .select(
      'code, discount_type, discount_value, valid_from, valid_until, offer_expires_at, assigned_user_id, applicable_plans, is_signup_offer_template'
    )
    .ilike('code', applied.code)
    .eq('is_active', true)
    .maybeSingle();
  if (!promo) return null;

  const today = now.toISOString().slice(0, 10);
  const inWindow =
    (!promo.valid_from || promo.valid_from <= today) &&
    (!promo.valid_until || promo.valid_until >= today) &&
    (!promo.offer_expires_at || new Date(promo.offer_expires_at) > now);
  const mine = !promo.assigned_user_id || promo.assigned_user_id === user.id;
  const applies = !promo.applicable_plans?.length || promo.applicable_plans.includes(tier);
  if (!inWindow || !mine || !applies || promo.is_signup_offer_template) return null;

  return {
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value),
  };
}
