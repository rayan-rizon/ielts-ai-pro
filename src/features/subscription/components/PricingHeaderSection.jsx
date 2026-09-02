import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Pill } from '@/features/dashboard/components/primitives';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';

export default function PricingHeaderSection({
  billingInterval,
  setBillingInterval,
  promoDiscount,
  onPromoApplied,
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 space-y-3 text-center"
    >
      <div className="flex flex-col items-center gap-2">
        <Pill tone="accent">Flexible plans for every candidate</Pill>
      </div>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
        Invest in your target band score
      </h1>
      <p className="mx-auto max-w-xl px-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
        Choose the ideal preparation plan to accelerate your IELTS learning path with unlimited
        practice, instant AI scoring, and personalized diagnostics.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="relative inline-flex items-center rounded-full border border-[#e4e2f0] bg-white p-1 dark:border-white/10 dark:bg-white/4">
          <button
            type="button"
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              'relative z-10 cursor-pointer rounded-full px-6 py-1.5 text-xs font-bold tracking-tight transition-colors duration-200 sm:px-7 sm:py-2 sm:text-[13px]',
              billingInterval === 'monthly'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'monthly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-[#5a63df]"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval('quarterly')}
            className={cn(
              'relative z-10 flex cursor-pointer items-center gap-2 rounded-full px-5 py-1.5 text-xs font-bold tracking-tight transition-colors duration-200 sm:px-6 sm:py-2 sm:text-[13px]',
              billingInterval === 'quarterly'
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'quarterly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-[#5a63df]"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <span>Quarterly</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200',
                billingInterval === 'quarterly'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
              )}
            >
              Save 15%
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-[#e4e2f0] dark:bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Promo code?
            </span>
            <div className="h-px w-8 bg-[#e4e2f0] dark:bg-white/10" />
          </div>
          <div className="relative z-50">
            <PromoCodeRedemption onPromoApplied={onPromoApplied} existingDiscount={promoDiscount} />
          </div>
        </div>
      </div>
    </m.div>
  );
}
