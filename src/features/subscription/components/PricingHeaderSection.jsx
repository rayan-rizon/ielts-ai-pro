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
          className="px-4 py-1.5 bg-[#f2f0ff]/75 text-[#5e50ee] dark:bg-violet-950/50 dark:text-violet-300 border-[#ded9ff] dark:border-violet-500/30 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-[0_8px_24px_-8px_rgba(98,86,239,0.22)] backdrop-blur-md"
        >
          FLEXIBLE PLANS FOR EVERY CANDIDATE
        </Badge>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#101836] dark:text-white">
        Invest in Your Target Band Score
      </h1>
      <p className="text-sm sm:text-base text-[#56617f] dark:text-slate-300 max-w-xl mx-auto font-medium px-2 leading-relaxed">
        Choose the ideal preparation plan to accelerate your IELTS learning path with unlimited
        practice, instant AI scoring, and personalized diagnostics.
      </p>

      {/* Billing Toggle & Promo Code */}
      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="relative inline-flex items-center rounded-full border border-[#ded9ff] bg-[#f2f0ff]/80 p-1 shadow-inner backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              'relative z-10 px-6 sm:px-7 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-black tracking-tight transition-colors duration-200 cursor-pointer',
              billingInterval === 'monthly'
                ? 'text-white'
                : 'text-[#56617f] hover:text-[#101836] dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'monthly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-[#6256ef] shadow-md shadow-[#6256ef]/30"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval('quarterly')}
            className={cn(
              'relative z-10 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-black tracking-tight transition-colors duration-200 flex items-center gap-2 cursor-pointer',
              billingInterval === 'quarterly'
                ? 'text-white'
                : 'text-[#56617f] hover:text-[#101836] dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {billingInterval === 'quarterly' && (
              <m.span
                layoutId="activeBillingTabPricing"
                className="absolute inset-0 z-[-1] rounded-full bg-[#6256ef] shadow-md shadow-[#6256ef]/30"
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <span>Quarterly</span>
            <span
              className={cn(
                'text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-colors duration-200',
                billingInterval === 'quarterly'
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                  : 'bg-[#f2f0ff] text-[#5e50ee] border border-[#ded9ff] dark:bg-violet-950/80 dark:border-violet-500/30 dark:text-violet-300'
              )}
            >
              Save 15%
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-[#ded9ff] dark:bg-slate-800" />
            <span className="text-[10px] font-black text-[#737d9b] uppercase tracking-widest">
              Promo Code?
            </span>
            <div className="w-8 h-px bg-[#ded9ff] dark:bg-slate-800" />
          </div>
          <div className="relative z-50">
            <PromoCodeRedemption onPromoApplied={onPromoApplied} existingDiscount={promoDiscount} />
          </div>
        </div>
      </div>
    </m.div>
  );
}
