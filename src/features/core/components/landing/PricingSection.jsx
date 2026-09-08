import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { calculatePrice } from '@/lib/pricingUtils';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import {
  configurePricingPlans,
  loadPricingConfiguration,
} from '@/features/subscription/hooks/usePricing';
import { PANEL } from '@/features/dashboard/components/primitives';
import PricingCard from '@/features/subscription/components/PricingCard';
import { SectionHeading, SoftSection } from './LandingSection';

const LANDING_BUTTON_TEXT = {
  free: 'Start Practice Free',
  pro: 'Upgrade to Pro',
  premium: 'Get Premium',
};

/**
 * Same shell the real pricing page's cards render in (see PricingCard.jsx) —
 * three rounded-xl PANEL blocks, not the old bespoke rounded-[32px] shape —
 * so the loading state doesn't flash a different silhouette than the cards
 * that replace it.
 */
const PricingSkeleton = () => (
  <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={cn(
          PANEL,
          'flex flex-col justify-between px-6 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6'
        )}
      >
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="h-7 w-20 animate-pulse rounded bg-slate-100 dark:bg-white/6" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-white/6" />
          </div>
          <div className="mb-4 h-10 w-2/5 animate-pulse rounded bg-slate-100 dark:bg-white/6" />
          <div className="mb-4 h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-white/6" />
          <div className="mb-4 h-px bg-[#eeedf7] dark:bg-white/[0.07]" />
          <div className="mb-6 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-100 dark:bg-white/6" />
                <div
                  className={cn(
                    'h-4 animate-pulse rounded bg-slate-100 dark:bg-white/6',
                    s % 2 === 0 ? 'w-3/4' : 'w-1/2'
                  )}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="h-12 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-white/6" />
      </div>
    ))}
  </div>
);

/** Landing has no signed-in subscription context, so every plan renders as
 * available — never "current plan" or "switch to this plan" — and the CTA
 * just sends an anonymous visitor to sign up rather than attempting checkout
 * inline. Everything else (layout, badges, feature list, button styling)
 * comes straight from the real pricing page's card. */
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

  const plans = useMemo(
    () =>
      configuredPlans.map((plan) => ({
        ...plan,
        buttonText: LANDING_BUTTON_TEXT[plan.tier] || plan.buttonText,
      })),
    [configuredPlans]
  );

  return { plans, isPricingLoading };
}

function BillingCycleToggle({ billingCycle, setBillingCycle, viewport }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5 }}
      className="mb-8 flex justify-center"
    >
      <div className="relative inline-flex items-center rounded-full border border-[#e4e2f0] bg-white p-1 dark:border-white/10 dark:bg-white/4">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'relative z-10 cursor-pointer rounded-full px-6 py-1.5 text-xs font-bold tracking-tight transition-colors duration-200 sm:px-7 sm:py-2 sm:text-[13px]',
            billingCycle === 'monthly'
              ? 'text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {billingCycle === 'monthly' && (
            <m.span
              layoutId="activeLandingBillingTab"
              className="absolute inset-0 z-[-1] rounded-full bg-[#5a63df]"
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            />
          )}
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('quarterly')}
          className={cn(
            'relative z-10 flex cursor-pointer items-center gap-2 rounded-full px-5 py-1.5 text-xs font-bold tracking-tight transition-colors duration-200 sm:px-6 sm:py-2 sm:text-[13px]',
            billingCycle === 'quarterly'
              ? 'text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          {billingCycle === 'quarterly' && (
            <m.span
              layoutId="activeLandingBillingTab"
              className="absolute inset-0 z-[-1] rounded-full bg-[#5a63df]"
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            />
          )}
          <span>Quarterly</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200',
              billingCycle === 'quarterly'
                ? 'bg-white/20 text-white'
                : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
            )}
          >
            Save 15%
          </span>
        </button>
      </div>
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
      className="scroll-mt-24 bg-white dark:bg-[#08080a] border-t border-slate-200/60 dark:border-white/5 py-10 lg:py-14"
    >
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]" />

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
            <PricingSkeleton />
          ) : (
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-6 lg:grid-cols-3 lg:gap-8 pt-6 sm:pt-8">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.tier}
                  plan={plan}
                  displayPrice={calculatePrice(plan.basePrice, billingCycle, null)}
                  isActive={false}
                  isSubscribed={false}
                  isLoading={false}
                  isPricingLoading={false}
                  onUpgrade={handlePrimaryCta}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SoftSection>
  );
}
