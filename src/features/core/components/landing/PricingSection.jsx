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
              ? 'bg-[#f2f0ff] text-[#5e50ee] border border-[#ded9ff] dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-500/30'
              : 'bg-[#faf9ff] text-[#56617f] border border-[#e2e5fa] dark:bg-slate-800 dark:text-slate-300'
        )}
      >
        {isUnavailable ? (
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ) : (
          <Check className="w-3 h-3 stroke-[2.5]" />
        )}
      </div>
      <span
        className={cn(
          'text-[13px] leading-snug transition-colors duration-150',
          isUnavailable
            ? 'text-slate-400/80 dark:text-slate-500 line-through font-medium'
            : 'text-[#101836] dark:text-slate-200 font-extrabold'
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
        'relative flex flex-col h-full rounded-[32px] px-7 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-7 transition-all duration-300 backdrop-blur-md z-10 w-full justify-between',
        isPro
          ? 'border border-[#ded9ff] bg-gradient-to-b from-white via-white to-[#faf9ff] dark:from-[#0d1020] dark:to-[#070914] dark:border-violet-500/35 shadow-[0_16px_48px_-16px_rgba(98,86,239,0.15),0_0_24px_-4px_rgba(98,86,239,0.08)] scale-100 lg:scale-[1.03] z-20'
          : 'border border-[#e2e5fa] bg-white dark:bg-slate-900/90 dark:border-slate-800 shadow-[0_12px_32px_-16px_rgba(79,66,220,0.08)] mt-0 lg:mt-2 mb-0 lg:mb-2'
      )}
    >
      <div>
        {/* Card Header: Title on Left, Badge on Right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xl sm:text-2xl font-black text-[#101836] dark:text-white tracking-tight">
            {plan.name}
          </h3>
          {isPro && (
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 border border-[#ded9ff] text-[#5e50ee] bg-[#f2f0ff]/90 dark:border-violet-500/30 dark:bg-violet-950/60 dark:text-violet-300 shrink-0 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#6256ef] dark:text-violet-300" />
              Most Popular
            </span>
          )}
          {isPremium && (
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 border border-[#ded9ff] text-[#5e50ee] bg-[#f2f0ff]/90 dark:border-violet-500/30 dark:bg-violet-950/60 dark:text-violet-300 shrink-0 shadow-2xs">
              <Crown className="w-3 h-3 text-[#6256ef] dark:text-violet-300" />
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
                className="text-3xl sm:text-4xl font-black text-[#101836] dark:text-white tracking-tight"
              >
                {currentPrice.price}
              </m.span>
            </AnimatePresence>
            {currentPrice.period && (
              <span className="text-[13px] font-semibold text-[#56617f] dark:text-slate-400">
                / Per Month
              </span>
            )}
          </div>

          {currentPrice.oldPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-[#737d9b] dark:text-slate-500 uppercase tracking-wider">
                WAS
              </span>
              <span className="text-xs font-bold text-[#737d9b] dark:text-slate-500 line-through">
                {currentPrice.oldPrice}
              </span>
              {currentPrice.savings && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f2f0ff] text-[#5e50ee] border border-[#ded9ff] dark:bg-violet-950/80 dark:border-violet-500/30 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider">
                  {currentPrice.savings}
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-[13px] font-medium leading-relaxed text-[#56617f] dark:text-slate-400 mt-2 mb-4">
          {plan.desc}
        </p>

        {/* Subtle Line Divider */}
        <div className="flex items-center gap-1.5 my-4">
          <div className="w-1 h-1 rounded-full bg-[#ded9ff] dark:bg-slate-700"></div>
          <div className="h-px bg-[#eeeafd] dark:bg-slate-800 flex-1"></div>
          <div className="w-1 h-1 rounded-full bg-[#ded9ff] dark:bg-slate-700"></div>
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
          'group/btn w-full h-[52px] rounded-2xl text-[14px] font-black tracking-tight transition-all duration-200 flex items-center justify-center gap-2 mt-auto cursor-pointer',
          isPro
            ? 'bg-[#101836] hover:bg-[#1b264e] text-white shadow-md shadow-[#101836]/15 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-[#faf9ff] hover:bg-[#f2f0ff] text-[#101836] border border-[#ded9ff] dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700 shadow-2xs hover:scale-[1.01] active:scale-[0.99]'
        )}
      >
        <span>{plan.buttonText}</span>
        <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover/btn:translate-x-1" />
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
        <div className="relative inline-flex items-center rounded-full border border-[#ded9ff] bg-[#f2f0ff]/80 p-1 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'relative z-10 px-6 sm:px-7 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-black tracking-tight transition-colors duration-200 cursor-pointer',
              billingCycle === 'monthly'
                ? 'text-white'
                : 'text-[#56617f] hover:text-[#101836] dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingCycle === 'monthly' && (
              <m.span
                layoutId="activeBillingTab"
                className="absolute inset-0 z-[-1] rounded-full bg-[#6256ef] shadow-md shadow-[#6256ef]/30"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('quarterly')}
            className={cn(
              'relative z-10 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-black tracking-tight transition-colors duration-200 flex items-center gap-2 cursor-pointer',
              billingCycle === 'quarterly'
                ? 'text-white'
                : 'text-[#56617f] hover:text-[#101836] dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingCycle === 'quarterly' && (
              <m.span
                layoutId="activeBillingTab"
                className="absolute inset-0 z-[-1] rounded-full bg-[#6256ef] shadow-md shadow-[#6256ef]/30"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span>Quarterly</span>
            <span
              className={cn(
                'text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-colors duration-200',
                billingCycle === 'quarterly'
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                  : 'bg-[#f2f0ff] text-[#5e50ee] border border-[#ded9ff] dark:bg-violet-950/80 dark:border-violet-500/30 dark:text-violet-300'
              )}
            >
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
