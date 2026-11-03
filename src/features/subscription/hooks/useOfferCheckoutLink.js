import { useEffect, useRef, useState } from 'react';
import { getPendingPromoCode } from '@/lib/promoOffer';

/** Email links select the plan, then reuse the normal verified payment flow. */
export function useOfferCheckoutLink({
  user,
  plans,
  isPricingLoading,
  promoDiscount,
  billingInterval,
  onCheckout,
}) {
  const [request] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    const interval = params.get('interval');
    const code = params.get('promo') || getPendingPromoCode();
    if (
      params.get('checkout') !== '1' ||
      !['pro', 'premium'].includes(plan) ||
      !['monthly', 'quarterly'].includes(interval) ||
      !code
    )
      return null;
    return { plan, interval, code: code.trim().toUpperCase() };
  });
  const attempted = useRef(false);
  useEffect(() => {
    if (
      !request ||
      attempted.current ||
      isPricingLoading ||
      !user?.id ||
      user.subscription_tier !== 'free' ||
      user.stripe_subscription_id ||
      billingInterval !== request.interval ||
      promoDiscount?.code !== request.code ||
      !plans?.some((plan) => plan.tier === request.plan && plan.basePrice > 0)
    )
      return;
    attempted.current = true;
    // Back/reload or a failed request must not silently start a second checkout.
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
    void onCheckout(request.plan, request);
  }, [request, user, plans, isPricingLoading, promoDiscount, billingInterval, onCheckout]);
}
