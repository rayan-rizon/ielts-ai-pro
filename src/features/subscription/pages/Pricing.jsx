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
import { OUTAGE_COPY, isServiceOutageError, trackServiceError } from '@/lib/serviceOutage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

function validateCheckoutResponse(data) {
  if (!data) return false;
  if (!data.url) return false;
  if (!data.session_id) return false;
  return Number.isFinite(Number(data.amount));
}

function getAttributionPayload(attribution) {
  if (!attribution) return { campaignId: null, deliveryId: null };
  return {
    campaignId: attribution.campaign_id || null,
    deliveryId: attribution.delivery_id || null,
  };
}

const createStripeCheckout = async ({
  sessionToken,
  planTier,
  interval,
  currency,
  attribution,
}) => {
  const { campaignId, deliveryId } = getAttributionPayload(attribution);

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
      marketing_campaign_id: campaignId,
      marketing_delivery_id: deliveryId,
    }),
  });

  // A downed gateway answers with an HTML error page, not JSON. Parsing that
  // blindly surfaces "Unexpected token '<'" to someone trying to pay us.
  let data = null;
  try {
    data = await response.json();
  } catch (parseError) {
    if (!response.ok) {
      const outage = new Error(OUTAGE_COPY.checkout);
      outage.status = response.status;
      throw outage;
    }
    throw parseError;
  }

  if (!response.ok) {
    if (response.status >= 500) {
      const outage = new Error(OUTAGE_COPY.checkout);
      outage.status = response.status;
      throw outage;
    }
    throw new Error(data?.error || 'Failed to create checkout session');
  }
  if (!validateCheckoutResponse(data)) {
    throw new Error('No checkout URL returned');
  }
  return data;
};

const getCountryIdentifier = (detectedCountry) => {
  const raw =
    detectedCountry ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('user_country') : '') ||
    '';
  return raw.trim().toUpperCase();
};

function isBangladeshUser(detectedCountry) {
  const id = getCountryIdentifier(detectedCountry);
  if (id === 'TEST') return false;
  return id === 'BD' || id === 'BANGLADESH';
}

function resolveInitialPlanFromUrl(user) {
  if (typeof window === 'undefined') return 'free';
  const planParam = new URLSearchParams(window.location.search).get('plan');
  if (planParam && ['free', 'pro', 'premium'].includes(planParam.toLowerCase())) {
    return planParam.toLowerCase();
  }
  return user?.subscription_tier || 'free';
}

function captureUrlPromoCode() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const urlCode = params.get('promo');
  if (!urlCode) return;

  capturePromoCode(urlCode);
  params.delete('promo');
  const nextSearch = params.toString();
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
  );
}

async function redeemPromoOfferRpc(code) {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.rpc('redeem_promo_code', { code_lookup: code });
  if (error) throw error;
  if (data?.success === false) {
    throw new Error(data.error || 'This offer is no longer available');
  }
  return data;
}

function recordCheckoutMarketingEvent({
  attribution,
  userId,
  planTier,
  billingInterval,
  paymentMethod,
  sessionId,
}) {
  if (!attribution || !userId) return;
  const payload = {
    plan_tier: planTier,
    billing_interval: billingInterval,
    payment_method: paymentMethod,
  };
  if (sessionId) {
    payload.session_id = sessionId;
  }
  MarketingDelivery.record(
    {
      id: attribution.delivery_id,
      campaign_id: attribution.campaign_id,
      user_id: userId,
      channel: 'checkout',
    },
    'checkout_started',
    payload
  ).catch(() => {});
}

function buildManualPaymentData({
  planTier,
  billingInterval,
  selectedPlanData,
  chargeAmount,
  attribution,
}) {
  return {
    tier: planTier,
    interval: billingInterval,
    planName: selectedPlanData.name,
    price: chargeAmount,
    currencySymbol: selectedPlanData.currencySymbol || '৳',
    marketingCampaignId: attribution?.campaign_id || null,
    marketingDeliveryId: attribution?.delivery_id || null,
  };
}

function trackStripeCheckoutStarted({
  checkout,
  planTier,
  billingInterval,
  attribution,
  userProfile,
  authUser,
}) {
  const campaignId = attribution?.campaign_id || null;
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
      campaign_id: campaignId,
    },
    userProfile || authUser
  );
}

function handleCheckoutFailure(error, planTier, billingInterval) {
  const kind = trackServiceError(error, 'pricing.checkout');
  trackAppEvent('checkout_failed', {
    path: '/pricing',
    plan_tier: planTier,
    billing_interval: billingInterval,
    reason: error?.message || 'checkout_failed',
    failure_kind: kind,
  });
  console.error('Checkout failed:', error);
}

function shouldOpenStripePortal(user) {
  // Existing Stripe billing takes precedence over the learner's current location.
  return Boolean(user?.stripe_customer_id && user?.stripe_subscription_id);
}

function PricingPlansGrid({
  plans,
  billingInterval,
  promoDiscount,
  selectedPlan,
  user,
  isLoading,
  isPricingLoading,
  onUpgrade,
}) {
  const isSubscribed = Boolean(user && user.subscription_tier !== 'free');

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto pt-2 sm:pt-4 mb-16 items-stretch"
    >
      {plans.map((plan) => {
        const displayPrice = calculatePrice(plan.basePrice, billingInterval, promoDiscount);
        const isActive = user
          ? (user.subscription_tier || 'free') === plan.tier
          : selectedPlan === plan.tier;

        return (
          <PricingCard
            key={plan.tier}
            plan={plan}
            displayPrice={displayPrice}
            isActive={isActive}
            isSubscribed={isSubscribed}
            isLoading={isLoading}
            isPricingLoading={isPricingLoading}
            onUpgrade={onUpgrade}
          />
        );
      })}
    </m.div>
  );
}

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [showFreePlanDialog, setShowFreePlanDialog] = useState(false);
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

  const isBD = isBangladeshUser(detectedCountry);
  const useManualBdPayment = isBD && MANUAL_BD_PAYMENT_ENABLED;

  useEffect(() => {
    setSelectedPlan(resolveInitialPlanFromUrl(user));
    if (user?.promo_discount) {
      setPromoDiscount(user.promo_discount);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    MarketingDelivery.recordSubscriptionFunnel('pricing_viewed', {
      dedupeKey: new Date().toISOString().slice(0, 10),
      metadata: { source: 'pricing_page' },
    }).catch(() => {});
  }, [user?.id]);

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
  useEffect(() => {
    captureUrlPromoCode();

    const code = getPendingPromoCode();
    if (!code || !user) return;

    if (user.promo_discount?.code) {
      clearPendingPromoCode();
      return;
    }

    let cancelled = false;
    const applyPendingOffer = async () => {
      try {
        const data = await redeemPromoOfferRpc(code);
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
      toast.error(
        isServiceOutageError(error)
          ? "We couldn't open the billing portal — this is a temporary problem on our side. Your subscription is unaffected."
          : 'Could not open the billing portal. Please try again or contact support.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startManualBdCheckout = (planTier, selectedPlanData, chargeAmount) => {
    const marketingAttribution = getMarketingAttribution();
    recordCheckoutMarketingEvent({
      attribution: marketingAttribution,
      userId: user?.id,
      planTier,
      billingInterval,
      paymentMethod: 'manual',
    });

    const currency = selectedPlanData?.currency || 'BDT';
    const campaignId = marketingAttribution?.campaign_id || null;

    trackAuthenticatedAppEvent(
      'manual_checkout_started',
      {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        value: chargeAmount,
        currency,
        campaign_id: campaignId,
      },
      user
    );
    MarketingDelivery.recordSubscriptionFunnel('checkout_started', {
      planTier,
      billingInterval,
      dedupeKey: `manual:${planTier}:${billingInterval}:${new Date().toISOString().slice(0, 10)}`,
      metadata: { payment_method: 'manual' },
    }).catch(() => {});

    setManualPaymentData(
      buildManualPaymentData({
        planTier,
        billingInterval,
        selectedPlanData,
        chargeAmount,
        attribution: marketingAttribution,
      })
    );
    setShowManualPayment(true);
  };

  const startStripeCheckoutSession = async (planTier, selectedPlanData) => {
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/login?redirect=/pricing';
        return;
      }

      const planCurrency = selectedPlanData?.currency || 'USD';
      const marketingAttribution = getMarketingAttribution();
      const checkout = await createStripeCheckout({
        sessionToken: session.access_token,
        planTier,
        interval: billingInterval,
        currency: planCurrency,
        attribution: marketingAttribution,
      });

      recordCheckoutMarketingEvent({
        attribution: marketingAttribution,
        userId: user?.id,
        planTier,
        billingInterval,
        paymentMethod: 'stripe',
        sessionId: checkout.session_id,
      });

      trackStripeCheckoutStarted({
        checkout,
        planTier,
        billingInterval,
        attribution: marketingAttribution,
        userProfile: user,
        authUser: session.user,
      });

      trackAppEvent('checkout_redirected', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        currency: planCurrency,
      });

      MarketingDelivery.recordSubscriptionFunnel('checkout_started', {
        planTier,
        billingInterval,
        dedupeKey: checkout.session_id,
        metadata: { payment_method: 'stripe' },
      }).catch(() => {});

      window.location.href = checkout.url;
    } catch (error) {
      handleCheckoutFailure(error, planTier, billingInterval);
      MarketingDelivery.recordSubscriptionFunnel('checkout_failed', {
        planTier,
        billingInterval,
        dedupeKey: `failed:${planTier}:${billingInterval}:${new Date().toISOString().slice(0, 13)}`,
        metadata: { failure_kind: 'checkout_start' },
      }).catch(() => {});
      const { toast } = await import('sonner');
      // Checkout never started, so the user has definitely not been charged —
      // say that outright so nobody retries on a second card.
      toast.error(
        isServiceOutageError(error)
          ? OUTAGE_COPY.checkout
          : error.message || 'Failed to start checkout. Please try again.',
        { duration: 8000 }
      );
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

    if (user?.id) {
      MarketingDelivery.recordSubscriptionFunnel('plan_selected', {
        planTier,
        billingInterval,
        dedupeKey: `${planTier}:${billingInterval}:${new Date().toISOString().slice(0, 10)}`,
        metadata: { source: 'pricing_page' },
      }).catch(() => {});
    }

    if (planTier === 'free') {
      if (user && user.subscription_tier !== 'free') setShowFreePlanDialog(true);
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

    if (shouldOpenStripePortal(user)) {
      // A failed portal must never fall through into a new checkout (or a
      // Bangladesh manual payment) for an already-billed subscriber.
      await handleOpenPortal();
      return;
    }

    if (useManualBdPayment) {
      startManualBdCheckout(planTier, meta.plan, meta.chargeAmount);
      return;
    }

    await startStripeCheckoutSession(planTier, meta.plan);
  };

  return (
    <>
      <Dialog open={showFreePlanDialog} onOpenChange={setShowFreePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Free</DialogTitle>
            <DialogDescription>
              {user?.stripe_customer_id && user?.stripe_subscription_id
                ? 'Cancel your recurring subscription in Plan & Billing. Paid access stays active until the end of the billing period, then changes to Free. Choosing a plan card does not cancel billing.'
                : 'Your paid access was not set up as a Stripe subscription. Choosing Free here does not remove access or refund a payment. Contact support to request a change.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {user?.stripe_customer_id && user?.stripe_subscription_id ? (
              <a
                href="/settings?tab=subscription"
                className="rounded-lg bg-[#5a63df] px-4 py-2 text-center text-sm font-bold text-white"
              >
                Go to Plan &amp; Billing
              </a>
            ) : (
              <a
                href="mailto:support@ieltsai.pro?subject=Move%20my%20plan%20to%20Free"
                className="rounded-lg bg-[#5a63df] px-4 py-2 text-center text-sm font-bold text-white"
              >
                Contact support
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentHead
        title="IELTS Preparation Pricing Plans - Free to Premium | IELTS Ai Pro"
        description="Affordable, flexible IELTS prep plans starting at $9.99/month. Get unlimited mock tests, AI feedback, adaptive learning. Try free or upgrade to Premium for complete coaching."
        canonicalUrl="https://www.ieltsai.pro/pricing"
        keywords="IELTS pricing, IELTS courses cost, affordable IELTS prep, IELTS plans"
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-16 transition-colors duration-500 dark:bg-[#08080a]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
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

          <PricingPlansGrid
            plans={plans}
            billingInterval={billingInterval}
            promoDiscount={promoDiscount}
            selectedPlan={selectedPlan}
            user={user}
            isLoading={isLoading}
            isPricingLoading={isPricingLoading}
            onUpgrade={handleUpgrade}
          />

          <SubscriptionManagementBanner
            user={user}
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
