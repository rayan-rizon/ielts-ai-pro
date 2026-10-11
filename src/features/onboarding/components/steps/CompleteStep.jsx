import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Gauge, Target } from 'lucide-react';
import { addWeeks } from 'date-fns';
import { m, useReducedMotion } from 'framer-motion';
import OnboardingHeading from '../OnboardingHeading';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  WELL,
} from '@/features/dashboard/components/primitives';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import {
  configurePricingPlans,
  loadPricingConfiguration,
} from '@/features/subscription/hooks/usePricing';
import { getSignupOffer } from '@/features/subscription/services/signupOffer';
import { capturePromoCode, getPendingPromoCode } from '@/lib/promoOffer';
import {
  calculatePrice,
  calculateCheckoutAmount,
  EXAM_PASS_DISCOUNT_PERCENT,
  EXAM_PASS_MONTHS,
  formatExamPassCharge,
} from '@/lib/pricingUtils';
import { describeExamCoverage, getExamPlanContext } from '@/lib/examPlan';
import { buildOnboardingPlanPreview } from './onboardingPlanPreview';

const ASSEMBLY_STEPS = [
  { icon: CalendarDays, shortLabel: 'Schedule', label: 'Fitting sessions to your week' },
  { icon: Target, shortLabel: 'Focus', label: 'Setting your first priority' },
  { icon: Gauge, shortLabel: 'Pace', label: 'Calibrating your target pace' },
];
// Total assembly time; each check lands in turn inside it.
const ASSEMBLY_MS = 1750;

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
  pro: { name: 'Pro', icon: ReiconSparkle, extra: 'Adaptive AI Learning Path' },
  premium: { name: 'Premium', icon: ReiconCrown, extra: 'Band 8–9 vocabulary kits' },
};
const BILLING_INTERVALS = ['monthly', 'quarterly'];
// The few price-book lines that actually separate the tiers.
const FEATURE_PICK = /AI Writing Evaluation|AI Speaking Session|Practice Lab AI Test/;

/** Onboarding must never quote a different price than the pricing page. Both
 * read the same admin price book through the same regional resolution, so a
 * Bangladeshi learner sees the BDT price here too. Prices render only once the
 * real price book has resolved — a USD placeholder that later flips to BDT is
 * worse than a brief dash. Returns both plan lengths so the toggle never
 * waits on a fetch. */
function useOnboardingPlanPricing(offer) {
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
    const discount = offer
      ? { discount_type: 'percentage', discount_value: offer.discount_percent }
      : null;
    const byInterval = {};
    BILLING_INTERVALS.forEach((interval) => {
      const pricing = {};
      ['free', ...Object.keys(PLAN_OPTIONS)].forEach((tier) => {
        const plan = configuredPlans?.find((entry) => entry.tier === tier);
        if (!plan) {
          pricing[tier] = { price: null, oldPrice: null, note: null, features: [] };
          return;
        }
        const symbol = plan.currencySymbol || '$';
        const isPaid = tier !== 'free';
        const perMonth = calculatePrice(plan.basePrice, interval, discount, plan.currency);
        const regularMonthly = calculatePrice(plan.basePrice, 'monthly', null, plan.currency);
        // Struck-through figure: the regular monthly price whenever this card
        // undercuts it (offer or pass), else the price book's own "was".
        const undercut = isPaid && (offer || interval === 'quarterly');
        pricing[tier] = {
          price: `${symbol}${perMonth}`,
          oldPrice: undercut
            ? `${symbol}${regularMonthly}`
            : plan.oldPrice
              ? `${symbol}${calculatePrice(plan.oldPrice, 'monthly', null, plan.currency)}`
              : null,
          note: !isPaid
            ? 'Free forever'
            : interval === 'quarterly'
              ? formatExamPassCharge(plan, discount)
              : `${symbol}${formatDailyRate(calculateCheckoutAmount(plan.basePrice, 'monthly', discount, plan.currency))}/day`,
          features: plan.features.filter((feature) => FEATURE_PICK.test(feature)),
        };
      });
      byInterval[interval] = pricing;
    });
    return byInterval;
  }, [configuredPlans, offer]);
}

/** The exam date the learner just gave, in the shape /pricing reads from the
 * saved profile, so both default to the same plan length. */
function getOnboardingExamPlan(formData) {
  if (formData.timeline_type === 'specific' && formData.test_date) {
    return getExamPlanContext(formData.test_date, new Date(), 'confirmed');
  }
  if (formData.timeline_type === 'estimated' && formData.estimated_weeks) {
    return getExamPlanContext(
      addWeeks(new Date(), formData.estimated_weeks),
      new Date(),
      'estimated'
    );
  }
  return null;
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
  const [done, setDone] = useState(reduceMotion ? ASSEMBLY_STEPS.length : 0);
  useEffect(() => {
    if (reduceMotion) return undefined;
    const step = ASSEMBLY_MS / (ASSEMBLY_STEPS.length + 1);
    const timers = ASSEMBLY_STEPS.map((_, index) =>
      window.setTimeout(() => setDone(index + 1), step * (index + 1))
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);

  return (
    <div className="onboarding-assembly" role="status" aria-live="polite">
      <div className="onboarding-assembly-art" aria-hidden="true" data-rise style={{ '--i': 0 }}>
        <img src="/onboarding/welcome-orbits-v2.webp" width="960" height="960" alt="" />
        <div className={cn(PANEL, 'onboarding-assembly-calendar')}>
          <IconChip icon={CalendarDays} tone="accent" size="md" />
          <div className="onboarding-assembly-days">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className={index % 3 === 0 ? 'is-study-day' : ''}
                style={{ '--d': index }}
              >
                {index % 3 === 0 && <Check className="h-3 w-3" />}
              </span>
            ))}
          </div>
        </div>
      </div>
      <OnboardingHeading
        align="center"
        eyebrow="Putting your answers together"
        title={`Building your Band ${preview.targetBand.toFixed(1)} plan`}
        description={`Matching ${preview.weeklyMinutes} weekly minutes to your ${preview.focusLabel} priority.`}
      />
      <ol className="onboarding-assembly-steps">
        {ASSEMBLY_STEPS.map(({ label, icon: Icon }, index) => {
          const state = index < done ? 'is-done' : index === done ? 'is-active' : '';
          return (
            <li key={label} className={state} data-rise style={{ '--i': index + 3 }}>
              <span className="onboarding-assembly-steps__mark" aria-hidden="true">
                {index < done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <div className="onboarding-assembly-meter" aria-hidden="true">
        <span style={{ '--duration': `${ASSEMBLY_MS}ms` }} />
      </div>
    </div>
  );
}

function PlanOption({
  tier,
  pricing,
  onSelect,
  isFree = false,
  index = 0,
  currentTier = null,
  discountPercent = null,
}) {
  const option = isFree ? { name: 'Free', icon: null } : PLAN_OPTIONS[tier];
  const isCurrent = currentTier === tier;
  // A paid learner already has more than Free; that card is for comparison only.
  const isBelowCurrent = isFree && Boolean(currentTier) && currentTier !== 'free';
  const recommended = tier === 'pro' && !currentTier;
  const features = isFree
    ? ['Unlimited Reading & Listening tests', ...(pricing?.features || [])]
    : [...(pricing?.features || []), option.extra];
  const Icon = option.icon;
  return (
    <article
      className={cn(
        PANEL,
        'onboarding-plan',
        (recommended || isCurrent) && 'onboarding-plan--recommended'
      )}
      data-rise
      style={{ '--i': index + 7 }}
    >
      <div className="onboarding-plan__top">
        <h3 className="onboarding-plan__name">
          {Icon && <Icon className="onboarding-plan__icon" />}
          {option.name}
        </h3>
        {recommended && <span className="onboarding-plan__badge">Most popular</span>}
        {isCurrent && <span className="onboarding-plan__badge">Your plan</span>}
      </div>
      {pricing?.price ? (
        <>
          <div className="onboarding-plan__price">
            <span key={pricing.price} className={cn(NUM, 'onboarding-plan__amount')}>
              {pricing.price}
            </span>
            <span className="onboarding-plan__period">/ month</span>
            {discountPercent && (
              <span className={cn(NUM, 'onboarding-plan__discount')}>−{discountPercent}%</span>
            )}
          </div>
          <p className={cn(NUM, 'onboarding-plan__note')}>
            <span key={pricing.note} className="onboarding-swap">
              {pricing.note}
            </span>
            {pricing.oldPrice && <s className="onboarding-plan__was">{pricing.oldPrice}</s>}
          </p>
        </>
      ) : (
        // Same footprint as the price block, so the card doesn't jump when
        // the regional price book arrives.
        <div className="onboarding-plan__loading" role="status" aria-label="Loading price">
          <span />
          <span />
        </div>
      )}
      <ul className="onboarding-plan-features">
        {features.map((feature) => (
          <li key={feature}>
            <span className="onboarding-plan-features__check" aria-hidden="true">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {isCurrent || isBelowCurrent ? (
        <button
          type="button"
          disabled
          className="onboarding-primary onboarding-plan-current w-full"
        >
          {isCurrent ? 'Current plan' : 'Included in your plan'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSelect(tier)}
          className={cn('onboarding-primary w-full', !recommended && 'onboarding-plan-secondary')}
        >
          {isFree
            ? 'Continue with free practice'
            : currentTier
              ? `Switch to ${option.name}`
              : `Choose ${option.name}`}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

function IntervalToggle({ value, onChange }) {
  return (
    <div className="onboarding-interval" role="group" aria-label="Plan length">
      {BILLING_INTERVALS.map((interval) => {
        const active = value === interval;
        return (
          <button
            key={interval}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(interval)}
            className={cn('onboarding-interval__option', active && 'is-active')}
          >
            {active && (
              <m.span
                layoutId="onboarding-interval-thumb"
                className="onboarding-interval__thumb"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative">
              {interval === 'monthly' ? 'Monthly' : `${EXAM_PASS_MONTHS}-Month Pass`}
            </span>
            {interval === 'quarterly' && (
              <span className="onboarding-interval__save">Save {EXAM_PASS_DISCOUNT_PERCENT}%</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function splitRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Ticks once a second. When the offer lapses the parent drops it, so the
 * cards fall back to full price instead of quoting a dead discount. */
function OfferCountdown({ expiresAt, onExpire }) {
  const end = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());
  const remaining = end - now;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (remaining <= 0) onExpire?.();
  }, [remaining, onExpire]);

  const { days, hours, minutes, seconds } = splitRemaining(remaining);
  // Over a day out, seconds are noise; inside the last day they create the urgency.
  const units =
    days > 0
      ? [
          [days, 'd'],
          [hours, 'h'],
          [minutes, 'm'],
        ]
      : [
          [hours, 'h'],
          [minutes, 'm'],
          [seconds, 's'],
        ];
  return (
    <div className="onboarding-countdown" role="timer" aria-label="Offer ends in">
      <span className="onboarding-countdown__label">Ends in</span>
      <span className="onboarding-countdown__units">
        {units.map(([value, unit]) => (
          <span key={unit} className="onboarding-countdown__unit">
            <span className={NUM}>{String(value).padStart(2, '0')}</span>
            <small>{unit}</small>
          </span>
        ))}
      </span>
    </div>
  );
}

function ReadyPlan({
  preview,
  hasPaidPlan,
  currentTier,
  onUpgrade,
  onContinue,
  planPricing,
  onPlanOfferViewed,
  signupOffer,
  onOfferExpired,
  examPlan,
}) {
  const offerPercent = signupOffer?.discount_percent ?? 20;
  // The exam date picks the default, exactly as /pricing does.
  const [interval, setBillingInterval] = useState(examPlan?.recommendedInterval || 'monthly');
  const pricing = planPricing[interval];
  const coverage = describeExamCoverage(interval, examPlan);
  const pricesReady = Boolean(pricing.pro?.price && pricing.premium?.price);
  useEffect(() => {
    if (hasPaidPlan || !pricesReady) return;
    onPlanOfferViewed?.();
  }, [hasPaidPlan, onPlanOfferViewed, pricesReady]);

  return (
    <div className="onboarding-ready">
      <img
        className="onboarding-ready__art"
        src="/onboarding/study-plan-v1.webp"
        width="320"
        height="320"
        alt=""
        data-rise
        style={{ '--i': 0 }}
      />
      <OnboardingHeading
        align="center"
        className="onboarding-ready-heading"
        eyebrow="Made around your goals"
        title="Your study plan"
        accent="preview is ready"
        description="A starting structure for your journey. Your practice results will guide what comes next."
      />
      <dl className="onboarding-summary">
        {[
          { label: 'Target', value: `Band ${preview.targetBand.toFixed(1)}`, num: true },
          { label: 'Each week', value: `${preview.weeklyMinutes} min`, num: true },
          { label: 'First focus', value: preview.focusLabel },
          { label: 'Timeline', value: preview.timelineLabel },
        ].map((item, index) => (
          <div key={item.label} className={WELL} data-rise style={{ '--i': index + 3 }}>
            <dt className={cn(MICRO, MUTED)}>{item.label}</dt>
            <dd className={cn(item.num && NUM, 'onboarding-summary__value')}>{item.value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="unlock-plan-title">
        <div className="onboarding-plans__head" data-rise style={{ '--i': 5 }}>
          <h2 id="unlock-plan-title" className="onboarding-subheading">
            {hasPaidPlan ? 'Compare plans' : 'Choose how you’ll practice'}
          </h2>
          <IntervalToggle value={interval} onChange={setBillingInterval} />
          <p className="onboarding-plans__coverage">
            <span key={`${interval}-${coverage}`} className="onboarding-swap">
              {coverage ||
                (interval === 'quarterly'
                  ? `One payment · ${EXAM_PASS_MONTHS} months · no auto-renewal`
                  : 'Billed monthly · cancel anytime')}
            </span>
          </p>
        </div>
        {signupOffer && (
          <div className="onboarding-offer" data-rise style={{ '--i': 6 }}>
            <span className="onboarding-offer__percent" aria-hidden="true">
              <span className={NUM}>{offerPercent}%</span>
              <span>off</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="onboarding-offer__urgent">
                <span className="onboarding-offer__pulse" aria-hidden="true" />
                Limited time
              </p>
              <p className="onboarding-offer__title">Your personal {offerPercent}% signup offer</p>
              <p className="onboarding-offer__detail">
                Applied to the prices below, first payment only. Code{' '}
                <span className={cn(NUM, 'onboarding-offer__code')}>{signupOffer.code}</span>
              </p>
            </div>
            <OfferCountdown expiresAt={signupOffer.expires_at} onExpire={onOfferExpired} />
          </div>
        )}
        <div className="onboarding-plans">
          <PlanOption
            tier="free"
            isFree
            currentTier={currentTier}
            pricing={pricing.free}
            onSelect={onContinue}
          />
          <PlanOption
            tier="pro"
            index={1}
            currentTier={currentTier}
            discountPercent={signupOffer ? offerPercent : null}
            pricing={pricing.pro}
            onSelect={(tier) => onUpgrade(tier, interval)}
          />
          <PlanOption
            tier="premium"
            index={2}
            currentTier={currentTier}
            discountPercent={signupOffer ? offerPercent : null}
            pricing={pricing.premium}
            onSelect={(tier) => onUpgrade(tier, interval)}
          />
        </div>
        <p className={cn(MUTED, 'mt-4 text-center text-xs leading-relaxed')}>
          {interval === 'quarterly'
            ? `The ${EXAM_PASS_MONTHS}-Month Pass is a single payment and never renews. Review payment terms at checkout.`
            : 'Paid monthly subscriptions renew until cancelled. Review payment terms at checkout.'}
        </p>
        {hasPaidPlan && (
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={onContinue} className="onboarding-text-button">
              Go to my dashboard
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CompleteStep({
  formData,
  hasPaidPlan = false,
  currentTier = null,
  onUpgrade,
  onContinue,
  onPlanOfferViewed,
  loadSignupOffer = getSignupOffer,
}) {
  const reduceMotion = useReducedMotion();
  const [isAssembling, setIsAssembling] = useState(true);
  const preview = useMemo(() => buildOnboardingPlanPreview(formData), [formData]);
  // Resolved while the assembly animation plays, so the cards land priced.
  const [signupOffer, setSignupOffer] = useState(null);
  useEffect(() => {
    if (hasPaidPlan || getPendingPromoCode()) return;
    let active = true;
    loadSignupOffer()
      .then((offer) => {
        if (active) setSignupOffer(offer);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hasPaidPlan, loadSignupOffer]);
  const planPricing = useOnboardingPlanPricing(signupOffer);
  const clearExpiredOffer = useCallback(() => setSignupOffer(null), []);
  const examPlan = useMemo(() => getOnboardingExamPlan(formData), [formData]);
  const selectPlan = (tier, interval) => {
    if (signupOffer?.code) capturePromoCode(signupOffer.code);
    onUpgrade?.(tier, interval);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsAssembling(false), reduceMotion ? 200 : ASSEMBLY_MS);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return isAssembling ? (
    <PlanAssembly preview={preview} />
  ) : (
    <ReadyPlan
      preview={preview}
      hasPaidPlan={hasPaidPlan}
      currentTier={hasPaidPlan ? currentTier : null}
      onUpgrade={selectPlan}
      onContinue={onContinue}
      planPricing={planPricing}
      signupOffer={signupOffer}
      onOfferExpired={clearExpiredOffer}
      onPlanOfferViewed={onPlanOfferViewed}
      examPlan={examPlan}
    />
  );
}
