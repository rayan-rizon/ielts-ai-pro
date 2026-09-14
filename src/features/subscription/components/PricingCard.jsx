import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Check, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, PANEL, Pill } from '@/features/dashboard/components/primitives';

function PricingFeature({ label, unavailable }) {
  const isUnavailable = unavailable || label.startsWith('0 ');

  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
          isUnavailable
            ? 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600'
            : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
        )}
      >
        {isUnavailable ? (
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        ) : (
          <Check className="h-3 w-3 stroke-[2.8]" />
        )}
      </div>
      <span
        className={cn(
          'text-[13px] leading-snug',
          isUnavailable
            ? 'font-medium text-slate-400 line-through dark:text-slate-500'
            : 'font-bold text-slate-800 dark:text-slate-100'
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
      <Pill tone="accent">
        <Sparkles className="h-3 w-3" />
        Most popular
      </Pill>
    );
  }
  if (isPremium) {
    return (
      <Pill tone="accent">
        <Crown className="h-3 w-3" />
        Ultimate
      </Pill>
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
                className={cn(
                  NUM,
                  'text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl'
                )}
              >
                {symbol}
                {displayPrice}
              </m.span>
            </AnimatePresence>
            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              / month
            </span>
          </>
        )}
      </div>

      {plan.oldPrice && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Was</span>
          <span className={cn(NUM, 'text-xs font-bold text-slate-400 line-through')}>
            {symbol}
            {plan.oldPrice}
          </span>
          <Pill tone="accent">Save {discountPercent}%</Pill>
        </div>
      )}
    </div>
  );
}

function FeatureList({ plan, isPricingLoading }) {
  if (isPricingLoading) {
    return (
      <div className="mb-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
            <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {plan.features.map((feature, i) => (
        <PricingFeature key={i} label={feature} unavailable={false} />
      ))}
      {plan.limitations?.map((lim, i) => (
        <PricingFeature key={`lim-${i}`} label={lim} unavailable={true} />
      ))}
    </div>
  );
}

function ActionButton({ plan, isActive, isSubscribed, isLoading, isPricingLoading, onUpgrade }) {
  const isPro = plan.tier === 'pro';
  const buttonLabel =
    plan.tier !== 'free' && isSubscribed ? 'Switch to this plan' : plan.buttonText;

  return (
    <button
      type="button"
      onClick={() => onUpgrade(plan.tier)}
      disabled={isLoading || isPricingLoading || isActive}
      className={cn(
        'group mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold tracking-tight transition-all duration-200 ease-smooth-out disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border border-[#e2e5f2] bg-[#f4f3fb] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 cursor-default'
          : isPro
            ? 'cursor-pointer bg-[#5a63df] text-white hover:bg-[#4a52c9] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
            : 'cursor-pointer border border-[#e2e5f2] bg-white text-slate-700 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 hover:text-[#5a63df] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.99] dark:border-white/10 dark:bg-white/4 dark:text-slate-200 dark:hover:border-[#5a63df]/40 dark:hover:bg-white/10 dark:hover:text-white'
      )}
    >
      {isActive ? (
        <span>Current plan</span>
      ) : (
        <>
          <span>{buttonLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-smooth-out group-hover:translate-x-1" />
        </>
      )}
    </button>
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'h-full transition-transform duration-300 ease-smooth-out',
        isPro && 'lg:-translate-y-4'
      )}
    >
      <div
        className={cn(
          PANEL,
          'flex h-full w-full flex-col justify-between px-6 pb-6 pt-5 transition-all duration-200 ease-smooth-out hover:-translate-y-0.5 hover:shadow-md sm:px-7 sm:pb-7 sm:pt-6',
          isPro &&
            'border-[#5a63df]/40 ring-1 ring-[#5a63df]/20 dark:border-[#5a63df]/50 shadow-md shadow-[#5a63df]/5'
        )}
      >
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {plan.name}
            </h3>
            <CardHeaderBadge isPro={isPro} isPremium={isPremium} />
          </div>

          <PriceDisplay
            plan={plan}
            displayPrice={displayPrice}
            isPricingLoading={isPricingLoading}
          />

          <p className="mb-4 mt-2 text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {plan.description}
          </p>

          <div className="mb-4 h-px bg-[#eeedf7] dark:bg-white/[0.07]" />

          <FeatureList plan={plan} isPricingLoading={isPricingLoading} />
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
