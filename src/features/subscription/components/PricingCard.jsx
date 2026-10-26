import React from 'react';
import { m } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, NUM, PANEL, Pill } from '@/features/dashboard/components/primitives';
import { Crossfade, RollingPrice, SwapLine } from './pricingMotion';

// "60 AI Writing Evaluations/month" -> amount "60", text "AI Writing Evaluations", unit "month".
function parseFeature(label) {
  const match = label.match(/^(Unlimited|\d[\d,]*)\s+(.+?)(\/(?:day|month))?$/i);
  if (!match) return { amount: null, text: label, unit: null };
  return { amount: match[1], text: match[2], unit: match[3]?.slice(1).toLowerCase() || null };
}

function PricingFeature({ label, unavailable }) {
  const { amount, text, unit } = parseFeature(label);
  const isUnavailable = unavailable || amount === '0';
  const inherits = !isUnavailable && label.match(/^Everything in (.+)$/);

  if (inherits) {
    return (
      <li className="py-2 text-[12px] sm:py-2.5 font-semibold text-slate-500 dark:text-slate-400">
        Everything in{' '}
        <span className="font-extrabold text-slate-900 dark:text-white">{inherits[1]}</span>, plus
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2.5 py-2 sm:py-2.5">
      <span
        className={cn(
          'mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          isUnavailable
            ? 'text-slate-300 dark:text-slate-600'
            : 'bg-[#5a63df]/12 text-[#5a63df] dark:bg-[#5a63df]/25 dark:text-[#a9afff]'
        )}
      >
        {isUnavailable ? (
          <Minus className="h-3 w-3 stroke-[3]" aria-label="Not included" />
        ) : (
          <Check className="h-2.5 w-2.5 stroke-[3.5]" aria-hidden="true" />
        )}
      </span>
      <span
        className={cn(
          'text-[13px] leading-snug',
          isUnavailable
            ? 'font-medium text-slate-400 dark:text-slate-500'
            : 'font-medium text-slate-600 dark:text-slate-300'
        )}
      >
        {amount && !isUnavailable && (
          <span
            className={cn(
              'font-extrabold text-slate-900 dark:text-white',
              amount !== 'Unlimited' && NUM
            )}
          >
            {amount}{' '}
          </span>
        )}
        {text}
        {unit && <span className="text-slate-400 dark:text-slate-500"> a {unit}</span>}
      </span>
    </li>
  );
}

function CardHeaderBadge({ isPro }) {
  if (!isPro) return null;
  return (
    <Pill tone="accent">
      <Sparkles className="h-3 w-3" />
      Most popular
    </Pill>
  );
}

function PriceDisplay({ plan, displayPrice, priceNote, isPricingLoading }) {
  const symbol = plan.currencySymbol || '$';
  const discountPercent = plan.oldPrice
    ? Math.round((1 - Number(displayPrice) / plan.oldPrice) * 100)
    : 0;

  if (isPricingLoading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3.5 w-44" />
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1">
        <RollingPrice
          value={`${symbol}${displayPrice}`}
          className={cn(
            NUM,
            'text-[30px] font-extrabold leading-none text-slate-900 dark:text-white'
          )}
        />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ month</span>
      </div>

      {/* Always holds its line, so every card's button lines up. */}
      <SwapLine
        className={cn(NUM, 'pt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400')}
      >
        {priceNote}
      </SwapLine>
      {plan.oldPrice && (
        <p className="flex items-center gap-1.5 pt-1">
          <span className={cn(NUM, 'text-[11px] font-semibold text-slate-400 line-through')}>
            <span className="sr-only">Was </span>
            {symbol}
            {Number(plan.oldPrice).toLocaleString('en-US')}
          </span>
          <Pill tone="accent">
            <Crossfade>{`Save ${discountPercent}%`}</Crossfade>
          </Pill>
        </p>
      )}
    </div>
  );
}

function FeatureList({ plan, isPricingLoading }) {
  if (isPricingLoading) {
    return (
      <div className="divide-y divide-[#ebeaf5] dark:divide-white/[0.06]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2.5">
            <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            <Skeleton className={cn('h-3.5', i % 2 === 0 ? 'w-3/4' : 'w-1/2')} />
          </div>
        ))}
      </div>
    );
  }

  const limitations = plan.limitations || [];
  return (
    <>
      <ul
        className="divide-y divide-[#ebeaf5] dark:divide-white/[0.06]"
        aria-label={`${plan.name} includes`}
      >
        {plan.features.map((feature) => (
          <PricingFeature key={feature} label={feature} />
        ))}
      </ul>
      {limitations.length > 0 && (
        <div className="mt-3 border-t border-dashed border-[#dcdaee] pt-3 dark:border-white/[0.1]">
          <p className={cn(MICRO, 'mb-0.5 text-slate-400 dark:text-slate-500')}>Not included</p>
          <ul className="divide-y divide-[#ebeaf5] dark:divide-white/[0.06]">
            {limitations.map((lim) => (
              <PricingFeature key={lim} label={lim} unavailable />
            ))}
          </ul>
        </div>
      )}
    </>
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
        'flex h-11 w-full items-center justify-center whitespace-nowrap rounded-xl px-3 text-sm font-bold tracking-tight transition-[color,background-color,transform] duration-150 ease-smooth-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border border-[#e2e5f2] bg-[#f4f3fb] text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 cursor-default'
          : isPro
            ? 'cursor-pointer bg-[#5a63df] text-white hover:bg-[#4a52c9] active:scale-[0.97]'
            : 'cursor-pointer bg-[#eeedfb] text-[#4f57cd] hover:bg-[#e4e2f8] active:scale-[0.97] dark:bg-[#5a63df]/15 dark:text-[#b5baff] dark:hover:bg-[#5a63df]/25'
      )}
    >
      {isActive ? 'Current plan' : buttonLabel}
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

  return (
    <m.div variants={PRICING_CARD_VARIANTS} className="h-full">
      <div
        className={cn(
          PANEL,
          'relative flex h-full w-full flex-col overflow-hidden rounded-2xl transition-colors duration-200 ease-smooth-out',
          isPro
            ? 'border-[#5a63df] from-[#f7f6ff] to-white ring-1 ring-[#5a63df] dark:border-[#5a63df]/70 dark:from-[#17162a] dark:to-[#100f15] dark:ring-[#5a63df]/40'
            : 'hover:border-[#cfd0f5] dark:hover:border-white/15'
        )}
      >
        <div className="@container p-5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {plan.name}
            </h3>
            <CardHeaderBadge isPro={isPro} />
          </div>
          <p className="mt-1 text-[13px] font-medium leading-snug text-slate-500 dark:text-slate-400 md:min-h-[2.25rem]">
            {plan.description}
          </p>

          {/* Price and action share a row once the card is wide enough. */}
          <div className="mt-4 flex flex-col gap-3 @[22rem]:flex-row @[22rem]:items-start @[22rem]:gap-4">
            <PriceDisplay
              plan={plan}
              displayPrice={displayPrice}
              priceNote={priceNote}
              isPricingLoading={isPricingLoading}
            />
            <div className="@[22rem]:min-w-[9.5rem] @[22rem]:flex-1">
              <ActionButton
                plan={plan}
                isActive={isActive}
                isSubscribed={isSubscribed}
                isLoading={isLoading}
                isPricingLoading={isPricingLoading}
                onUpgrade={onUpgrade}
              />
            </div>
          </div>
        </div>

        {/* The spec sheet: an inset well, one hairline row per entitlement. */}
        <div
          className={cn(
            'flex-1 border-t px-5 pb-3 pt-1',
            isPro
              ? 'border-[#dcdcf7] bg-[#f3f2fd] dark:border-[#5a63df]/25 dark:bg-[#5a63df]/[0.06]'
              : 'border-[#ebeaf5] bg-[#f8f8fc] dark:border-white/[0.06] dark:bg-white/[0.02]'
          )}
        >
          <FeatureList plan={plan} isPricingLoading={isPricingLoading} />
        </div>
      </div>
    </m.div>
  );
}
