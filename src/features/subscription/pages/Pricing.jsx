import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import DocumentHead from '@/components/shared/DocumentHead';
import { calculatePrice } from '@/lib/pricingUtils';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import ManualPayment from '../components/ManualPayment';
import { trackAppEvent } from '@/lib/tracking';

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

// Module-level helper functions to minimize component complexity
const requestCustomerPortal = async (sessionToken) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-customer-portal`, {
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

const createStripeCheckout = async (sessionToken, planTier, interval, currency) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
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
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }
  if (!data.url) {
    throw new Error('No checkout URL returned');
  }
  return data.url;
};

const getCountryIdentifier = (detectedCountry) => {
  const raw = detectedCountry || localStorage.getItem('user_country') || '';
  return raw.trim().toUpperCase();
};

const getPlanPriceAndMeta = ({ plans, planTier, billingInterval, promoDiscount, currentTier }) => {
  const plan = plans.find((p) => p.tier === planTier);
  const basePrice = plan ? plan.basePrice : 0;
  const displayPrice = calculatePrice(basePrice, billingInterval, promoDiscount);
  const currency = plan?.currency || 'USD';
  const tier = currentTier || 'free';
  return { plan, displayPrice, currency, tier };
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

  const startManualBdCheckout = (planTier, selectedPlanData, displayPrice) => {
    trackAppEvent('manual_checkout_started', {
      path: '/pricing',
      plan_tier: planTier,
      billing_interval: billingInterval,
      value: displayPrice,
      currency: selectedPlanData?.currency || 'BDT',
    });

    setManualPaymentData({
      tier: planTier,
      interval: billingInterval,
      planName: selectedPlanData.name,
      price: displayPrice,
      currencySymbol: selectedPlanData.currencySymbol || '৳',
    });
    setShowManualPayment(true);
  };

  const startStripeCheckoutSession = async (planTier, selectedPlanData, displayPrice) => {
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

      trackAppEvent('checkout_started', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        value: displayPrice,
        currency: planCurrency,
      });

      const checkoutUrl = await createStripeCheckout(
        session.access_token,
        planTier,
        billingInterval,
        planCurrency
      );

      trackAppEvent('checkout_redirected', {
        path: '/pricing',
        plan_tier: planTier,
        billing_interval: billingInterval,
        currency: planCurrency,
      });

      window.location.href = checkoutUrl;
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
      startManualBdCheckout(planTier, meta.plan, meta.displayPrice);
      return;
    }

    await startStripeCheckoutSession(planTier, meta.plan, meta.displayPrice);
  };

  return (
    <>
      <DocumentHead
        title="IELTS Preparation Pricing Plans - Free to Premium | IELTS Ai Pro"
        description="Affordable, flexible IELTS prep plans starting at $9.99/month. Get unlimited mock tests, AI feedback, adaptive learning. Try free or upgrade to Premium for complete coaching."
        canonicalUrl="https://www.ieltsai.pro/pricing"
        keywords="IELTS pricing, IELTS courses cost, affordable IELTS prep, IELTS plans"
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-16 transition-colors duration-500 dark:bg-[#0b0a10]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 -z-0 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.4),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.12),transparent_70%)]"
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

        {showManualPayment && manualPaymentData && (
          <ManualPayment
            isOpen={showManualPayment}
            onClose={() => setShowManualPayment(false)}
            planData={manualPaymentData}
            userId={user?.auth_id}
          />
        )}
      </div>
    </>
  );
}
