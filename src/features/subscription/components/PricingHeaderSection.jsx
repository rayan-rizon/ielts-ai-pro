import React from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
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
      className="text-center mb-6 space-y-3"
    >
      <div className="flex flex-col items-center gap-2">
        <Badge
          variant="outline"
          className="px-3.5 py-1 bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border-[#5661e9]/20 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase"
        >
          FLEXIBLE PLANS FOR EVERY CANDIDATE
        </Badge>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-950 dark:text-white">
        Invest in Your Target Band Score
      </h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium px-2 leading-relaxed">
        Choose the ideal preparation plan to accelerate your IELTS learning path with unlimited
        practice, instant AI scoring, and personalized diagnostics.
      </p>

      {/* Billing Toggle & Promo Code */}
      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="relative inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              'relative z-10 px-6 sm:px-7 py-2 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200 cursor-pointer',
              billingInterval === 'monthly'
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'monthly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.12)] dark:bg-slate-800"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval('quarterly')}
            className={cn(
              'relative z-10 px-5 sm:px-6 py-2 rounded-full text-xs sm:text-[13px] font-extrabold tracking-tight transition-colors duration-200 flex items-center gap-2 cursor-pointer',
              billingInterval === 'quarterly'
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'quarterly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.12)] dark:bg-slate-800"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <span>Quarterly</span>
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/90 dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/60 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              Save 15%
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Promo Code?
            </span>
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="relative z-50">
            <PromoCodeRedemption onPromoApplied={onPromoApplied} existingDiscount={promoDiscount} />
          </div>
        </div>
      </div>
    </m.div>
  );
}
