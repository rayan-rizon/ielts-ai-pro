import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Check, Star, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
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

const PLAN_ICONS = {
  free: Zap,
  pro: Star,
  premium: Crown,
};

const LANDING_BUTTON_TEXT = {
  free: 'Start Practice Free',
  pro: 'Upgrade to Pro',
  premium: 'Get Premium',
};

const PricingSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="rounded-[24px] p-8 border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 h-[580px] flex flex-col"
      >
        <Skeleton className="h-10 w-10 rounded-xl mb-6" />
        <Skeleton className="h-7 w-1/3 mb-3" />
        <Skeleton className="h-12 w-full mb-8" />
        <div className="space-y-4 flex-grow">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex gap-3 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full mt-auto rounded-xl" />
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
      icon: PLAN_ICONS[plan.tier],
      buttonText: LANDING_BUTTON_TEXT[plan.tier],
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

function PricingFeature({ label, unavailable, isPopular }) {
  const isUnavailable = unavailable || label.startsWith('0 ');

  return (
    <div className="group/item flex items-center gap-3 text-xs sm:text-sm font-medium">
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover/item:scale-110',
          isUnavailable
            ? 'bg-slate-100/60 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500'
            : isPopular
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 border border-slate-200/60 text-slate-700 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200'
        )}
      >
        {isUnavailable ? (
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ) : (
          <Check className="h-3 w-3 stroke-[2.5]" />
        )}
      </span>
      <span
        className={cn(
          'transition-transform duration-200 group-hover/item:translate-x-0.5',
          isUnavailable
            ? 'text-slate-400 line-through dark:text-slate-500'
            : 'text-slate-800 dark:text-slate-200 font-bold'
        )}
      >
        {label}
      </span>
    </div>
  );
}

function PricingPlanCard({ plan, billingCycle, handlePrimaryCta, viewport, index }) {
  const currentPrice = plan.pricing[billingCycle];
  const Icon = plan.icon;

  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={itemVariants}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'relative flex flex-col h-full rounded-[28px] p-7 sm:p-8 backdrop-blur-xl transition-all duration-300',
        plan.popular
          ? 'border-2 border-indigo-600/90 bg-white dark:bg-slate-900 shadow-[0_22px_60px_-15px_rgba(79,70,229,0.22)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] md:-translate-y-4 z-20 hover:-translate-y-5 hover:shadow-indigo-500/30'
          : 'border border-slate-200/90 bg-white/95 dark:border-white/10 dark:bg-slate-900/70 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.4)] hover:border-slate-300 dark:hover:border-white/20 hover:-translate-y-1 hover:shadow-xl'
      )}
    >
      {plan.popular && (
        <>
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/15 overflow-hidden rounded-[28px]" />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-[10px] font-black uppercase tracking-widest rounded-full text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-1.5 whitespace-nowrap leading-none z-30">
            <Sparkles className="h-3 w-3" />
            <span>Best Choice</span>
          </div>
        </>
      )}

      <div className="mb-6 relative z-10">
        <div
          className={cn(
            'h-11 w-11 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105',
            plan.name === 'Pro'
              ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
              : plan.name === 'Premium'
                ? 'bg-gradient-to-br from-purple-500/15 to-violet-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 shadow-2xs'
                : 'bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-2xs'
          )}
        >
          <Icon className="h-5.5 w-5.5" />
        </div>
        <h3 className="text-xl font-black text-slate-950 dark:text-white">{plan.name}</h3>
        <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 min-h-[40px]">
          {plan.desc}
        </p>
      </div>

      <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5 relative z-10">
        {currentPrice.oldPrice && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Was
            </span>
            <span className="text-sm font-bold text-slate-400 line-through">
              {currentPrice.oldPrice}
            </span>
            {currentPrice.savings && (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                {currentPrice.savings}
              </span>
            )}
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <AnimatePresence mode="wait">
            <m.span
              key={currentPrice.price}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-4xl sm:text-[46px] font-black tracking-tight text-slate-950 dark:text-white"
            >
              {currentPrice.price}
            </m.span>
          </AnimatePresence>
          {currentPrice.period && (
            <span className="text-xs font-extrabold text-slate-400">{currentPrice.period}</span>
          )}
        </div>
      </div>

      <div className="space-y-3.5 mb-8 flex-grow relative z-10">
        {plan.displayFeatures.map((feature) => (
          <PricingFeature key={feature.label} {...feature} isPopular={plan.popular} />
        ))}
      </div>

      <Button
        onClick={handlePrimaryCta}
        className={cn(
          'w-full h-12 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 relative z-10',
          plan.popular
            ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.98]'
            : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
        )}
      >
        <span>{plan.buttonText}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </m.div>
  );
}

export default function PricingSection({ handlePrimaryCta, viewport }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [configuredPlans, setConfiguredPlans] = useState(DEFAULT_PRICING_PLANS);
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const sectionRef = useRef(null);

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

  return (
    <SoftSection
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-24 bg-white dark:bg-[#070912] border-t border-slate-200/60 dark:border-white/5 py-16 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="mb-10">
          <SectionHeading
            eyebrow="Pricing plans"
            title="Simple plans."
            script="Clear limits."
            description="Choose a transparent plan based on the practice tools and monthly AI limits you need."
            viewport={viewport}
          />
        </div>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <m.div variants={itemVariants} className="flex justify-center">
            <div className="relative inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/90">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'relative z-10 px-6 sm:px-7 py-2.5 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200',
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
                  'relative z-10 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200 flex items-center gap-2',
                  billingCycle === 'quarterly'
                    ? 'text-slate-950 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                {billingCycle === 'quarterly' && (
                  <m.span
                    layoutId="activeBillingTab"
                    className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.12)] dark:bg-slate-800"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span>Quarterly</span>
                <span className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  Save 15%
                </span>
              </button>
            </div>
          </m.div>
        </m.div>

        <div className="relative min-h-[580px]">
          {isPricingLoading ? (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PricingSkeleton />
            </m.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch pt-5">
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
