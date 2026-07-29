import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { calculatePrice } from '@/lib/pricingUtils';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import {
  configurePricingPlans,
  loadPricingConfiguration,
} from '@/features/subscription/hooks/usePricing';
import { SectionHeading, SoftSection } from './LandingSection';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const LANDING_BUTTON_TEXT = {
  free: 'Start Practice Free',
  pro: 'Upgrade to Pro',
  premium: 'Get Premium',
};

const PricingSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto w-full items-stretch">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={cn(
          'rounded-[32px] px-7 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between',
          i === 2
            ? 'lg:scale-[1.04] z-20 border-2 border-[#E5D4FF] dark:border-purple-500/30'
            : 'z-10'
        )}
      >
        <div>
          <div className="flex justify-between items-center mb-3">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-10 w-2/5 mb-4" />
          <div className="flex items-center gap-1.5 my-4">
            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="space-y-3.5 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex gap-3 items-center">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-13 w-full mt-4 rounded-2xl" />
      </div>
    ))}
  </div>
);

function buildLandingPlans(plans) {
  return plans.map((plan) => {
    const symbol = plan.currencySymbol || '$';
    const monthlyPrice = calculatePrice(plan.basePrice, 'monthly');
    const monthlyOldPrice = calculatePrice(plan.oldPrice, 'monthly');
    const quarterlyPerMonth = calculatePrice(plan.basePrice, 'quarterly');
    const calculateSavings = (price) =>
      monthlyOldPrice ? Math.round((1 - Number(price) / Number(monthlyOldPrice)) * 100) : 0;
    const formatSavings = (price) => {
      const savings = calculateSavings(price);
      return savings > 0 ? `SAVE ${savings}%` : null;
    };

    return {
      ...plan,
      desc: plan.description,
      buttonText: LANDING_BUTTON_TEXT[plan.tier] || plan.buttonText,
      displayFeatures: [
        ...plan.features.map((label) => ({ label, unavailable: false })),
        ...plan.limitations.map((label) => ({ label, unavailable: true })),
      ],
      pricing: {
        monthly: {
          price: `${symbol}${monthlyPrice}`,
          period: '/mo',
          oldPrice: monthlyOldPrice ? `${symbol}${monthlyOldPrice}` : null,
          savings: formatSavings(monthlyPrice),
        },
        quarterly: {
          price: `${symbol}${quarterlyPerMonth}`,
          period: '/mo',
          oldPrice: monthlyOldPrice ? `${symbol}${monthlyOldPrice}` : null,
          savings: formatSavings(quarterlyPerMonth),
        },
      },
    };
  });
}

function PricingFeature({ label, unavailable, isPro }) {
  const isUnavailable = unavailable || label.startsWith('0 ');

  return (
    <div className="flex items-start gap-3 group/feat">
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200',
          isUnavailable
            ? 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
            : isPro
              ? 'bg-[#F5F0FF] dark:bg-purple-500/15 text-[#8B5CF6] dark:text-purple-400 ring-1 ring-[#E5D4FF]/80 dark:ring-purple-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
        )}
      >
        {isUnavailable ? (
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ) : (
          <Check className="w-3 h-3 stroke-[2.8]" />
        )}
      </div>
      <span
        className={cn(
          'text-[13px] leading-snug transition-colors duration-150',
          isUnavailable
            ? 'text-slate-400/80 dark:text-slate-500 line-through font-medium'
            : 'text-slate-700 dark:text-slate-200 font-semibold'
        )}
      >
        {label}
      </span>
    </div>
  );
}

function PricingPlanCard({ plan, billingCycle, handlePrimaryCta, viewport, index }) {
  const currentPrice = plan.pricing[billingCycle];
  const isPro = plan.name === 'Pro' || plan.popular;
  const isPremium = plan.name === 'Premium';

  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={itemVariants}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'relative flex flex-col h-full rounded-[32px] px-7 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-7 transition-all duration-300 bg-white dark:bg-slate-900 z-10 w-full justify-between',
        isPro
          ? 'border-2 border-[#E5D4FF] dark:border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.12)] scale-100 lg:scale-[1.04] z-20'
          : 'border border-slate-200/90 dark:border-slate-800 shadow-sm mt-0 lg:mt-2 mb-0 lg:mb-2'
      )}
    >
      <div>
        {/* Card Header: Title on Left, Badge on Right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {plan.name}
          </h3>
          {isPro && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 border border-[#E5D4FF] dark:border-purple-500/30 text-[#8B5CF6] dark:text-purple-400 bg-[#F5F0FF] dark:bg-purple-500/10 shrink-0">
              <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
              Most Popular
            </span>
          )}
          {isPremium && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 shrink-0">
              <Crown className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              Ultimate
            </span>
          )}
        </div>

        {/* Pricing display */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <AnimatePresence mode="wait">
              <m.span
                key={currentPrice.price}
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -4, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                {currentPrice.price}
              </m.span>
            </AnimatePresence>
            {currentPrice.period && (
              <span className="text-[13px] font-medium text-slate-400">/ Per Month</span>
            )}
          </div>

          {currentPrice.oldPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                WAS
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 line-through">
                {currentPrice.oldPrice}
              </span>
              {currentPrice.savings && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                  {currentPrice.savings}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mt-2 mb-4">
          {plan.desc}
        </p>

        {/* Dot line divider */}
        <div className="flex items-center gap-1.5 my-4">
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        </div>

        {/* Features checklist */}
        <div className="space-y-3 mb-6">
          {plan.displayFeatures.map((feature) => (
            <PricingFeature key={feature.label} {...feature} isPro={isPro} />
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handlePrimaryCta}
        className={cn(
          'group/btn w-full h-[52px] rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 mt-auto',
          isPro
            ? 'bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md shadow-slate-950/10 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200/90 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 hover:border-slate-300/80 shadow-2xs hover:scale-[1.01] active:scale-[0.99]'
        )}
      >
        <span>{plan.buttonText}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
      </Button>
    </m.div>
  );
}

function useLandingPricingConfig() {
  const [configuredPlans, setConfiguredPlans] = useState(DEFAULT_PRICING_PLANS);
  const [isPricingLoading, setIsPricingLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    loadPricingConfiguration()
      .then((pricingConfig) => {
        if (isActive) {
          setConfiguredPlans(configurePricingPlans(DEFAULT_PRICING_PLANS, pricingConfig));
        }
      })
      .catch((error) => {
        console.error('Failed to load landing pricing:', error);
      })
      .finally(() => {
        if (isActive) setIsPricingLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const plans = useMemo(() => buildLandingPlans(configuredPlans), [configuredPlans]);

  return { plans, isPricingLoading };
}

function BillingCycleToggle({ billingCycle, setBillingCycle, viewport }) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={containerVariants}
      className="text-center mb-8"
    >
      <m.div variants={itemVariants} className="flex justify-center">
        <div className="relative inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'relative z-10 px-6 sm:px-7 py-2 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200',
              billingCycle === 'monthly'
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingCycle === 'monthly' && (
              <m.span
                layoutId="activeBillingTab"
                className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.12)] dark:bg-slate-800"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('quarterly')}
            className={cn(
              'relative z-10 px-5 sm:px-6 py-2 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200 flex items-center gap-2',
              billingCycle === 'quarterly'
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingCycle === 'quarterly' && (
              <m.span
                layoutId="activeBillingTab"
                className="absolute inset-0 z-[-1] rounded-full bg-[#5661e9] shadow-[0_2px_10px_-2px_rgba(15,23,42,0.12)] dark:bg-slate-800"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span>Quarterly</span>
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/60 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Save 15%
            </span>
          </button>
        </div>
      </m.div>
    </m.div>
  );
}

export default function PricingSection({ handlePrimaryCta, viewport }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const { plans, isPricingLoading } = useLandingPricingConfig();
  const sectionRef = useRef(null);

  return (
    <SoftSection
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-24 bg-white dark:bg-[#070912] border-t border-slate-200/60 dark:border-white/5 py-10 lg:py-14"
    >
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="mb-6">
          <SectionHeading
            eyebrow="Pricing plans"
            title="Simple plans."
            script="Clear limits."
            description="Choose a transparent plan based on the practice tools and monthly AI limits you need."
            viewport={viewport}
          />
        </div>

        <BillingCycleToggle
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          viewport={viewport}
        />

        <div className="relative">
          {isPricingLoading ? (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PricingSkeleton />
            </m.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
              {plans.map((plan, index) => (
                <PricingPlanCard
                  key={plan.name}
                  plan={plan}
                  billingCycle={billingCycle}
                  handlePrimaryCta={handlePrimaryCta}
                  viewport={viewport}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SoftSection>
  );
}
