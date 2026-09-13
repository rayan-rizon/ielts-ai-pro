import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Gauge,
  Lock,
  LockKeyhole,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  WELL,
} from '@/features/dashboard/components/primitives';
import { LogoIcon } from '@/components/shared/Logo';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import {
  configurePricingPlans,
  loadPricingConfiguration,
} from '@/features/subscription/hooks/usePricing';
import { calculatePrice } from '@/lib/pricingUtils';
import { buildOnboardingPlanPreview } from './onboardingPlanPreview';

const ASSEMBLY_STEPS = [
  { icon: CalendarDays, shortLabel: 'Schedule', label: 'Fitting sessions to your week' },
  { icon: Target, shortLabel: 'Focus', label: 'Setting your first priority' },
  { icon: Gauge, shortLabel: 'Pace', label: 'Calibrating your target pace' },
];

function ReiconSparkle({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-3.5 w-3.5', className)}
      aria-hidden="true"
    >
      <path d="M 4.0333 7.4973 c 0.0907 0.272 0.3467 0.456 0.6333 0.456 s 0.5413 -0.184 0.6333 -0.456 l 0.5613 -1.684 1.684 -0.5613 c 0.272 -0.0907 0.456 -0.3453 0.456 -0.632 s -0.184 -0.5413 -0.456 -0.632 l -1.684 -0.5613 -0.5613 -1.684 c -0.1827 -0.544 -1.0827 -0.544 -1.2653 0 l -0.5613 1.684 -1.684 0.5613 c -0.272 0.0907 -0.456 0.3453 -0.456 0.632 s 0.184 0.5413 0.456 0.632 l 1.684 0.5613 0.5613 1.684 Z" />
      <path d="M 22.0333 11.7373 l -6.0467 -2.3907 -2.3907 -6.0467 c -0.3027 -0.7627 -1.5573 -0.7627 -1.86 0 l -2.3907 6.0467 -6.0467 2.3907 c -0.3813 0.1507 -0.6333 0.52 -0.6333 0.9293 s 0.2507 0.7787 0.6333 0.9293 l 6.0467 2.3907 2.3907 6.0467 c 0.1507 0.3813 0.52 0.632 0.9293 0.632 s 0.7787 -0.2507 0.9293 -0.632 l 2.3907 -6.0467 6.0467 -2.3907 c 0.3813 -0.1507 0.6333 -0.52 0.6333 -0.9293 s -0.2507 -0.7787 -0.6333 -0.9293 Z" />
    </svg>
  );
}

function ReiconCrown({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-3.5 w-3.5', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.8382 11.1263L21.609 13.5616C21.2313 17.5742 21.0425 19.5805 19.8599 20.7902C18.6773 22 16.9048 22 13.3599 22H10.6401C7.09517 22 5.32271 22 4.14009 20.7902C2.95748 19.5805 2.76865 17.5742 2.391 13.5616L2.16181 11.1263C1.9818 9.2137 1.8918 8.25739 2.21899 7.86207C2.39598 7.64823 2.63666 7.5172 2.89399 7.4946C3.36968 7.45282 3.96708 8.1329 5.16187 9.49307C5.77977 10.1965 6.08872 10.5482 6.43337 10.6027C6.62434 10.6328 6.81892 10.6018 6.99526 10.5131C7.31351 10.3529 7.5257 9.91812 7.95007 9.04852L10.1869 4.46486C10.9888 2.82162 11.3898 2 12 2C12.6102 2 13.0112 2.82162 13.8131 4.46485L16.0499 9.04851C16.4743 9.91812 16.6865 10.3529 17.0047 10.5131C17.1811 10.6018 17.3757 10.6328 17.5666 10.6027C17.9113 10.5482 18.2202 10.1965 18.8381 9.49307C20.0329 8.1329 20.6303 7.45282 21.106 7.4946C21.3633 7.5172 21.604 7.64823 21.781 7.86207C22.1082 8.25739 22.0182 9.2137 21.8382 11.1263ZM8.25 18C8.25 17.5858 8.58579 17.25 9 17.25H15C15.4142 17.25 15.75 17.5858 15.75 18C15.75 18.4142 15.4142 18.75 15 18.75H9C8.58579 18.75 8.25 18.4142 8.25 18Z"
      />
    </svg>
  );
}

const PLAN_OPTIONS = {
  pro: {
    name: 'Pro',
    icon: ReiconSparkle,
    period: '/mo',
    price: '$9.99',
    oldPrice: '$15',
    dailyPrice: '$0.33/day',
    saveBadge: 'SAVE 33%',
    description: 'Full adaptive roadmap & 100 AI evaluations',
    tone: 'accent',
  },
  premium: {
    name: 'Premium',
    icon: ReiconCrown,
    period: '/mo',
    price: '$15.99',
    oldPrice: '$25',
    dailyPrice: '$0.53/day',
    saveBadge: 'BEST VALUE',
    description: 'All Pro features + 2x limits & VIP feedback',
    tone: 'amber',
  },
};

/** Onboarding must never quote a different price than the pricing page. Both
 * read the same admin price book through the same regional resolution, so a
 * Bangladeshi learner sees the BDT price here too. Prices render only once the
 * real price book has resolved — a USD placeholder that later flips to BDT is
 * worse than a brief dash. */
function useOnboardingPlanPricing() {
  const [configuredPlans, setConfiguredPlans] = useState(null);

  useEffect(() => {
    let isActive = true;

    loadPricingConfiguration()
      .then((pricingConfig) => {
        if (isActive) {
          setConfiguredPlans(configurePricingPlans(DEFAULT_PRICING_PLANS, pricingConfig));
        }
      })
      .catch((error) => {
        console.error('Failed to load onboarding pricing:', error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return useMemo(() => {
    const pricing = {};
    Object.keys(PLAN_OPTIONS).forEach((tier) => {
      const plan = configuredPlans?.find((entry) => entry.tier === tier);
      if (!plan) {
        pricing[tier] = { price: null, oldPrice: null, dailyPrice: null };
        return;
      }
      const symbol = plan.currencySymbol || '$';
      pricing[tier] = {
        price: `${symbol}${calculatePrice(plan.basePrice, 'monthly')}`,
        oldPrice: plan.oldPrice ? `${symbol}${calculatePrice(plan.oldPrice, 'monthly')}` : null,
        dailyPrice: `${symbol}${formatDailyRate(plan.basePrice)}/day`,
      };
    });
    return pricing;
  }, [configuredPlans]);
}

/** Sub-unit currencies need the cents ($0.33/day); a 1,100 BDT plan reads as
 * a whole number instead of ৳36.67. */
function formatDailyRate(monthlyPrice) {
  const daily = Number(monthlyPrice) / 30;
  if (!Number.isFinite(daily)) return '0';
  return daily >= 10 ? String(Math.round(daily)) : daily.toFixed(2).replace(/\.00$/, '');
}

function PlanAssembly({ preview }) {
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(reduceMotion ? ASSEMBLY_STEPS.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, ASSEMBLY_STEPS.length - 1));
    }, 520);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const progress = ((activeStep + 1) / ASSEMBLY_STEPS.length) * 100;

  return (
    <div className="flex min-h-[250px] flex-col justify-center py-3 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5a63df]/12 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
        <Sparkles className="h-5 w-5 animate-pulse" />
      </div>
      <h2 className="mt-2 text-base font-black tracking-tight text-slate-900 text-balance dark:text-white">
        Building your Band {preview.targetBand.toFixed(1)} plan
      </h2>
      <p className={cn('mx-auto mt-0.5 max-w-sm text-[11.5px] font-medium text-pretty', MUTED)}>
        Matching {preview.weeklyMinutes} weekly minutes to your {preview.focusLabel} priority.
      </p>

      <div className={cn(WELL, 'mx-auto mt-3.5 w-full max-w-md rounded-xl p-2.5')}>
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {ASSEMBLY_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const complete = index <= activeStep;
            return (
              <div key={step.shortLabel} className="flex flex-col items-center gap-1">
                <m.span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-lg border text-xs',
                    complete
                      ? 'border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/12 dark:text-[#b8bdff]'
                      : 'border-[#dedbea] bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/3 dark:text-slate-600'
                  )}
                  animate={
                    reduceMotion || !complete ? undefined : { scale: [0.96, 1], opacity: [0.7, 1] }
                  }
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {complete ? (
                    <Check className="h-3.5 w-3.5 stroke-2.5" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                </m.span>
                <span
                  className={cn(
                    MICRO,
                    complete ? 'font-bold text-slate-800 dark:text-slate-200' : MUTED,
                    'text-[9.5px]'
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#dedbea] dark:bg-white/8">
          <m.div
            className="h-full rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
          />
        </div>
        <p
          role="status"
          aria-live="polite"
          className={cn('mt-2 text-[11px] font-semibold text-[#5a63df] dark:text-[#a9afff]')}
        >
          {ASSEMBLY_STEPS[activeStep].label}…
        </p>
      </div>
    </div>
  );
}

function LockedScheduleGrid({ preview }) {
  const daysHeader = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const studyDaysCount = Math.min(7, Math.max(1, preview.studyDays || 3));

  const gridCells = useMemo(() => {
    const cells = [];
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 7; d++) {
        const dayNumber = w * 7 + d + 1;
        const isMockDay = dayNumber === 14 || dayNumber === 28;
        const isStudyDay = !isMockDay && d < studyDaysCount;
        cells.push({ dayNumber, isMockDay, isStudyDay });
      }
    }
    return cells;
  }, [studyDaysCount]);

  return (
    <section
      className={cn(PANEL, 'flex flex-col justify-between overflow-hidden p-2.5 text-left')}
      aria-label="Your adaptive schedule"
    >
      {/* Header bar matching instrument panel theme */}
      <div className="flex items-center justify-between border-b border-[#e4e2f0] pb-1.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 shrink-0 text-[#5a63df] dark:text-[#8f97ff]" />
          <h3 className="text-[11px] font-black tracking-tight text-slate-900 dark:text-white">
            Your {preview.timelineLabel || '8-Week'} Plan
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-400">
          <LockKeyhole className="h-2 w-2" />
          Locked
        </span>
      </div>

      {/* 28-day schedule matrix with frosted glass blur overlay */}
      <div className="relative my-1 overflow-hidden rounded-md">
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysHeader.map((d, i) => (
            <span key={i} className={cn(MICRO, MUTED, 'text-[8px]')}>
              {d}
            </span>
          ))}
        </div>
        <div className="mt-0.5 grid grid-cols-7 gap-1">
          {gridCells.map(({ dayNumber, isMockDay, isStudyDay }) => {
            if (isMockDay) {
              return (
                <div
                  key={dayNumber}
                  className="flex h-4.5 flex-col items-center justify-center rounded border border-[#5a63df]/25 bg-[#5a63df]/12 text-[#5a63df] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/15 dark:text-[#b8bdff]"
                  title={`Day ${dayNumber}: Full Mock Test (Locked)`}
                >
                  <span className={cn(NUM, 'text-[7px] font-black leading-none')}>{dayNumber}</span>
                  <Lock className="mt-px h-1.5 w-1.5 opacity-70" />
                </div>
              );
            }
            if (isStudyDay) {
              return (
                <div
                  key={dayNumber}
                  className="flex h-4.5 flex-col items-center justify-center rounded border border-slate-200/70 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300"
                  title={`Day ${dayNumber}: AI Practice Drill (Locked)`}
                >
                  <span className={cn(NUM, 'text-[7px] font-bold leading-none')}>{dayNumber}</span>
                  <Lock className="mt-px h-1.5 w-1.5 opacity-60" />
                </div>
              );
            }
            return (
              <div
                key={dayNumber}
                className="flex h-4.5 items-center justify-center rounded bg-slate-50/50 text-slate-300 dark:bg-white/2 dark:text-slate-600"
                title={`Day ${dayNumber}: Rest Day`}
              >
                <span className={cn(NUM, 'text-[7px] font-medium leading-none')}>{dayNumber}</span>
              </div>
            );
          })}
        </div>

        {/* Subtle blur overlay with compact lock badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/55 backdrop-blur-[1.5px] dark:bg-[#100f15]/60">
          <div className="flex items-center gap-1.5 rounded-full border border-[#5a63df]/30 bg-white/95 px-2.5 py-0.5 shadow-2xs dark:border-white/10 dark:bg-[#16151f]/95">
            <LockKeyhole className="h-2.5 w-2.5 text-[#5a63df] dark:text-[#8f97ff]" />
            <span className="text-[9px] font-black text-slate-900 dark:text-white">
              Schedule Locked
            </span>
          </div>
          <span className="mt-0.5 text-[8px] font-bold text-[#5a63df] dark:text-[#8f97ff]">
            Unlocks with subscription
          </span>
        </div>
      </div>

      {/* Legend & Lock Notice */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-[#e4e2f0] pt-1 text-[9px] dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            Study ({studyDaysCount}d)
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
            Mock
          </span>
          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-white/20" />
            Rest
          </span>
        </div>
        <span className="text-[8.5px] font-bold text-[#5a63df] dark:text-[#8f97ff]">
          🔒 Unlocks with Pro
        </span>
      </div>
    </section>
  );
}

function BandScoreProjection({ preview }) {
  const targetBand = preview.targetBand;
  const selfStudyBand = Math.max(4.5, Number((targetBand - 1.5).toFixed(1)));

  return (
    <section
      className={cn(PANEL, 'flex flex-col justify-between p-2.5 text-left')}
      aria-label="Band score projection"
    >
      <div className="flex items-center justify-between gap-1 border-b border-[#e4e2f0] pb-1.5 dark:border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-[#5a63df] dark:text-[#8f97ff]" />
          <h3 className="text-[11px] font-black text-slate-900 dark:text-white">
            Band Score Projection
          </h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-[rgb(var(--signal-ok))/0.3] bg-[rgb(var(--signal-ok))/0.06] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[rgb(var(--signal-ok))] dark:border-[rgb(var(--signal-ok))/0.25] dark:bg-[rgb(var(--signal-ok))/0.10]">
          +1.5 Band Uplift
        </span>
      </div>

      <div className="my-1.5 space-y-2">
        {/* With IELTS AI Pro */}
        <div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
              <LogoIcon className="h-3 w-3 shrink-0" />
              With IELTS AI Pro
            </span>
            <span className={cn(NUM, 'font-black text-[#5a63df] dark:text-[#8f97ff]')}>
              Band {targetBand.toFixed(1)} 🎯
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#dedbea] dark:bg-white/10">
            <m.div
              className="h-full rounded-full bg-linear-to-r from-[#5a63df] to-[#7b83eb] dark:from-[#8f97ff] dark:to-[#5a63df]"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(96, (targetBand / 9.0) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Self-Study Alone */}
        <div>
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="font-medium text-slate-500 dark:text-slate-400">Self-study alone</span>
            <span className={cn(NUM, 'font-bold text-slate-400 dark:text-slate-500')}>
              Band {selfStudyBand.toFixed(1)} 📉
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
            <m.div
              className="h-full rounded-full bg-slate-300 dark:bg-slate-600"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(65, (selfStudyBand / 9.0) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Target Affirmation Row */}
      <div className="flex items-center gap-1.5 border-t border-[#e4e2f0] pt-1.5 text-[9.5px] font-semibold text-slate-600 dark:border-white/[0.07] dark:text-slate-300">
        <CheckCircle2 className="h-3 w-3 shrink-0 text-[rgb(var(--signal-ok))]" />
        <span className="truncate">Reach 100% of your target with IELTS AI Pro</span>
      </div>
    </section>
  );
}

function PlanOption({ tier, recommended, onSelect, pricing }) {
  const option = PLAN_OPTIONS[tier];
  const PlanIcon = option.icon;
  const isPro = tier === 'pro';
  const currentPrice = pricing?.price || option.price || '—';
  const previousPrice = pricing?.oldPrice || option.oldPrice;

  return (
    <article
      className={cn(
        'onboarding-plan-card relative flex min-w-0 flex-col justify-between rounded-xl transition-all duration-200',
        isPro
          ? 'onboarding-plan-card--pro onboarding-pro-card'
          : 'onboarding-plan-card--premium onboarding-premium-card'
      )}
    >
      <div className="onboarding-plan-card__beam" aria-hidden="true" />
      <div className="onboarding-plan-card__inner flex h-full flex-col justify-between p-2.5 sm:p-3 text-left">
        <div>
          {/* Header row: Plan Name + Reicon + Pill badge */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <IconChip icon={PlanIcon} tone={option.tone} size="sm" />
              <div>
                <h3 className="text-[13px] font-black leading-tight text-slate-900 dark:text-white">
                  {option.name}
                </h3>
                <p className={cn(MICRO, MUTED, 'text-[8.5px] leading-none')}>
                  {pricing?.dailyPrice || option.dailyPrice || '\u2014'}
                </p>
              </div>
            </div>
            {recommended ? (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider',
                  isPro
                    ? 'border-[#5a63df]/25 bg-[#5a63df]/6 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/10 dark:text-[#b8bdff]'
                    : 'border-amber-500/25 bg-amber-500/6 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300'
                )}
              >
                Best fit
              </span>
            ) : (
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-400">
                {option.saveBadge}
              </span>
            )}
          </div>

          {/* Pricing with previous price (strikethrough) and current price */}
          <div className="mt-2 flex items-baseline justify-between border-t border-[#e4e2f0] pt-1.5 dark:border-white/8">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span
                className={cn(
                  NUM,
                  'text-base sm:text-lg font-black text-slate-900 dark:text-white'
                )}
              >
                {currentPrice}
              </span>
              {previousPrice && (
                <span
                  className={cn(
                    NUM,
                    'text-[11px] font-semibold text-slate-400 line-through dark:text-slate-500'
                  )}
                >
                  {previousPrice}
                </span>
              )}
              <span className={cn(MICRO, MUTED, 'text-[9.5px]')}>
                {pricing?.period || option.period}
              </span>
            </div>
          </div>

          <p className="mt-1 text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-300">
            {option.description}
          </p>
        </div>

        {/* Compact action button */}
        <button
          type="button"
          onClick={() => onSelect(tier)}
          className={cn(
            'relative z-1 mt-2.5 inline-flex h-7.5 w-full items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-all duration-150 active:scale-[0.98]',
            recommended
              ? isPro
                ? 'bg-[#5a63df] text-white shadow-[0_2px_8px_-2px_rgba(90,99,223,0.3)] hover:bg-[#4a52c9]'
                : 'bg-amber-500 text-white shadow-[0_2px_8px_-2px_rgba(245,158,11,0.3)] hover:bg-amber-600'
              : 'border border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/3 dark:text-slate-200 dark:hover:border-white/20'
          )}
        >
          Choose {option.name}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

function ReadyPlan({ preview, hasPaidPlan, onUpgrade, onContinue, onOpenPlan, planPricing }) {
  const recommendedTier = preview.targetBand >= 8 ? 'premium' : 'pro';

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-2.5"
    >
      {/* Centered Step Header consistent with Steps 1-5 */}
      <header className="mb-2.5 sm:mb-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Your study plan is ready
          </h2>
          <span className="rounded-full border border-[rgb(var(--signal-ok))/0.3] bg-[rgb(var(--signal-ok))/0.06] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[rgb(var(--signal-ok))] dark:border-[rgb(var(--signal-ok))/0.25] dark:bg-[rgb(var(--signal-ok))/0.10]">
            Personalized
          </span>
        </div>
        <p className="mt-1 text-[11.5px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400">
          Target:{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            Band {preview.targetBand.toFixed(1)}
          </span>{' '}
          ·{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {preview.weeklyMinutes} min
          </span>
          /wk · Priority:{' '}
          <span className="font-semibold text-[#5a63df] dark:text-[#a9afff]">
            {preview.planItems[0].label}
          </span>
        </p>
      </header>

      {/* Side-by-side: Locked Schedule Grid (Left) + Band Score Projection (Right) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <LockedScheduleGrid preview={preview} />
        <BandScoreProjection preview={preview} />
      </div>

      {/* Subscription Paywall or Active Learner Gate */}
      {hasPaidPlan ? (
        <button
          type="button"
          onClick={onOpenPlan}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-5 text-xs font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] active:scale-[0.96]"
        >
          Open my AI Learning Path
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <section className="pt-0.5" aria-labelledby="unlock-plan-title">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <LockKeyhole className="h-3 w-3 text-[#5a63df] dark:text-[#8f97ff]" />
              <h3
                id="unlock-plan-title"
                className="text-[12px] font-black text-slate-900 dark:text-white"
              >
                Unlock your adaptive plan
              </h3>
            </div>
            <span className={cn(MICRO, MUTED, 'text-[9px] tracking-wider font-semibold uppercase')}>
              Cancel anytime
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {Object.keys(PLAN_OPTIONS).map((tier) => (
              <PlanOption
                key={tier}
                tier={tier}
                recommended={tier === recommendedTier}
                onSelect={onUpgrade}
                pricing={planPricing[tier]}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onContinue}
            className={cn(
              MICRO,
              'mt-2 inline-flex min-h-5 w-full items-center justify-center gap-1 rounded py-0.5 text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5a63df] dark:text-slate-400 dark:hover:text-white text-[10.5px] font-semibold'
            )}
          >
            Continue with free practice
            <ChevronRight className="h-3 w-3" />
          </button>
        </section>
      )}
    </m.div>
  );
}

export default function CompleteStep({
  formData,
  hasPaidPlan = false,
  onUpgrade,
  onContinue,
  onOpenPlan,
}) {
  const reduceMotion = useReducedMotion();
  const [isAssembling, setIsAssembling] = useState(true);
  const preview = useMemo(() => buildOnboardingPlanPreview(formData), [formData]);
  // Resolved while the assembly animation plays, so the cards land priced.
  const planPricing = useOnboardingPlanPricing();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsAssembling(false), reduceMotion ? 200 : 1750);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return isAssembling ? (
    <PlanAssembly preview={preview} />
  ) : (
    <ReadyPlan
      preview={preview}
      hasPaidPlan={hasPaidPlan}
      onUpgrade={onUpgrade}
      onContinue={onContinue}
      onOpenPlan={onOpenPlan}
      planPricing={planPricing}
    />
  );
}
