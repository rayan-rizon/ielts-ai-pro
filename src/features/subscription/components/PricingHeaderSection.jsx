import React from 'react';
import { m } from 'framer-motion';
import { CalendarCheck2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO } from '@/features/dashboard/components/primitives';
import PromoCodeRedemption from '@/components/PromoCodeRedemption';
import { EXAM_PASS_DISCOUNT_PERCENT, EXAM_PASS_MONTHS } from '@/lib/pricingUtils';
import { SwapLine } from './pricingMotion';

// transitions.dev tabs sliding: 250ms smooth-out, no overshoot.
const TOGGLE_SLIDE = { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

function IntervalTab({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative z-10 flex cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full py-2 text-xs font-bold tracking-tight transition-[color,transform] duration-160 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] sm:text-[13px]',
        active
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        className
      )}
    >
      {active && (
        <m.span
          layoutId="activeBillingTabPricing"
          className="absolute inset-0 z-[-1] rounded-full bg-[#5a63df]"
          transition={TOGGLE_SLIDE}
        />
      )}
      {children}
    </button>
  );
}

export default function PricingHeaderSection({
  billingInterval,
  setBillingInterval,
  promoDiscount,
  onPromoApplied,
  coverageNote,
}) {
  const isPass = billingInterval === 'quarterly';

  return (
    <header className="flex flex-col items-center gap-2.5 text-center">
      <p
        className={cn(
          MICRO,
          'inline-flex items-center gap-2 rounded-full border border-[#e4e2f0] bg-white px-3 py-1.5 text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-400'
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" aria-hidden="true" />
        Plans &amp; pricing
      </p>
      <h1 className="max-w-3xl text-balance text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[44px] md:text-[52px]">
        Your dream starts with{' '}
        <span className="text-[#5a63df] dark:text-[#a9afff]">the right band score</span>
      </h1>
      <p className="max-w-md text-balance px-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[15px]">
        Instant AI band scores and a study plan built around your exam date.
      </p>

      <div className="mt-1.5 inline-flex w-full max-w-sm items-center rounded-full border border-[#e4e2f0] bg-white p-1 dark:border-white/10 dark:bg-white/4 sm:w-auto">
        <IntervalTab
          active={!isPass}
          onClick={() => setBillingInterval('monthly')}
          className="flex-1 justify-center px-4 sm:flex-initial sm:px-6"
        >
          Monthly
        </IntervalTab>
        <IntervalTab
          active={isPass}
          onClick={() => setBillingInterval('quarterly')}
          className="flex-1 justify-center gap-1.5 px-3 sm:flex-initial sm:gap-2 sm:px-5"
        >
          <span className="whitespace-nowrap">{EXAM_PASS_MONTHS}-Month Pass</span>
          <span
            className={cn(
              'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide transition-colors duration-200',
              isPass
                ? 'bg-white/20 text-white'
                : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
            )}
          >
            <span className="sm:hidden">−{EXAM_PASS_DISCOUNT_PERCENT}%</span>
            <span className="hidden sm:inline">Save {EXAM_PASS_DISCOUNT_PERCENT}%</span>
          </span>
        </IntervalTab>
      </div>

      {/* One line, fixed height: the exam date if there is one, else how billing works. */}
      <div
        className={cn(
          'inline-flex max-w-md items-center justify-center gap-1.5 text-xs font-semibold',
          coverageNote ? 'text-[#5a63df] dark:text-[#a9afff]' : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {coverageNote && <CalendarCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <SwapLine align="center" className="text-inherit">
          {coverageNote ||
            (isPass
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
    </header>
  );
}
