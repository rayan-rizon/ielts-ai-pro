import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

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

export default function PricingCard({
  plan,
  displayPrice,
  isActive,
  isSubscribed,
  isLoading,
  isPricingLoading,
  onUpgrade,
}) {
  const isPro = plan.tier === 'pro';
  const isPremium = plan.tier === 'premium';

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <div
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
              {isPricingLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <m.span
                      key={displayPrice}
                      initial={{ y: 4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -4, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                    >
                      {plan.currencySymbol || '$'}
                      {displayPrice}
                    </m.span>
                  </AnimatePresence>
                  <span className="text-[13px] font-medium text-slate-400">/ Per Month</span>
                </>
              )}
            </div>

            {plan.oldPrice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  WAS
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 line-through">
                  {plan.currencySymbol || '$'}
                  {plan.oldPrice}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                  SAVE {Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)}%
                </span>
              </div>
            )}
          </div>

          <p className="text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mt-2 mb-4">
            {plan.description}
          </p>

          {/* Dot line divider */}
          <div className="flex items-center gap-1.5 my-4">
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
          </div>

          {/* Features checklist */}
          <div className="space-y-3 mb-6">
            {isPricingLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
                </div>
              ))
            ) : (
              <>
                {plan.features.map((feature, i) => (
                  <PricingFeature key={i} label={feature} unavailable={false} isPro={isPro} />
                ))}
                {plan.limitations?.map((lim, i) => (
                  <PricingFeature key={i} label={lim} unavailable={true} isPro={isPro} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onUpgrade(plan.tier)}
          disabled={isLoading || isPricingLoading || isActive}
          className={cn(
            'group/btn w-full h-[52px] rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 mt-auto cursor-pointer',
            isActive
              ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
              : isPro
                ? 'bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md shadow-slate-950/10 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200/90 dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 hover:border-slate-300/80 shadow-2xs hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          {isActive ? (
            <span>Current Plan</span>
          ) : (
            <>
              <span>
                {plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </m.div>
  );
}
