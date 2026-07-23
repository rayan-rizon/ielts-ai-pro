import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import DocumentHead from '@/components/shared/DocumentHead';
import { calculatePrice } from '@/lib/pricingUtils';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';
import ManualPayment from '../components/ManualPayment';
import { trackAppEvent } from '@/lib/tracking';

// Extracted Components
import PricingCard from '../components/PricingCard';
import FAQSection from '../components/FAQSection';

const defaultPlans = [
  {
    name: 'Free',
    basePrice: 0,
    description: 'Perfect for getting started with Reading & Listening.',
    features: [
      'Unlimited Reading Tests',
      'Unlimited Listening Tests',
      'All Cambridge Reading & Listening',
      '0 AI Speaking Sessions/month',
      '1 AI Writing Evaluations/month',
      '100 Vocabulary Words',
      'Basic Analytics',
    ],
    limitations: ['Adaptive Learning Path', 'Premium AI Features'],
    buttonText: 'Current Plan',
    tier: 'free',
    color: 'slate',
  },
  {
    name: 'Pro',
    basePrice: 9.99,
    description: 'The preferred choice for serious IELTS candidates.',
    features: [
      'Everything in Free',
      '100 AI Writing Evaluations/month',
      '50 AI Speaking Sessions/month',
      '300 Vocabulary Words',
      'Advanced Performance Analytics',
      'AI Study Recommendations',
      'All Cambridge Tests',
    ],
    limitations: [],
    buttonText: 'Upgrade to Pro',
    popular: true,
    tier: 'pro',
    color: 'indigo',
    oldPrice: 15,
  },
  {
    name: 'Premium',
    basePrice: 15.99,
    oldPrice: 25,
    description: 'Ultimate power with adaptive AI and deep insights.',
    features: [
      'Everything in Pro',
      '200 AI Writing Evaluations/month',
      '100 AI Speaking Sessions/month',
      'Unlimited Vocabulary',
      'Adaptive AI Learning Path',
      'Deep Predictive AI Insights',
      'Downloadable Study Packs',
      'Exclusive Community Access',
    ],
    limitations: [],
    buttonText: 'Get Premium',
    tier: 'premium',
    color: 'violet',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Temporary kill switch for Bangladesh manual payment flow.
const MANUAL_BD_PAYMENT_ENABLED = true;

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'quarterly'
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState(null);

  // Use custom hook for pricing and user data
  const {
    user,
    plans,
    detectedCountry,
    isLoading: isPricingLoading,
    refetchUser,
  } = usePricing(defaultPlans, {
    disableBangladeshLocalization: !MANUAL_BD_PAYMENT_ENABLED,
  });

  const [isLoading, setIsLoading] = useState(false);

  const countryIdentifier = (detectedCountry || localStorage.getItem('user_country') || '')
    .trim()
    .toUpperCase();
  const isBD =
    (countryIdentifier === 'BD' || countryIdentifier === 'BANGLADESH') &&
    countryIdentifier !== 'TEST';
  const useManualBdPayment = isBD && MANUAL_BD_PAYMENT_ENABLED;

  // Sync selectedPlan and promoDiscount with user data when it loads
  useEffect(() => {
    if (user) {
      setSelectedPlan(user.subscription_tier || 'free');
      setPromoDiscount(user.promo_discount || null);
    }
  }, [user]);

  // Handle promo application
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const {
        data: { session },
      } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());
      if (!session) return false;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'no_stripe_subscription') {
          return false;
        }
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) window.location.href = data.url;
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

  const handleUpgrade = async (planTier) => {
    const selectedPlanData = plans.find((p) => p.tier === planTier);
    const displayPrice = selectedPlanData
      ? calculatePrice(selectedPlanData.basePrice, billingInterval, promoDiscount)
      : 0;

    trackAppEvent('plan_selected', {
      path: '/pricing',
      plan_tier: planTier,
      billing_interval: billingInterval,
      value: displayPrice,
      currency: selectedPlanData?.currency || 'USD',
      current_tier: user?.subscription_tier || 'free',
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

    const hasStripeSubscription = Boolean(user.stripe_subscription_id);
    if (hasStripeSubscription && !useManualBdPayment) {
      const portaled = await handleOpenPortal();
      if (portaled !== false) return;
    }

    if (useManualBdPayment) {
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
      return;
    }

    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
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

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          tier: planTier,
          interval: billingInterval,
          currency: planCurrency.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        trackAppEvent('checkout_redirected', {
          path: '/pricing',
          plan_tier: planTier,
          billing_interval: billingInterval,
          currency: planCurrency,
        });

        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
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

  return (
    <>
      <DocumentHead
        title="IELTS Preparation Pricing Plans - Free to Premium | IELTS Ai Pro"
        description="Affordable, flexible IELTS prep plans starting at $9.99/month. Get unlimited mock tests, AI feedback, adaptive learning. Try free or upgrade to Premium for complete coaching."
        canonicalUrl="https://www.ieltsai.pro/pricing"
        keywords="IELTS pricing, IELTS courses cost, affordable IELTS prep, IELTS plans"
      />

      <div className="relative min-h-screen pb-16 bg-slate-50 dark:bg-background transition-colors duration-500 overflow-hidden font-sans">
        {/* Background Radial Lights */}
        <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-indigo-500/10 dark:bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[120px]" />
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="px-4 md:px-8 pt-8 md:pt-12 pb-16 md:pb-24 max-w-[1360px] mx-auto space-y-12 relative z-10"
        >
          {/* Hero Section */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 space-y-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-full text-xs font-black tracking-wider"
              >
                FLEXIBLE PLANS FOR EVERY CANDIDATE
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-950 dark:text-white">
              Invest in Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Target Band Score
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium px-2 leading-relaxed">
              Choose the ideal preparation plan to accelerate your IELTS learning path with
              unlimited practice, instant AI scoring, and personalized diagnostics.
            </p>

            {/* Billing Toggle & Promo Code */}
            <div className="mt-8 flex flex-col items-center gap-5">
              <div className="flex items-center justify-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-slate-200/90 dark:border-white/10 w-fit shadow-md">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={cn(
                    'px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-200',
                    billingInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('quarterly')}
                  className={cn(
                    'px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-200 relative',
                    billingInterval === 'quarterly'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  Quarterly
                  {billingInterval !== 'quarterly' && (
                    <span className="absolute -top-3 -right-2 bg-emerald-600 text-[10px] text-white px-2 py-0.5 rounded-full font-black shadow-md">
                      15% OFF
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Promo Code?
                  </span>
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
                {/* Direct PromoCodeRedemption without redundant double-border wrapper */}
                <div className="relative z-50">
                  <PromoCodeRedemption
                    onPromoApplied={handlePromoApplied}
                    existingDiscount={promoDiscount}
                  />
                </div>
              </div>
            </div>
          </m.div>

          {/* Spacious Pricing Cards Grid */}
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mb-20 items-stretch"
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

          {user?.subscription_tier !== 'free' && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mb-16 -mt-8"
            >
              <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                Want to manage your current subscription or payment methods?
              </p>
              {useManualBdPayment || !user?.stripe_subscription_id ? (
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
                  className="rounded-full px-8 h-11 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs shadow-sm"
                >
                  Contact Support
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={isLoading}
                  className="rounded-full px-8 h-11 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs shadow-sm"
                >
                  {isLoading ? 'Opening…' : 'Open Billing Portal'}
                </Button>
              )}
            </m.div>
          )}

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
