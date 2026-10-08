import React from 'react';
import { m } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Check, Crown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, NUM, PANEL, Pill } from '@/features/dashboard/components/primitives';
import { Crossfade, SwapLine } from './pricingMotion';

function PricingFeature({ label, unavailable }) {
  const isUnavailable = unavailable || label.startsWith('0 ');
  const isInheritance = !isUnavailable && /^Everything in /.test(label);

  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          'mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
          isUnavailable
            ? 'border border-dashed border-slate-300 text-slate-300 dark:border-white/15 dark:text-slate-600'
            : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
        )}
      >
        {isUnavailable ? (
          <Minus className="h-2.5 w-2.5 stroke-[3]" />
        ) : (
          <Check className="h-2.5 w-2.5 stroke-[3.5]" />
        )}
      </span>
      <span
        className={cn(
          'text-[13px] leading-snug',
          isUnavailable
            ? 'font-medium text-slate-400 dark:text-slate-500'
            : isInheritance
              ? 'font-extrabold text-slate-900 dark:text-white'
              : 'font-semibold text-slate-600 dark:text-slate-300'
        )}
      >
        {label}
      </span>
    </li>
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

function PriceDisplay({ plan, displayPrice, priceNote, isPricingLoading }) {
  const symbol = plan.currencySymbol || '$';
  const discountPercent = plan.oldPrice
    ? Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        {isPricingLoading ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <>
            <Crossfade
              className={cn(
                NUM,
                'text-[34px] font-extrabold leading-none text-slate-900 dark:text-white sm:text-[40px]'
              )}
            >
              {`${symbol}${displayPrice}`}
            </Crossfade>
            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              / month
            </span>
          </>
        )}
      </div>

      <div className="pt-1">
        <SwapLine className={cn(NUM, 'text-xs font-semibold text-slate-500 dark:text-slate-400')}>
          {isPricingLoading ? null : priceNote}
        </SwapLine>
      </div>

      {/* Always holds its row, so every card's button lines up. */}
      <div className="mt-1 flex h-5 items-center gap-2">
        {plan.oldPrice && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Was
            </span>
            <span className={cn(NUM, 'text-xs font-bold text-slate-400 line-through')}>
              {symbol}
              {plan.oldPrice}
            </span>
            <Pill tone="accent">Save {discountPercent}%</Pill>
          </>
        )}
      </div>
    </div>
  );
}

function FeatureList({ plan, isPricingLoading }) {
  if (isPricingLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-[18px] w-[18px] shrink-0 rounded-full" />
            <Skeleton className={cn('h-4', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          </div>
        ))}
      </div>
    );
  }

  const limitations = plan.limitations || [];
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(MICRO, 'mb-2.5 text-slate-400 dark:text-slate-500')}>What you get</p>
        <ul className="space-y-2.5">
          {plan.features.map((feature) => (
            <PricingFeature key={feature} label={feature} />
          ))}
        </ul>
      </div>
      {limitations.length > 0 && (
        <div className="border-t border-dashed border-[#e4e2f0] pt-3 dark:border-white/[0.08]">
          <p className={cn(MICRO, 'mb-2.5 text-slate-400 dark:text-slate-500')}>Not included</p>
          <ul className="space-y-2.5">
            {limitations.map((lim) => (
              <PricingFeature key={lim} label={lim} unavailable />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionButton({ plan, isActive, isSubscribed, isLoading, isPricingLoading, onUpgrade }) {
  const isPro = plan.tier === 'pro';
  const buttonLabel =
    plan.tier === 'free' && isSubscribed
      ? 'Move to Free'
      : plan.tier !== 'free' && isSubscribed
        ? 'Switch to this plan'
        : plan.buttonText;

  return (
    <button
      type="button"
      onClick={() => onUpgrade(plan.tier)}
      disabled={isLoading || isPricingLoading || isActive}
      className={cn(
        'group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-tight transition-all duration-200 ease-smooth-out disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border border-[#e2e5f2] bg-[#f4f3fb] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 cursor-default'
          : isPro
            ? 'cursor-pointer bg-[#5a63df] text-white hover:bg-[#4a52c9] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
            : 'cursor-pointer bg-[#eeedfb] text-[#4f57cd] hover:bg-[#e4e2f8] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] dark:bg-[#5a63df]/15 dark:text-[#b5baff] dark:hover:bg-[#5a63df]/25'
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

/** Rises in with the grid's stagger; the grid owns the timing. */
const PRICING_CARD_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

export default function PricingCard({
  plan,
  displayPrice,
  priceNote,
  isActive,
  isSubscribed,
  isLoading,
  isPricingLoading,
  onUpgrade,
}) {
  const isPro = plan.tier === 'pro';
  const isPremium = plan.tier === 'premium';

  return (
    <m.div variants={PRICING_CARD_VARIANTS} className="h-full">
      <div
        className={cn(
          PANEL,
          'relative flex h-full w-full flex-col overflow-hidden rounded-2xl px-6 pb-6 pt-6 transition-[transform,border-color] duration-200 ease-smooth-out hover:-translate-y-0.5 sm:px-7',
          isPro
            ? 'border-[#5a63df] from-[#f7f6ff] to-white ring-1 ring-inset ring-[#5a63df] dark:border-[#5a63df]/70 dark:from-[#17162a] dark:to-[#100f15] dark:ring-[#5a63df]/40'
            : 'hover:border-[#cfd0f5] dark:hover:border-white/15'
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[22px]">
            {plan.name}
          </h3>
          <CardHeaderBadge isPro={isPro} isPremium={isPremium} />
        </div>
        <p className="mb-5 min-h-[40px] text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {plan.description}
        </p>

        <PriceDisplay
          plan={plan}
          displayPrice={displayPrice}
          priceNote={priceNote}
          isPricingLoading={isPricingLoading}
        />

        <div className="mb-6 mt-5">
          <ActionButton
            plan={plan}
            isActive={isActive}
            isSubscribed={isSubscribed}
            isLoading={isLoading}
            isPricingLoading={isPricingLoading}
            onUpgrade={onUpgrade}
          />
        </div>

        <div className="mb-5 h-px bg-[#eeedf7] dark:bg-white/[0.07]" />

        <FeatureList plan={plan} isPricingLoading={isPricingLoading} />
      </div>
    </m.div>
  );
}
