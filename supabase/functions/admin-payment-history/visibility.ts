const VALID_TIERS = new Set(['pro', 'premium']);
const VALID_INTERVALS = new Set(['monthly', 'quarterly']);

type CheckoutSessionLike = {
  id?: string | null;
  mode?: string | null;
  payment_status?: string | null;
  amount_total?: number | null;
  metadata?: Record<string, string | null | undefined> | null;
};

/**
 * Only paid subscriptions created by IELTS Ai Pro belong in its admin payment
 * history. This provenance contract keeps unrelated Stripe products and
 * zero-value/test promo sessions out while allowing future real payments in.
 */
export const isVisibleIeltsCheckout = (
  session: CheckoutSessionLike,
  hiddenSessionIds: ReadonlySet<string> = new Set()
) => {
  const metadata = session.metadata || {};
  const tier = String(metadata.tier || '').toLowerCase();
  const interval = String(metadata.interval || '').toLowerCase();
  const promoCode = String(metadata.promo_code || '')
    .trim()
    .toUpperCase();

  return (
    Boolean(session.id) &&
    !hiddenSessionIds.has(session.id as string) &&
    session.mode === 'subscription' &&
    session.payment_status === 'paid' &&
    Number(session.amount_total) > 0 &&
    Boolean(metadata.supabase_user_id) &&
    Boolean(metadata.supabase_auth_id) &&
    VALID_TIERS.has(tier) &&
    VALID_INTERVALS.has(interval) &&
    !promoCode.startsWith('TEST')
  );
};

export const stripeObjectId = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
};
