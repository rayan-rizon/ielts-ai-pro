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
// Set to true when you want to restore bKash/Nagad checkout.
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
    // Industry-standard guard: only users with an active Stripe subscription
    // (stripe_subscription_id set) can use the Customer Portal.
    // stripe_customer_id alone is insufficient — promo-granted users may have
    // acquired one from an abandoned checkout attempt without ever subscribing.
    if (!user?.stripe_subscription_id) {
      // Fall through to checkout for promo-granted or non-Stripe users
      return false; // signal: not eligible for portal
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

      // The edge function returns 'no_stripe_subscription' when the user has no
      // active Stripe subscription (e.g. promo grant). Treat this silently and
      // fall back to checkout instead of showing a confusing error.
      if (!response.ok) {
        if (data.error === 'no_stripe_subscription') {
          return false; // caller will route to checkout
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

    // INDUSTRY STANDARD: Only route to Customer Portal if the user has an active
    // Stripe subscription (stripe_subscription_id is set). This is the definitive
    // check — stripe_customer_id alone can exist from an abandoned checkout.
    //
    // Promo-granted users have no stripe_subscription_id, so they fall through
    // to Stripe Checkout, starting a real subscription for the first time.
    const hasStripeSubscription = Boolean(user.stripe_subscription_id);
    if (hasStripeSubscription && !useManualBdPayment) {
      const portaled = await handleOpenPortal();
      if (portaled !== false) return; // portal opened successfully
      // portaled === false means no Stripe sub → fall through to checkout
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
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
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

      <div className="relative min-h-screen pb-20 bg-slate-50 dark:bg-background transition-colors duration-500 overflow-hidden font-sans">
        {/* Background */}
        <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-indigo-500/5 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-slate-200/10 dark:bg-primary/5 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-10 md:pb-20 max-w-[1400px] mx-auto space-y-8 relative z-10"
        >
          {/* Hero Section */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 rounded-full font-bold tracking-wide"
              >
                PRICING PLANS
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              AI-Powered{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 dark:from-indigo-400 dark:via-violet-400 dark:to-blue-400">
                IELTS Success
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium px-2">
              Join thousands of successful students who reached their target band with our
              AI-powered personalized learning ecosystem.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 dark:border-white/10 w-fit shadow-lg">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={cn(
                    'px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300',
                    billingInterval === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('quarterly')}
                  className={cn(
                    'px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 relative',
                    billingInterval === 'quarterly'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  Quarterly
                  {billingInterval !== 'quarterly' && (
                    <span className="absolute -top-3 -right-2 bg-emerald-700 text-[10px] text-white px-2 py-0.5 rounded-full font-black animate-bounce shadow-md">
                      15% OFF
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.3em]">
                    Special Offer?
                  </span>
                  <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="inline-flex items-center gap-2 p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-2xl shadow-indigo-500/5 transition-all duration-500 hover:shadow-indigo-500/10 hover:-translate-y-0.5 group/promo relative z-50">
                  <PromoCodeRedemption
                    onPromoApplied={handlePromoApplied}
                    existingDiscount={promoDiscount}
                  />
                </div>
              </div>
            </div>
          </m.div>

          {/* Pricing Cards */}
          <m.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mb-32"
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
              className="flex flex-col items-center gap-4 mb-20 -mt-10"
            >
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Want to manage your current subscription or payment methods?
              </p>
              {/* Show billing portal only for users with an active Stripe subscription.
                  stripe_subscription_id is the definitive check — promo-granted users
                  may have a stripe_customer_id from an abandoned checkout but no subscription. */}
              {useManualBdPayment || !user?.stripe_subscription_id ? (
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
                  className="rounded-full px-8 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs"
                >
                  Contact Support
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={isLoading}
                  className="rounded-full px-8 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-black uppercase tracking-widest text-xs"
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
