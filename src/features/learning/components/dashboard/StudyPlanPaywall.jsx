import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import {
  AiBadge,
  FADE_UP,
  MUTED,
  STAGGER_CONTAINER,
} from '@/features/dashboard/components/primitives';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import {
  detectIsBangladesh,
  resolvePlanConfig,
} from '@/features/subscription/utils/upgradePricing';
import { cn } from '@/lib/cn';
import {
  LiveRescheduleCard,
  PaywallStatsStrip,
  SkillBridgeAndPhasesRow,
} from './paywall/PaywallPreviewGrid';
import PaywallOfferRail from './paywall/PaywallOfferRail';

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

/**
 * Interactive Study Plan Paywall (Option C · Visual 2)
 *
 * Mirrors the full StudyPlanDashboard instrument-panel density and staggered
 * Framer Motion choreography while showcasing live auto-rescheduling, 4-skill
 * target bridges, and a transparent 7-day risk-free guarantee.
 */
export default function StudyPlanPaywall({ user }) {
  const { search } = useLocation();
  const reduceMotion = useReducedMotion();
  const [selectedTier, setSelectedTier] = useState('pro');
  const [skipWed, setSkipWed] = useState(false);
  const { plans, pricingConfig, pricingCountry, isLoading } = usePricing(DEFAULT_PRICING_PLANS);

  const isBD = detectIsBangladesh(pricingCountry, pricingConfig);
  const proData = resolvePlanConfig('pro', plans, pricingConfig, isBD);
  const premiumData = resolvePlanConfig('premium', plans, pricingConfig, isBD);
  const exam = useMemo(() => computeExamContext(user), [user]);

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      className="space-y-3"
    >
      {/* Page Header matching StudyPlanDashboard */}
      <m.header
        variants={FADE_UP}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Study plan
            </h1>
            <AiBadge active />
          </div>
          <p className={cn('mt-1 max-w-2xl text-xs font-medium', MUTED)}>
            How your plan bridges to Band {exam.targetLabel} — built from your recent scores, exam
            date, and free time.
          </p>
        </div>

        {exam.dateLabel && (
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', MUTED)}>
              <Calendar
                className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]"
                aria-hidden="true"
              />
              {exam.dateLabel} ({exam.daysLeft}d)
            </span>
          </div>
        )}
      </m.header>

      {/* Top KPI Strip */}
      <PaywallStatsStrip exam={exam} skipWed={skipWed} />

      {/* Main 12-Column Instrument Grid matching StudyPlanDashboard */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 flex min-w-0 flex-col gap-3 lg:order-1">
          <LiveRescheduleCard
            exam={exam}
            skipWed={skipWed}
            onToggleSkipWed={() => setSkipWed((prev) => !prev)}
          />
          <SkillBridgeAndPhasesRow />
        </div>

        <PaywallOfferRail
          search={search}
          examDateLabel={exam.dateLabel}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          proData={proData}
          premiumData={premiumData}
          isLoading={isLoading}
        />
      </div>
    </m.div>
  );
}
