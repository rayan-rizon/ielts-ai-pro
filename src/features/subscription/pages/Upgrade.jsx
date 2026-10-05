import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { usePricing } from '@/features/subscription/hooks/usePricing';

const CAPABILITIES = [
  {
    icon: Award,
    tone: 'accent',
    badge: 'EXAMINER-GRADE',
    badgeTone: 'accent',
    title: 'Examiner-Grade Evaluations',
    description:
      'Detailed band breakdowns across all 4 official IELTS criteria: TR/TA, CC, LR, and GRA with sentence-level revisions.',
    highlights: [
      'Detailed Writing Task 1 & Task 2 evaluations',
      'Real-time Speaking mock scoring & fluency feedback',
      'Band 0–9 criterion scoring & examiner coaching tips',
    ],
  },
  {
    icon: Target,
    tone: 'rose',
    badge: 'ERROR ISOLATION',
    badgeTone: 'rose',
    title: 'Weak-Spot Diagnostic Radar',
    description:
      'Pinpoint exactly which IELTS task types and question patterns cost you marks across mock attempts.',
    highlights: [
      'Question-by-question error classification',
      'Format-by-format mark loss ranking across sections',
      'Targeted weakness drill-down recommendations',
    ],
  },
  {
    icon: Compass,
    tone: 'sky',
    badge: 'ADAPTIVE PACING',
    badgeTone: 'sky',
    title: 'Adaptive Study Roadmap',
    description:
      'A structured study sequence that recalculates weekly pacing based on your verified test date and performance.',
    highlights: [
      'Calibrated to your exact exam date',
      'Automated daily milestone pacing across all 4 skills',
      'Smart focus shifts targeting your lowest-scoring areas',
    ],
  },
  {
    icon: BookOpen,
    tone: 'amber',
    badge: 'LEXICAL MASTERY',
    badgeTone: 'amber',
    title: 'Unlimited Reading & Lexical Kits',
    description:
      'Instant clause syntax parsing, academic word breakdowns, and unlocked Band 7, 8, and 9 vocabulary topic kits.',
    highlights: [
      'Unlimited Reading Assistant translations & clause breakdowns',
      'Curated Band 7, 8 & 9 topic vocabulary collections',
      'Complete grammar guides & expanded Practice Lab access',
    ],
  },
];

const TRUST_METRICS = [
  {
    icon: ShieldCheck,
    tone: 'emerald',
    title: 'Cancel Anytime',
    desc: 'Self-service 1-click cancellation directly in your account settings.',
  },
  {
    icon: Zap,
    tone: 'accent',
    title: 'Instant Activation',
    desc: 'All evaluations, kits, and diagnostic tools unlock immediately upon upgrade.',
  },
  {
    icon: CheckCircle2,
    tone: 'sky',
    title: 'Official IELTS Standards',
    desc: 'Calibrated strictly to official Cambridge, British Council, and IDP rubrics.',
  },
];

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
  },
};

const TIER_DEFAULTS = {
  BD: {
    pro: { writing: 50, speaking: 25, price: 499, symbol: '৳' },
    premium: { writing: 100, speaking: 50, price: 799, symbol: '৳' },
  },
  GLOBAL: {
    pro: { writing: 100, speaking: 50, price: 9.99, symbol: '$' },
    premium: { writing: 200, speaking: 100, price: 15.99, symbol: '$' },
  },
};

const PLAN_CARD_CONFIGS = {
  pro: {
    targetBand: 'REGULAR PRACTICE',
    targetBandClass: 'text-[#5a63df] dark:text-[#afb5ff]',
    badgeIcon: Sparkles,
    badgeText: 'Most Popular',
    badgeTone: 'accent',
    planTitle: 'Pro Plan',
    tagline: 'Build a consistent routine with AI feedback and an adaptive Learning Path.',
    buttonText: 'Upgrade to Pro',
    buttonClass: 'bg-[#5a63df] text-white hover:bg-[#4a52c9] shadow-xs',
    checkColorClass: 'text-[#5a63df] dark:text-[#afb5ff]',
    borderClass: 'border-[#5a63df]/35 dark:border-[#8f97ff]/30 shadow-xs',
    getFeatures: (data) => [
      'Unlimited Reading & Listening tests',
      `${data.writingLimit} AI Writing Evaluations / month`,
      `${data.speakingLimit} AI Speaking Sessions / month`,
      'Unlimited AI Reading Assistant',
      'Advanced Weakness & Readiness Radar',
      'Personalized AI Study Roadmap',
      '300 Saved Vocabulary Words & Band 7 Kits',
    ],
  },
  premium: {
    targetBand: 'HIGHER PRACTICE CAPACITY',
    targetBandClass: 'text-sky-600 dark:text-sky-300',
    badgeIcon: Award,
    badgeText: 'Maximum Support',
    badgeTone: 'sky',
    planTitle: 'Premium Plan',
    tagline: 'More evaluation capacity and advanced vocabulary kits for frequent practice.',
    buttonText: 'Get Premium',
    buttonClass:
      'border border-[#5a63df] bg-transparent text-[#5a63df] dark:text-[#afb5ff] dark:border-[#8f97ff]/40 hover:bg-[#5a63df]/10 dark:hover:bg-[#8f97ff]/10',
    checkColorClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12',
    getFeatures: (data) => [
      'Unlimited Reading & Listening tests',
      `${data.writingLimit} AI Writing Evaluations / month`,
      `${data.speakingLimit} AI Speaking Sessions / month`,
      'Unlimited AI Reading Assistant',
      'Unlimited Saved Vocabulary Bank',
      'All Topic Kits + Band 8 & 9 Advanced Lexicon',
      'Dynamic Real-Time Study Plan Adjustments',
    ],
  },
};

function getDetectedCountry(pricingCountry, pricingConfig) {
  if (pricingCountry) return pricingCountry.trim().toUpperCase();
  if (pricingConfig?.userCountry) return pricingConfig.userCountry.trim().toUpperCase();
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('user_country');
    if (saved) return saved.trim().toUpperCase();
  }
  return '';
}

function detectIsBangladesh(pricingCountry, pricingConfig) {
  const country = getDetectedCountry(pricingCountry, pricingConfig);
  if (country === 'BD' || country === 'BANGLADESH') {
    return true;
  }
  if (!country && typeof Intl !== 'undefined') {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === 'Asia/Dhaka' || tz === 'Asia/Chittagong';
  }
  return false;
}

function findTierPlan(tier, plans) {
  if (Array.isArray(plans)) {
    const matched = plans.find((p) => p.tier === tier);
    if (matched) return matched;
  }
  return DEFAULT_PRICING_PLANS.find((p) => p.tier === tier);
}

function getRegionDefaults(tier, isBD) {
  return isBD ? TIER_DEFAULTS.BD[tier] : TIER_DEFAULTS.GLOBAL[tier];
}

function getTierLimits(tier, pricingConfig) {
  const limits = pricingConfig?.tierLimits?.[tier];
  return limits || {};
}

function resolvePlanConfig(tier, plans, pricingConfig, isBD) {
  const plan = findTierPlan(tier, plans);
  const region = getRegionDefaults(tier, isBD);
  const limits = getTierLimits(tier, pricingConfig);

  const writingLimit = limits.writing_monthly_limit ?? region.writing;
  const speakingLimit = limits.speaking_monthly_limit ?? region.speaking;
  const symbol = plan.currencySymbol || region.symbol;
  const price = plan.basePrice ?? region.price;

  return {
    writingLimit,
    speakingLimit,
    symbol,
    price,
    oldPrice: plan.oldPrice,
  };
}

function UpgradeHeader({ focus }) {
  return (
    <m.header variants={ITEM_VARIANTS} className="text-center">
      <div className="mb-3.5 inline-flex flex-wrap items-center justify-center gap-2">
        <IconChip icon={Lock} tone="accent" size="sm" />
        <span className={cn(MICRO, MUTED)}>MEMBERSHIP UPGRADE</span>
        <Pill tone="accent">
          <Sparkles className="h-3 w-3" />
          Pro & Premium
        </Pill>
        <Pill tone="emerald">
          <Check className="h-3 w-3" />
          Cancel Anytime
        </Pill>
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
        {focus ? `Keep your ${focus} feedback going` : 'Turn practice into a focused routine'}
      </h1>
      <p
        className={cn(
          'mx-auto mt-2.5 max-w-xl text-[13px] font-medium leading-relaxed sm:text-[14px]',
          MUTED
        )}
      >
        Step beyond free limits with examiner-grade AI feedback on Writing & Speaking, pinpoint
        format-level weaknesses, and follow an adaptive roadmap calibrated to your test date.
      </p>
    </m.header>
  );
}

function CapabilityCardItem({ cap }) {
  return (
    <div
      className={cn(
        PANEL,
        'flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <IconChip icon={cap.icon} tone={cap.tone} size="md" />
        <Pill tone={cap.badgeTone}>{cap.badge}</Pill>
      </div>

      <h2 className="mt-3.5 text-[14px] font-extrabold tracking-tight text-slate-900 dark:text-white">
        {cap.title}
      </h2>
      <p className={cn('mt-1 text-[12.5px] leading-relaxed', MUTED)}>{cap.description}</p>

      <div className="mt-3.5 space-y-1.5 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
        {cap.highlights.map((highlight) => (
          <div key={highlight} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
              strokeWidth={2.75}
            />
            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 leading-snug">
              {highlight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapabilitiesSection() {
  return (
    <m.section variants={ITEM_VARIANTS} aria-label="Key Superpowers">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {CAPABILITIES.map((cap) => (
          <CapabilityCardItem key={cap.title} cap={cap} />
        ))}
      </div>
    </m.section>
  );
}

function PlanPriceDisplay({ symbol, price, oldPrice }) {
  return (
    <div className="mt-2.5 flex items-baseline gap-1.5">
      <span
        className={cn(NUM, 'text-3xl font-black tracking-tight text-slate-900 dark:text-white')}
      >
        {symbol}
        {price}
      </span>
      <span className={cn(MICRO, MUTED)}>/ month</span>
      {oldPrice && (
        <span className={cn(MICRO, NUM, 'ml-1 text-slate-400 line-through dark:text-slate-500')}>
          {symbol}
          {oldPrice}
        </span>
      )}
    </div>
  );
}

function pricingDestination(search, tier) {
  const incoming = new URLSearchParams(search);
  const params = new URLSearchParams();
  if (tier) params.set('plan', tier);
  // Carry email attribution and any issued offer through the upgrade hub to
  // the existing checkout flow instead of dropping them at the plan link.
  ['campaign_id', 'delivery_id', 'promo'].forEach((key) => {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  });
  return `${createPageUrl('Pricing')}${params.size ? `?${params}` : ''}`;
}

function PlanCard({ tier, planData }) {
  const { search } = useLocation();
  const config = PLAN_CARD_CONFIGS[tier];
  const BadgeIcon = config.badgeIcon;
  const features = config.getFeatures(planData);

  return (
    <div
      className={cn(
        PANEL,
        'relative flex flex-col justify-between p-4.5 sm:p-5 transition-all duration-200',
        config.borderClass
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn(MICRO, 'font-bold', config.targetBandClass)}>
            {config.targetBand}
          </span>
          <Pill tone={config.badgeTone}>
            <BadgeIcon className="h-3 w-3" />
            {config.badgeText}
          </Pill>
        </div>

        <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {config.planTitle}
        </h3>

        <PlanPriceDisplay
          symbol={planData.symbol}
          price={planData.price}
          oldPrice={planData.oldPrice}
        />

        <p className={cn('mt-1.5 text-[12.5px] leading-snug', MUTED)}>{config.tagline}</p>

        <div className="mt-4 space-y-2 border-t border-[#eceafa] pt-3.5 dark:border-white/[0.07]">
          {features.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check
                className={cn('h-3.5 w-3.5 shrink-0', config.checkColorClass)}
                strokeWidth={2.75}
              />
              <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to={pricingDestination(search, tier)}
        className={cn(
          MICRO,
          'mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg font-bold',
          'transition-all duration-150 active:scale-[0.99]',
          config.buttonClass
        )}
      >
        {config.buttonText}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function PlanSelectionSection({ proData, premiumData }) {
  return (
    <m.section variants={ITEM_VARIANTS} aria-label="Available Plans">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span
              className="h-3.5 w-[3px] shrink-0 rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
              aria-hidden="true"
            />
            <h2 className={TITLE}>Select Your Upgrade Path</h2>
          </div>
          <span className={cn(MICRO, MUTED)}>FULL ACCESS · CANCEL ANYTIME</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <PlanCard tier="pro" planData={proData} />
          <PlanCard tier="premium" planData={premiumData} />
        </div>
      </div>
    </m.section>
  );
}

function TrustMetricsSection() {
  return (
    <m.section variants={ITEM_VARIANTS} aria-label="Trust & Guarantees">
      <div className={cn(TILE, 'grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-3 sm:gap-4')}>
        {TRUST_METRICS.map((metric) => (
          <div key={metric.title} className="flex items-start gap-2.5">
            <IconChip icon={metric.icon} tone={metric.tone} size="sm" className="mt-0.5" />
            <div>
              <h4 className="text-[12.5px] font-bold text-slate-900 dark:text-white leading-snug">
                {metric.title}
              </h4>
              <p className={cn('text-[11.5px] leading-relaxed mt-0.5', MUTED)}>{metric.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </m.section>
  );
}

function FreePlanComparison({ pricingConfig }) {
  const free = pricingConfig?.tierLimits?.free;
  return (
    <m.section
      variants={ITEM_VARIANTS}
      className={cn(TILE, 'p-4')}
      aria-label="Free practice and paid support"
    >
      <p className={cn(MICRO, MUTED)}>YOUR STARTING POINT</p>
      <h2 className={cn(TITLE, 'mt-1')}>Try the feedback. Subscribe for a regular routine.</h2>
      <p className={cn(MUTED, 'mt-2 text-xs leading-relaxed')}>
        Free includes Reading &amp; Listening practice
        {free &&
          `, ${free.writing_monthly_limit === -1 ? 'unlimited' : free.writing_monthly_limit} Writing evaluations and ${free.speaking_monthly_limit === -1 ? 'unlimited' : free.speaking_monthly_limit} Speaking sessions per month`}
        . Pro adds more AI evaluations, advanced analytics and an adaptive Learning Path. Your saved
        results stay in your account.
      </p>
    </m.section>
  );
}

function UpgradeFooter() {
  const { search } = useLocation();
  return (
    <m.footer
      variants={ITEM_VARIANTS}
      className="flex flex-col items-center justify-between gap-3 border-t border-[#eceafa] pt-4 text-center dark:border-white/[0.07] sm:flex-row sm:text-left"
    >
      <Link
        to={pricingDestination(search)}
        className={cn(
          MICRO,
          'inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-[#afb5ff]'
        )}
      >
        Compare full feature matrix on Pricing page
        <ArrowRight className="h-3 w-3" />
      </Link>

      <Link
        to={createPageUrl('Dashboard')}
        className={cn(
          MICRO,
          'text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
        )}
      >
        Maybe later · Return to Dashboard
      </Link>
    </m.footer>
  );
}

/**
 * Upgrade Page
 *
 * In-app upgrade hub calibrated to regional pricing (e.g. BDT ৳ in Bangladesh,
 * USD $ elsewhere) and admin-configured tier quotas shown cleanly inside each plan card.
 * Adheres strictly to the Learner Panel Design System (PANEL, TILE, NUM, MICRO).
 */
export default function Upgrade() {
  const { plans, pricingConfig, pricingCountry, isLoading } = usePricing(DEFAULT_PRICING_PLANS);
  const { search } = useLocation();
  const requestedFocus = new URLSearchParams(search).get('focus');
  const focus = { writing: 'Writing', speaking: 'Speaking' }[requestedFocus];

  const isBD = detectIsBangladesh(pricingCountry, pricingConfig);
  const proData = resolvePlanConfig('pro', plans, pricingConfig, isBD);
  const premiumData = resolvePlanConfig('premium', plans, pricingConfig, isBD);

  return (
    <>
      <DocumentHead
        title="Upgrade to Pro & Premium | IELTS AI Pro"
        description="Unlock examiner-grade AI scoring for Writing & Speaking, personalized error diagnosis, and adaptive study roadmaps."
        canonicalUrl="https://www.ieltsai.pro/upgrade"
      />

      <div className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-6 dark:bg-[#08080a] sm:px-6 sm:py-8">
        {/* Subtle dot grid pattern adhering to Learner Panel Design System */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
        />

        <m.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-4xl space-y-6"
        >
          <UpgradeHeader focus={focus} />
          <FreePlanComparison pricingConfig={pricingConfig} />
          {isLoading ? (
            <p role="status" className={cn(MUTED, 'text-center text-sm')}>
              Loading your regional plans…
            </p>
          ) : (
            <PlanSelectionSection proData={proData} premiumData={premiumData} />
          )}
          <p className={cn(MUTED, 'text-center text-xs')}>
            Monthly subscriptions renew until cancelled. Review billing periods and payment terms at
            checkout.
          </p>
          <CapabilitiesSection />
          <TrustMetricsSection />
          <UpgradeFooter />
        </m.div>
      </div>
    </>
  );
}
