import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, Calendar, Lock, RotateCcw } from 'lucide-react';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  Ring,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import {
  detectIsBangladesh,
  pricingDestination,
  resolvePlanConfig,
} from '@/features/subscription/utils/upgradePricing';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';

const BASE_SCHEDULE = [
  { id: 'mon', day: 'MON', task: 'T/F/NG', minutes: 25, active: true },
  { id: 'tue', day: 'TUE', task: 'Task 2', minutes: 35 },
  { id: 'wed', day: 'WED', task: 'Speak P2', minutes: 25 },
  { id: 'thu', day: 'THU', task: 'Listen S2', minutes: 30 },
  { id: 'fri', day: 'FRI', task: 'Headings', minutes: 30 },
  { id: 'sat', day: 'SAT', task: 'Task 1', minutes: 40 },
  { id: 'sun', day: 'SUN', task: 'Review', minutes: 30 },
];

const REBALANCED_OVERRIDES = {
  wed: { task: 'Speak P2', minutes: 0, skipped: true },
  thu: { task: 'Listen + P2', minutes: 42, shifted: true },
  fri: { task: 'Headings+', minutes: 43, shifted: true },
};

const MILESTONES = [
  {
    step: '1',
    title: 'Today · Full Roadmap Unlocks',
    getBody: (pro) =>
      `Get every day scheduled around your exam date + ${pro.writingLimit} AI Writing & ${pro.speakingLimit} Speaking evaluations/month.`,
    variant: 'solid',
  },
  {
    step: '3',
    title: 'Day 3 · First Band Delta Check',
    getBody: () =>
      'Your schedule adapts automatically as your Reading, Writing, Listening & Speaking scores come in.',
    variant: 'ring',
  },
  {
    step: '7',
    title: 'Day 7 · Keep or 100% Refund',
    getBody: () =>
      'Not seeing clearer structure? Request a 7-day money-back refund on your first subscription or cancel anytime.',
    variant: 'muted',
  },
];

function computeExamContext(user) {
  const targetBand = Number(user?.target_band_score);
  const targetLabel = Number.isFinite(targetBand) && targetBand > 0 ? targetBand.toFixed(1) : '7.5';

  const rawDate = user?.test_date ? String(user.test_date).slice(0, 10) : '';
  if (rawDate) {
    const parsed = new Date(`${rawDate}T12:00:00`);
    const msLeft = parsed.getTime() - Date.now();
    if (Number.isFinite(parsed.getTime()) && msLeft > 0) {
      const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const dateLabel = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(parsed);
      return { targetLabel, daysLeft, dateLabel };
    }
  }
  return { targetLabel, daysLeft: null, dateLabel: null };
}

function formatDailyCost(price, symbol) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const perDay = numeric / 30;
  return perDay >= 1 ? `${symbol}${Math.round(perDay)}/day` : `${symbol}${perDay.toFixed(2)}/day`;
}

function ScheduleSlot({ slot }) {
  const slotStyle = slot.skipped
    ? 'border-[rgb(var(--signal-fault)/0.35)] bg-[rgb(var(--signal-fault)/0.07)]'
    : slot.shifted
      ? 'border-[#5a63df]/45 bg-[#5a63df]/[0.08] dark:border-[#8f97ff]/45 dark:bg-[#5a63df]/18'
      : slot.active
        ? 'border-[#5a63df] bg-[#5a63df]/10 dark:border-[#8f97ff] dark:bg-[#5a63df]/20'
        : WELL;

  return (
    <div
      className={cn(
        'rounded-lg border p-2 text-center transition-[border-color,background-color] duration-150',
        !slot.active && !slot.shifted && !slot.skipped && 'border-transparent',
        slotStyle
      )}
    >
      <p
        className={cn(
          MICRO,
          slot.skipped
            ? 'text-[rgb(var(--signal-fault))]'
            : slot.active || slot.shifted
              ? 'text-[#5a63df] dark:text-[#afb5ff]'
              : MUTED
        )}
      >
        {slot.day}
      </p>
      <p
        className={cn(
          'mt-1 truncate text-[10px] font-bold',
          slot.skipped
            ? 'text-slate-400 line-through dark:text-slate-500'
            : 'text-slate-800 dark:text-slate-100'
        )}
      >
        {slot.task}
      </p>
      <p
        className={cn(
          NUM,
          'mt-0.5 text-[9px] font-semibold',
          slot.skipped
            ? 'text-[rgb(var(--signal-fault))]'
            : slot.shifted
              ? 'text-[#5a63df] dark:text-[#afb5ff]'
              : MUTED
        )}
      >
        {slot.skipped ? 'Skipped' : `${slot.minutes}m`}
      </p>
    </div>
  );
}

function ReschedulePreviewColumn({ exam }) {
  const [skipWed, setSkipWed] = useState(false);

  const schedule = useMemo(
    () =>
      BASE_SCHEDULE.map((slot) =>
        skipWed && REBALANCED_OVERRIDES[slot.id]
          ? { ...slot, ...REBALANCED_OVERRIDES[slot.id] }
          : slot
      ),
    [skipWed]
  );

  return (
    <section
      className={cn(PANEL, 'flex flex-col justify-between p-4 sm:p-5 lg:col-span-7')}
      aria-label="Interactive study plan preview"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceafa] pb-3 dark:border-white/[0.07]">
          <div>
            <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
              PERSONAL BAND ROADMAP · INTERACTIVE PREVIEW
            </span>
            <h1 className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How your plan bridges to Band{' '}
              <span className={cn(NUM, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                {exam.targetLabel}
              </span>
            </h1>
          </div>
          <Pill tone="accent">
            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
            Sample Preview
          </Pill>
        </div>

        {/* Readiness Ring + Live Reschedule Simulation Trigger */}
        <div
          className={cn(
            TILE,
            'mt-4 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4'
          )}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <Ring value={68} size={64} stroke={6} label="68%" />
            <div className="min-w-0">
              <p className={cn(MICRO, MUTED)}>EXAM READINESS PREVIEW</p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                {exam.daysLeft ? (
                  <>
                    <span className={NUM}>{exam.daysLeft}</span> days left to reach Band{' '}
                    <span className={cn(NUM, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                      {exam.targetLabel}
                    </span>
                  </>
                ) : (
                  <>
                    Built around your Band{' '}
                    <span className={cn(NUM, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                      {exam.targetLabel}
                    </span>{' '}
                    goal
                  </>
                )}
              </p>
              <p className={cn('mt-0.5 text-[11px]', MUTED)}>
                Busy on a weekday? Test how the schedule rebalances automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={skipWed}
            onClick={() => setSkipWed((prev) => !prev)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-[transform,background-color,border-color,color] duration-150 ease-smooth-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
              skipWed
                ? 'border-[#5a63df] bg-[#5a63df] text-white'
                : 'border-[#5a63df]/35 bg-[#5a63df]/10 text-[#5a63df] hover:border-[#5a63df]/60 dark:border-[#8f97ff]/35 dark:bg-[#5a63df]/20 dark:text-[#b8bdff]'
            )}
          >
            {skipWed ? (
              <>
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Reset Wed
              </>
            ) : (
              'Simulate: Skip Wed →'
            )}
          </button>
        </div>

        {/* 7-Day Responsive Grid */}
        <div className={cn(TILE, 'mt-3 p-3.5')}>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className={cn(MICRO, MUTED)}>ADAPTIVE 7-DAY SCHEDULE</span>
            <span
              className={cn(
                'text-[11px] font-bold',
                skipWed ? 'text-[#5a63df] dark:text-[#afb5ff]' : 'text-[rgb(var(--signal-ok))]'
              )}
            >
              {skipWed ? 'Rebalanced! Wed shifted to Thu & Fri' : 'Balanced · 45 min/day'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-7">
            {schedule.map((slot) => (
              <ScheduleSlot key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eceafa] pt-3 text-[11px] dark:border-white/[0.07]">
        <span className={cn('inline-flex items-center gap-1.5', MUTED)}>
          <Calendar className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]" aria-hidden="true" />
          {exam.dateLabel ? (
            <>
              Exam target:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {exam.dateLabel} ({exam.daysLeft} days)
              </strong>
            </>
          ) : (
            'Set your exact exam date & weekly hours anytime'
          )}
        </span>
        <span className={MUTED}>
          Calibrated to official Cambridge, British Council & IDP rubrics
        </span>
      </div>
    </section>
  );
}

function RiskFreeTimeline({ proData }) {
  return (
    <div className="mt-4">
      {MILESTONES.map((item, idx) => {
        const isLast = idx === MILESTONES.length - 1;
        const badgeStyle =
          item.variant === 'solid'
            ? 'bg-[#5a63df] text-white'
            : item.variant === 'ring'
              ? 'border-2 border-[#5a63df] bg-white text-[#5a63df] dark:bg-[#141319] dark:text-[#afb5ff]'
              : 'border border-[#e4e2f0] bg-white text-slate-600 dark:border-white/15 dark:bg-[#141319] dark:text-slate-300';

        return (
          <div key={item.step} className={cn('relative flex gap-3', !isLast && 'pb-4')}>
            {!isLast && (
              <div
                aria-hidden="true"
                className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-[#5a63df]/25 dark:bg-[#8f97ff]/25"
              />
            )}
            <div
              className={cn(
                NUM,
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                badgeStyle
              )}
            >
              {item.step}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</p>
              <p className={cn('mt-0.5 text-[11px] leading-relaxed', MUTED)}>
                {item.getBody(proData)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TierSelector({ selectedTier, onSelect, proData, premiumData }) {
  const rows = [
    {
      tier: 'pro',
      title: 'Pro Plan',
      badge: 'Recommended',
      summary: `${proData.writingLimit} Writing · ${proData.speakingLimit} Speaking · Adaptive Plan`,
      data: proData,
    },
    {
      tier: 'premium',
      title: 'Premium Plan',
      badge: null,
      summary: `${premiumData.writingLimit} Writing · ${premiumData.speakingLimit} Speaking · Live Auto-Adjust`,
      data: premiumData,
    },
  ];

  return (
    <div className="mt-5 space-y-2" role="radiogroup" aria-label="Choose a subscription plan">
      {rows.map((row) => {
        const active = selectedTier === row.tier;
        const daily = formatDailyCost(row.data.price, row.data.symbol);
        return (
          <button
            key={row.tier}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(row.tier)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition-[transform,border-color,background-color] duration-150 ease-smooth-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
              active
                ? 'border-2 border-[#5a63df] bg-[#5a63df]/[0.05] dark:border-[#8f97ff] dark:bg-[#5a63df]/16'
                : 'border border-[#e4e2f0] bg-white hover:border-[#5a63df]/40 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {row.title}
                </span>
                {row.badge && (
                  <span className="rounded bg-[#5a63df] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    {row.badge}
                  </span>
                )}
              </div>
              <p className={cn('mt-0.5 truncate text-[11px]', MUTED)}>{row.summary}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className={cn(NUM, 'text-sm font-extrabold text-slate-900 dark:text-white')}>
                {row.data.symbol}
                {row.data.price}
                <span className={cn('font-sans text-[10px] font-medium', MUTED)}>/mo</span>
              </p>
              {daily && <p className={cn(NUM, 'text-[10px]', MUTED)}>~{daily}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Interactive Study Plan Paywall (Option C · Visual 2)
 *
 * Replaces the generic redirect with a live Readiness + Auto-Reschedule preview
 * alongside a transparent 7-day money-back timeline and direct Pro/Premium selector.
 */
export default function StudyPlanPaywall({ user }) {
  const { search } = useLocation();
  const reduceMotion = useReducedMotion();
  const [selectedTier, setSelectedTier] = useState('pro');
  const { plans, pricingConfig, pricingCountry, isLoading } = usePricing(DEFAULT_PRICING_PLANS);

  const isBD = detectIsBangladesh(pricingCountry, pricingConfig);
  const proData = resolvePlanConfig('pro', plans, pricingConfig, isBD);
  const premiumData = resolvePlanConfig('premium', plans, pricingConfig, isBD);
  const selectedData = selectedTier === 'premium' ? premiumData : proData;
  const exam = useMemo(() => computeExamContext(user), [user]);

  const ctaLabel =
    selectedTier === 'premium'
      ? `Unlock Premium Auto-Adjust Plan · ${selectedData.symbol}${selectedData.price}/mo`
      : `Unlock My Band ${exam.targetLabel} Plan · ${selectedData.symbol}${selectedData.price}/mo`;

  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <ReschedulePreviewColumn exam={exam} />

        <aside
          className={cn(
            PANEL,
            'flex flex-col justify-between border-[#5a63df]/35 p-4 sm:p-5 lg:col-span-5 dark:border-[#8f97ff]/30'
          )}
          aria-label="Unlock study plan"
        >
          <div>
            <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
              RISK-FREE GUARANTEE · HOW IT WORKS
            </span>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Try your full Study Plan for 7 days risk-free
            </h2>

            <RiskFreeTimeline proData={proData} />

            {isLoading ? (
              <div className="mt-5 space-y-2" aria-label="Loading regional pricing">
                <div className="h-14 animate-pulse rounded-xl bg-[#f4f3fb] dark:bg-white/5" />
                <div className="h-14 animate-pulse rounded-xl bg-[#f4f3fb] dark:bg-white/5" />
              </div>
            ) : (
              <TierSelector
                selectedTier={selectedTier}
                onSelect={setSelectedTier}
                proData={proData}
                premiumData={premiumData}
              />
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-[#eceafa] pt-3.5 dark:border-white/[0.07]">
            <Link
              to={pricingDestination(search, selectedTier)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5a63df] px-4 text-xs font-extrabold text-white transition-[transform,background-color] duration-150 ease-smooth-out hover:bg-[#4a52c9] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2"
            >
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <div className="text-center">
              <Link
                to={createPageUrl('Pricing')}
                className={cn(
                  'inline-flex items-center justify-center py-1 text-[11px] font-semibold transition-colors hover:text-[#5a63df] dark:hover:text-[#afb5ff]',
                  MUTED
                )}
              >
                Compare all plans on Pricing page
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </m.div>
  );
}
