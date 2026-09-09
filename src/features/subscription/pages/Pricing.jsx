import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import DocumentHead from '@/components/shared/DocumentHead';
import { getPlanPriceAndMeta, calculatePrice } from '@/lib/pricingUtils';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import ManualPayment from '../components/ManualPayment';
import { trackAppEvent, trackAuthenticatedAppEvent } from '@/lib/tracking';
import { getMarketingAttribution } from '@/lib/marketingAttribution';
import { capturePromoCode, clearPendingPromoCode, getPendingPromoCode } from '@/lib/promoOffer';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';
import { requirePublicEnv } from '@/lib/publicEnv';

// Extracted Components
import PricingCard from '../components/PricingCard';
import FAQSection from '../components/FAQSection';
import PricingHeaderSection from '../components/PricingHeaderSection';
import SubscriptionManagementBanner from '../components/SubscriptionManagementBanner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Temporary kill switch for Bangladesh manual payment flow.
const MANUAL_BD_PAYMENT_ENABLED = true;
const SUPABASE_URL = requirePublicEnv('VITE_SUPABASE_URL');

// Module-level helper functions to minimize component complexity
const requestCustomerPortal = async (sessionToken) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-customer-portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.error === 'no_stripe_subscription') return { noSubscription: true };
    throw new Error(data.error || 'Failed to open billing portal');
  }
  return data;
};

const createStripeCheckout = async (sessionToken, planTier, interval, currency, attribution) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      tier: planTier,
      interval,
      currency: currency.toLowerCase(),
      marketing_campaign_id: attribution?.campaign_id || null,
      marketing_delivery_id: attribution?.delivery_id || null,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }
  if (!data.url || !data.session_id || !Number.isFinite(Number(data.amount))) {
    throw new Error('No checkout URL returned');
  }
  return data;
};

const getCountryIdentifier = (detectedCountry) => {
  const raw = detectedCountry || localStorage.getItem('user_country') || '';
  return raw.trim().toUpperCase();
};

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState(null);

  const {
    user,
    plans,
    detectedCountry,
    isLoading: isPricingLoading,
    refetchUser,
  } = usePricing(DEFAULT_PRICING_PLANS, {
    disableBangladeshLocalization: !MANUAL_BD_PAYMENT_ENABLED,
  });

  const [isLoading, setIsLoading] = useState(false);

  const countryIdentifier = getCountryIdentifier(detectedCountry);
  const isBD =
    (countryIdentifier === 'BD' || countryIdentifier === 'BANGLADESH') &&
    countryIdentifier !== 'TEST';
  const useManualBdPayment = isBD && MANUAL_BD_PAYMENT_ENABLED;

  useEffect(() => {
    if (user) {
      setSelectedPlan(user.subscription_tier || 'free');
      setPromoDiscount(user.promo_discount || null);
    }
  }, [user]);

  const handlePromoApplied = async (redemptionData) => {
    if (redemptionData) {
      if (redemptionData.type === 'grant') {
        setSelectedPlan(redemptionData.subscription);
      } else if (redemptionData.type === 'discount') {
        setPromoDiscount({
          code: redemptionData.code,
          discount_type: redemptionData.discount_type,
          discount_value: redemptionData.discount_value,
        });
      }
    }
    await refetchUser();
  };

  // Apply an offer code that arrived on a link — a recovery email for a
  // signed-in learner, or an ad that promised a discount to an anonymous
  // visitor.
  //
  // The code is read from the pending store rather than the URL. index.html
  // captures `?promo=` on first paint and keeps it there until it is redeemed,
  // which is what makes the ad case work: that visitor lands logged out, signs
  // up, and only reaches this page afterwards. Reading the URL here instead
  // meant the code was stripped on the anonymous landing and then dropped by
  // the `!user` guard, so ad traffic was promised a discount and then shown
  // full price — a silent conversion leak, not a visible error.
  useEffect(() => {
    // Late-arriving `?promo=` (client-side navigation) still gets captured.
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('promo');
    if (urlCode) {
      capturePromoCode(urlCode);
      params.delete('promo');
      const nextSearch = params.toString();
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
      );
    }

    const code = getPendingPromoCode();
    if (!code) return;

    // Not signed in yet is the normal state for an ad visitor mid-signup, so
    // hold the code rather than discarding it.
    if (!user) return;

    // Already discounted — the offer has served its purpose.
    if (user.promo_discount?.code) {
      clearPendingPromoCode();
      return;
    }

    let cancelled = false;
    const applyPendingOffer = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase.rpc('redeem_promo_code', { code_lookup: code });
        if (error) throw error;
        if (data?.success === false)
          throw new Error(data.error || 'This offer is no longer available');
        if (cancelled) return;

        clearPendingPromoCode();
        setPromoDiscount({
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
        });
        await refetchUser();
        const { toast } = await import('sonner');
        toast.success(data.message || 'Your offer has been applied.');
      } catch (error) {
        if (cancelled) return;
        // The server rejected it (expired, already used, unknown). Retrying on
        // every visit would re-show the same error forever.
        clearPendingPromoCode();
        console.warn('[Promo link] Offer could not be applied:', error);
        const { toast } = await import('sonner');
        toast.error(error.message || 'This offer is no longer available.');
      }
    };
    applyPendingOffer();
    return () => {
      cancelled = true;
    };
  }, [refetchUser, user]);

  const handleOpenPortal = async () => {
    if (!user?.stripe_subscription_id) {
      return false;
    }

    trackAppEvent('billing_portal_opened', {
      path: '/pricing',
      current_tier: user?.subscription_tier || 'free',
    });

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());
      if (!session) return false;

      const portalData = await requestCustomerPortal(session.access_token);
      if (portalData.noSubscription) return false;

      if (portalData.url) window.location.href = portalData.url;
      return true;
    } catch (error) {
      console.error('Portal failed:', error);
      const { toast } = await import('sonner');
      toast.error('Could not open the billing portal. Please try again or contact support.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startManualBdCheckout = (planTier, selectedPlanData, chargeAmount) => {
    const marketingAttribution = getMarketingAttribution();
    if (marketingAttribution && user?.id) {
      MarketingDelivery.record(
        {
          id: marketingAttribution.delivery_id,
          campaign_id: marketingAttribution.campaign_id,
          user_id: user.id,
          channel: 'checkout',
        },
        'checkout_started',
        { plan_tier: planTier, billing_interval: billingInterval, payment_method: 'manual' }
      ).catch(() => {});
    }
    trackAuthenticatedAppEvent(
      'manual_checkout_started',
      {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        value: chargeAmount,
        currency: selectedPlanData?.currency || 'BDT',
        campaign_id: marketingAttribution?.campaign_id || null,
      },
      user
    );

    setManualPaymentData({
      tier: planTier,
      interval: billingInterval,
      planName: selectedPlanData.name,
      price: chargeAmount,
      currencySymbol: selectedPlanData.currencySymbol || '৳',
      marketingCampaignId: marketingAttribution?.campaign_id || null,
      marketingDeliveryId: marketingAttribution?.delivery_id || null,
    });
    setShowManualPayment(true);
  };

  const startStripeCheckoutSession = async (planTier, selectedPlanData) => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());

      if (!session) {
        window.location.href = '/login?redirect=/pricing';
        return;
      }

      const planCurrency = selectedPlanData?.currency || 'USD';

      const marketingAttribution = getMarketingAttribution();
      const checkout = await createStripeCheckout(
        session.access_token,
        planTier,
        billingInterval,
        planCurrency,
        marketingAttribution
      );

      if (marketingAttribution && user?.id) {
        MarketingDelivery.record(
          {
            id: marketingAttribution.delivery_id,
            campaign_id: marketingAttribution.campaign_id,
            user_id: user.id,
            channel: 'checkout',
          },
          'checkout_started',
          {
            plan_tier: planTier,
            billing_interval: billingInterval,
            session_id: checkout.session_id,
          }
        ).catch(() => {});
      }

      // Stripe returns the authoritative first charge after applying its
      // server-validated price and promo rules. Reporting this rather than the
      // display rate keeps Meta value optimisation and revenue in agreement.
      trackAuthenticatedAppEvent(
        'checkout_started',
        {
          path: '/pricing',
          plan_tier: planTier,
          billing_interval: billingInterval,
          value: checkout.amount,
          currency: checkout.currency,
          transaction_id: checkout.session_id,
          event_id: checkout.session_id,
          campaign_id: marketingAttribution?.campaign_id || null,
        },
        // `user` is the public profile record and supplies the stable external
        // ID used elsewhere in conversion tracking. Keep the auth session as a
        // resilience fallback only while the profile is still loading.
        user || session.user
      );

      trackAppEvent('checkout_redirected', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        currency: planCurrency,
      });

      window.location.href = checkout.url;
    } catch (error) {
      trackAppEvent('checkout_failed', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        reason: error?.message || 'checkout_failed',
      });

      console.error('Checkout failed:', error);
      const { toast } = await import('sonner');
      toast.error(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planTier) => {
    const meta = getPlanPriceAndMeta({
      plans,
      planTier,
      billingInterval,
      promoDiscount,
      currentTier: user?.subscription_tier,
    });

    trackAppEvent('plan_selected', {
      path: '/pricing',
      plan_tier: planTier,
      billing_interval: billingInterval,
      value: meta.displayPrice,
      currency: meta.currency,
      current_tier: meta.tier,
    });

    if (planTier === 'free') {
      setSelectedPlan('free');
      return;
    }

    if (!user) {
      trackAppEvent('checkout_login_redirect', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
      });
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    if (user.stripe_subscription_id && !useManualBdPayment) {
      const portaled = await handleOpenPortal();
      if (portaled !== false) return;
    }

    if (useManualBdPayment) {
      startManualBdCheckout(planTier, meta.plan, meta.chargeAmount);
      return;
    }

    await startStripeCheckoutSession(planTier, meta.plan);
  };

  return (
    <>
      <DocumentHead
        title="IELTS Preparation Pricing Plans - Free to Premium | IELTS Ai Pro"
        description="Affordable, flexible IELTS prep plans starting at $9.99/month. Get unlimited mock tests, AI feedback, adaptive learning. Try free or upgrade to Premium for complete coaching."
        canonicalUrl="https://www.ieltsai.pro/pricing"
        keywords="IELTS pricing, IELTS courses cost, affordable IELTS prep, IELTS plans"
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-16 transition-colors duration-500 dark:bg-[#08080a]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
        />

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:pt-8 md:px-8 md:pt-10"
        >
          <PricingHeaderSection
            billingInterval={billingInterval}
            setBillingInterval={setBillingInterval}
            promoDiscount={promoDiscount}
            onPromoApplied={handlePromoApplied}
          />

          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto pt-2 sm:pt-4 mb-16 items-stretch"
          >
            {plans.map((plan) => {
              const displayPrice = calculatePrice(plan.basePrice, billingInterval, promoDiscount);
              const isActive = selectedPlan === plan.tier;
              const isSubscribed = user?.subscription_tier !== 'free';

              return (
                <PricingCard
                  key={plan.tier}
                  plan={plan}
                  displayPrice={displayPrice}
                  isActive={isActive}
                  isSubscribed={isSubscribed}
                  isLoading={isLoading}
                  isPricingLoading={isPricingLoading}
                  onUpgrade={handleUpgrade}
                />
              );
            })}
          </m.div>

          <SubscriptionManagementBanner
            user={user}
            useManualBdPayment={useManualBdPayment}
            isLoading={isLoading}
            handleOpenPortal={handleOpenPortal}
          />

          <FAQSection />
        </m.div>

        <AnimatePresence>
          {showManualPayment && manualPaymentData && (
            <ManualPayment
              isOpen={showManualPayment}
              onClose={() => setShowManualPayment(false)}
              planData={manualPaymentData}
              userId={user?.auth_id}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
