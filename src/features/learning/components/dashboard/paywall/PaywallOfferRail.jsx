import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FADE_UP, NUM, Pill, TierBadge } from '@/features/dashboard/components/primitives';
import { pricingDestination } from '@/features/subscription/utils/upgradePricing';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import PaywallJourney from './PaywallJourney';

const PLAN_NAMES = { pro: 'Pro', premium: 'Premium' };
const TIERS = Object.keys(PLAN_NAMES);

const READABLE_MUTED = 'text-slate-600 dark:text-slate-300';
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141319]';
const FINE_LINK =
  'rounded-sm font-bold text-[#4a52c9] no-underline transition-colors duration-150 hover:text-[#2f36a8] hover:no-underline dark:text-[#afb5ff] dark:hover:text-white ' +
  FOCUS_RING;

function formatDailyCost(price, symbol) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const perDay = numeric / 30;
  return `${symbol}${perDay >= 1 ? Math.round(perDay) : perDay.toFixed(2)}`;
}

function RadioDot({ active }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
        active ? 'border-[#5a63df] dark:border-[#8f97ff]' : 'border-[#c9c6e0] dark:border-white/25'
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full bg-[#5a63df] dark:bg-[#8f97ff] transition-[transform,opacity] duration-200 ease-smooth-out',
          active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}
      />
    </span>
  );
}

function PlanPrice({ data }) {
  const daily = formatDailyCost(data.price, data.symbol);
  return (
    <span className="relative z-10 shrink-0 whitespace-nowrap text-right">
      <span className="block">
        <span className={cn(NUM, 'text-lg font-extrabold text-slate-900 dark:text-white')}>
          {data.symbol}
          {data.price}
        </span>
        <span className={cn('text-[11px] font-semibold', READABLE_MUTED)}>/mo</span>
      </span>
      {daily && <span className={cn(NUM, 'block text-[11px]', READABLE_MUTED)}>~{daily}/day</span>}
    </span>
  );
}

function PlanOption({ tier, data, active, onSelect, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      onClick={() => onSelect(tier)}
      className={cn(
        'relative flex min-h-[68px] w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[transform,border-color,background-color] duration-150 ease-smooth-out active:scale-[0.98]',
        FOCUS_RING,
        active
          ? 'border-transparent'
          : 'border-[#dcdaf3] bg-white/75 hover:border-[#5a63df]/45 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25'
      )}
    >
      {/* One selection ring that travels between the two plans. */}
      {active && (
        <m.span
          layoutId="paywall-tier-plate"
          transition={{ type: 'spring', duration: 0.42, bounce: 0.16 }}
          aria-hidden="true"
          className="absolute -inset-px rounded-xl border-[1.5px] border-[#5a63df] bg-linear-to-r from-white to-[#eeedff] dark:border-[#8f97ff] dark:from-[#26264d] dark:to-[#2d2c63]"
        />
      )}

      <span className="relative z-10">
        <RadioDot active={active} />
      </span>

      <span className="relative z-10 min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            {PLAN_NAMES[tier]}
          </span>
          {tier === 'pro' && <Pill tone="accent">Recommended</Pill>}
        </span>
        <span className={cn('mt-0.5 block text-xs', READABLE_MUTED)}>
          {data.writingLimit} Writing · {data.speakingLimit} Speaking
        </span>
      </span>

      <PlanPrice data={data} />
    </button>
  );
}

function PlanPicker({ selectedTier, onSelect, plans }) {
  const buttons = useRef({});

  const handleKeyDown = (event) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = TIERS.find((tier) => tier !== selectedTier);
    onSelect(next);
    buttons.current[next]?.focus();
  };

  return (
    <div
      className="space-y-2.5"
      role="radiogroup"
      aria-label="Choose a subscription plan"
      onKeyDown={handleKeyDown}
    >
      {TIERS.map((tier) => (
        <PlanOption
          key={tier}
          tier={tier}
          data={plans[tier]}
          active={selectedTier === tier}
          onSelect={onSelect}
          buttonRef={(node) => {
            buttons.current[tier] = node;
          }}
        />
      ))}
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading regional pricing">
      {TIERS.map((tier) => (
        <div key={tier} className="h-[68px] animate-pulse rounded-xl bg-white/70 dark:bg-white/5" />
      ))}
    </div>
  );
}

function CheckoutButton({ to, label }) {
  return (
    <Link
      to={to}
      className={cn(
        'paywall-cta group relative inline-flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-[#5a63df] to-[#6c5fd9] px-4 py-2.5 text-center text-[13px] font-extrabold text-white transition-[transform,filter] duration-150 ease-smooth-out hover:brightness-95 active:scale-[0.97]',
        FOCUS_RING
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={label}
          initial={{ opacity: 0, filter: 'blur(3px)', transform: 'translateY(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }}
          exit={{ opacity: 0, filter: 'blur(3px)', transform: 'translateY(-6px)' }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          {label}
        </m.span>
      </AnimatePresence>
      <ArrowRight
        className="h-4 w-4 shrink-0 transition-transform duration-200 ease-smooth-out group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function PaywallOfferRail({
  search,
  examDateLabel,
  selectedTier,
  onSelectTier,
  proData,
  premiumData,
  isLoading,
}) {
  const plans = { pro: proData, premium: premiumData };
  const selectedData = plans[selectedTier] ?? proData;
  const planName = PLAN_NAMES[selectedTier] ?? PLAN_NAMES.pro;
  const ctaLabel = isLoading
    ? `Continue with ${planName}`
    : `Continue with ${planName} · ${selectedData.symbol}${selectedData.price}/mo`;

  return (
    // Sticks beside the preview instead of stretching to its height, so the
    // price and button stay together and in view while the learner scrolls.
    <m.aside
      variants={FADE_UP}
      className="lg:sticky lg:top-3 lg:self-start"
      aria-label="Unlock study plan"
    >
      {/* Same animated hairline card as the dashboard's NextUpPanel. */}
      <div className="dashboard-ai-card">
        <div className="dashboard-ai-card__beam" aria-hidden="true" />

        <div className="dashboard-ai-card__inner paywall-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3.5 w-[3px] shrink-0 rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
                aria-hidden="true"
              />
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Unlock your Study Plan
              </h2>
              <Sparkles
                className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-[#8f97ff]"
                aria-hidden="true"
              />
            </div>
            <TierBadge tier={selectedTier} />
          </div>
          <p className={cn('mt-1.5 text-xs leading-relaxed', READABLE_MUTED)}>
            A daily schedule calibrated to your exam date.
          </p>

          <div className="mt-5">
            <PaywallJourney examDateLabel={examDateLabel} />
          </div>

          <div className="mt-5">
            {isLoading ? (
              <PricingSkeleton />
            ) : (
              <PlanPicker selectedTier={selectedTier} onSelect={onSelectTier} plans={plans} />
            )}
          </div>

          <div className="mt-4 border-t border-[#5a63df]/15 pt-4 dark:border-white/[0.07]">
            <CheckoutButton to={pricingDestination(search, selectedTier)} label={ctaLabel} />

            <div
              className={cn('mt-3 flex items-center justify-between gap-3 text-xs', READABLE_MUTED)}
            >
              <span>Cancel anytime</span>
              <Link to={createPageUrl('Pricing')} className={FINE_LINK}>
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </m.aside>
  );
}
