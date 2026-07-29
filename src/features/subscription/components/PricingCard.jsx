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
            : 'bg-[#f2f0ff] border border-[#ded9ff] text-[#5e50ee] dark:bg-violet-950/60 dark:border-violet-500/30 dark:text-violet-300'
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
            : 'text-[#101836] dark:text-slate-200 font-extrabold'
        )}
      >
        {label}
      </span>
    </div>
  );
}

function CardHeaderBadge({ isPro, isPremium }) {
  if (isPro) {
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 border border-[#ded9ff] text-[#5e50ee] bg-[#f2f0ff]/95 dark:border-violet-500/30 dark:bg-violet-950/60 dark:text-violet-300 shrink-0 shadow-2xs">
        <Sparkles className="w-3 h-3 text-[#6256ef]" />
        Most Popular
      </span>
    );
  }
  if (isPremium) {
    return (
      <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 border border-[#ded9ff] text-[#5e50ee] bg-[#f2f0ff]/95 dark:border-violet-500/30 dark:bg-violet-950/60 dark:text-violet-300 shrink-0 shadow-2xs">
        <Crown className="w-3 h-3 text-[#6256ef]" />
        Ultimate
      </span>
    );
  }
  return null;
}

function PriceDisplay({ plan, displayPrice, isPricingLoading }) {
  const symbol = plan.currencySymbol || '$';
  const discountPercent = plan.oldPrice
    ? Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)
    : 0;

  return (
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
                className="text-3xl sm:text-4xl font-black text-[#101836] dark:text-white tracking-tight"
              >
                {symbol}
                {displayPrice}
              </m.span>
            </AnimatePresence>
            <span className="text-[13px] font-semibold text-[#66738c] dark:text-slate-400">
              / Per Month
            </span>
          </>
        )}
      </div>

      {plan.oldPrice && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-black text-[#737d9b] dark:text-slate-500 uppercase tracking-wider">
            WAS
          </span>
          <span className="text-xs font-bold text-[#8692b0] dark:text-slate-500 line-through">
            {symbol}
            {plan.oldPrice}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f2f0ff] text-[#5e50ee] border border-[#ded9ff] dark:bg-violet-950/80 dark:border-violet-500/30 dark:text-violet-300 text-[10px] font-black uppercase tracking-wider">
            SAVE {discountPercent}%
          </span>
        </div>
      )}
    </div>
  );
}

function FeatureList({ plan, isPro, isPricingLoading }) {
  if (isPricingLoading) {
    return (
      <div className="space-y-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {plan.features.map((feature, i) => (
        <PricingFeature key={i} label={feature} unavailable={false} isPro={isPro} />
      ))}
      {plan.limitations?.map((lim, i) => (
        <PricingFeature key={i} label={lim} unavailable={true} isPro={isPro} />
      ))}
    </div>
  );
}

function ActionButton({ plan, isActive, isSubscribed, isLoading, isPricingLoading, onUpgrade }) {
  const isPro = plan.tier === 'pro';
  const buttonLabel =
    plan.tier !== 'free' && isSubscribed ? 'Switch to this Plan' : plan.buttonText;

  const buttonStyle = isActive
    ? 'bg-[#f2f0ff] text-[#737d9b] dark:bg-slate-800 dark:text-slate-500 border border-[#ded9ff] dark:border-slate-700 cursor-not-allowed'
    : isPro
      ? 'bg-[#101836] hover:bg-[#1b264e] text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-md shadow-[#101836]/15 hover:scale-[1.01] active:scale-[0.99]'
      : 'bg-[#faf9ff] hover:bg-[#f2f0ff] text-[#101836] border border-[#ded9ff] dark:bg-slate-800/80 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 shadow-2xs hover:scale-[1.01] active:scale-[0.99]';

  return (
    <Button
      onClick={() => onUpgrade(plan.tier)}
      disabled={isLoading || isPricingLoading || isActive}
      className={cn(
        'group/btn w-full h-[52px] rounded-2xl text-[14px] font-black tracking-tight transition-all duration-200 flex items-center justify-center gap-2 mt-auto cursor-pointer',
        buttonStyle
      )}
    >
      {isActive ? (
        <span>Current Plan</span>
      ) : (
        <>
          <span>{buttonLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </>
      )}
    </Button>
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
            ? 'border border-[#ded9ff] dark:border-violet-500/35 bg-gradient-to-b from-white via-white to-[#faf9ff] dark:from-[#0c0f1d] dark:to-[#070914] shadow-[0_16px_48px_-16px_rgba(98,86,239,0.15),0_0_24px_-4px_rgba(98,86,239,0.08)] scale-100 lg:scale-[1.03] z-20'
            : 'border border-[#e2e5fa] dark:border-slate-800 shadow-[0_12px_32px_-16px_rgba(79,66,220,0.08)] mt-0 lg:mt-2 mb-0 lg:mb-2'
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {plan.name}
            </h3>
            <CardHeaderBadge isPro={isPro} isPremium={isPremium} />
          </div>

          <PriceDisplay
            plan={plan}
            displayPrice={displayPrice}
            isPricingLoading={isPricingLoading}
          />

          <p className="text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mt-2 mb-4">
            {plan.description}
          </p>

          <div className="flex items-center gap-1.5 my-4">
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          <FeatureList plan={plan} isPro={isPro} isPricingLoading={isPricingLoading} />
        </div>

        <ActionButton
          plan={plan}
          isActive={isActive}
          isSubscribed={isSubscribed}
          isLoading={isLoading}
          isPricingLoading={isPricingLoading}
          onUpgrade={onUpgrade}
        />
      </div>
    </m.div>
  );
}
