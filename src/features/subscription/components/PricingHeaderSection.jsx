import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';
import { EXAM_PASS_DISCOUNT_PERCENT, EXAM_PASS_MONTHS } from '@/lib/pricingUtils';
import { SwapLine } from './pricingMotion';

// transitions.dev tabs sliding: 250ms smooth-out, no overshoot.
const TOGGLE_SLIDE = { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

export default function PricingHeaderSection({
  billingInterval,
  setBillingInterval,
  promoDiscount,
  onPromoApplied,
  coverageNote,
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      // Clears the floating sidebar button on phones now the badge no longer does.
      className="mb-6 space-y-3 pt-10 text-center sm:pt-0"
    >
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
        Your dream starts with{' '}
        <span className="text-[#5a63df] dark:text-[#a9afff]">the right band score</span>
      </h1>
      <p className="mx-auto max-w-md text-balance px-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
        Instant AI band scores and a study plan built around your exam date.
      </p>

      <div className="mt-5 flex flex-col items-center gap-3">
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
                transition={TOGGLE_SLIDE}
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
                transition={TOGGLE_SLIDE}
              />
            )}
            <span>{EXAM_PASS_MONTHS}-Month Pass</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors duration-200',
                billingInterval === 'quarterly'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
              )}
            >
              Save {EXAM_PASS_DISCOUNT_PERCENT}%
            </span>
          </button>
        </div>

        {/* One line, fixed height: the exam date if there is one, else how billing works. */}
        <div className="-mt-1 w-full max-w-md text-xs font-semibold">
          <SwapLine
            align="center"
            className={
              coverageNote
                ? 'text-[#5a63df] dark:text-[#a9afff]'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {coverageNote ||
              (billingInterval === 'quarterly'
                ? `One payment for ${EXAM_PASS_MONTHS} months · no auto-renewal`
                : 'Pay month to month')}
          </SwapLine>
        </div>

        <div className="flex flex-col items-center gap-1.5">
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
