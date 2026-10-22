import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Compass,
  Infinity as InfinityIcon,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { useUserProfile } from '@/features/auth/hooks/useUserProfile';
import { DEFAULT_PRICING_PLANS } from '@/features/subscription/config/pricingPlans';
import { usePricing } from '@/features/subscription/hooks/usePricing';
import { captureProductEvent } from '@/lib/posthog';
import { cn } from '@/lib/cn';
import { createPageUrl } from '@/utils';
import { TEST_TYPE_LABEL, describeUsage } from '@/features/testing/shared/quota/objectiveQuota';

const UPGRADE_PATH = '/pricing?plan=pro';

const PRO_BENEFITS = {
  reading: [
    {
      icon: InfinityIcon,
      tone: 'accent',
      title: 'Unlimited Reading and Listening tests',
      desc: 'Start any test, any time of day.',
    },
    {
      icon: BookOpen,
      tone: 'sky',
      title: 'Unlimited AI Reading Assistant',
      desc: 'Translate, simplify and break down hard sentences.',
    },
    {
      icon: Target,
      tone: 'rose',
      title: 'Weakness and readiness analytics',
      desc: 'See which question types cost you marks.',
    },
    {
      icon: Compass,
      tone: 'amber',
      title: 'An AI study plan for your test date',
      desc: 'Daily targets that adjust as you improve.',
    },
  ],
  listening: [
    {
      icon: InfinityIcon,
      tone: 'accent',
      title: 'Unlimited Reading and Listening tests',
      desc: 'Start any test, any time of day.',
    },
    {
      icon: PenLine,
      tone: 'sky',
      title: 'AI Writing and Speaking feedback',
      desc: 'Band scores with examiner-style comments.',
    },
    {
      icon: Target,
      tone: 'rose',
      title: 'Weakness and readiness analytics',
      desc: 'See which question types cost you marks.',
    },
    {
      icon: Compass,
      tone: 'amber',
      title: 'An AI study plan for your test date',
      desc: 'Daily targets that adjust as you improve.',
    },
  ],
};

/** One pip per free test; fills in sequence so the used-up state lands, not just appears. */
export function AllowanceGauge({ quota, tone = 'accent', className }) {
  const reduceMotion = useReducedMotion();
  if (!quota?.limited || quota.limit === 0) return null;
  const filled = Math.min(quota.used, quota.limit);
  const fill = tone === 'warn' ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[#5a63df] dark:bg-[#8f97ff]';

  if (quota.limit > 12) {
    const pct = Math.round((filled / quota.limit) * 100);
    return (
      <div className={cn('h-1.5 overflow-hidden rounded-full', WELL, className)} aria-hidden="true">
        <div className={cn('h-full rounded-full', fill)} style={{ width: `${pct}%` }} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)} aria-hidden="true">
      {Array.from({ length: quota.limit }, (_, index) => {
        const isFilled = index < filled;
        return (
          <m.span
            key={index}
            className={cn(
              'h-2 w-6 origin-left rounded-sm sm:w-7',
              isFilled ? fill : cn(WELL, 'border border-[#e4e2f0] dark:border-white/[0.07]')
            )}
            initial={reduceMotion || !isFilled ? false : { scaleX: 0, opacity: 0.4 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.12 + index * 0.07, ease: [0.23, 1, 0.32, 1] }}
          />
        );
      })}
    </div>
  );
}

function UsageColumn({ testType, quota, onClose }) {
  const label = TEST_TYPE_LABEL[testType];
  const libraryPath = createPageUrl(label);
  const linkClass = cn(
    TILE,
    'mt-auto flex h-10 w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:border-[#5a63df]/30 hover:text-[#5a63df] active:scale-[0.99] dark:text-slate-200 dark:hover:text-[#afb5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]'
  );

  return (
    <div
      className={cn(
        WELL,
        'flex flex-col gap-5 border-t border-[#e4e2f0] p-5 dark:border-white/[0.07] sm:p-6 md:border-t-0'
      )}
    >
      <div>
        <p className={cn(MICRO, MUTED)}>Your free {label} tests</p>
        {quota.limit > 0 ? (
          <>
            <p
              className="mt-3 flex items-baseline gap-2"
              aria-label={`${describeUsage(quota)} used`}
            >
              <span
                className={cn(
                  NUM,
                  'text-4xl font-black leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {quota.used}
                <span className="text-slate-300 dark:text-slate-600">/</span>
                {quota.limit}
              </span>
              <span className={cn(MICRO, MUTED)}>used</span>
            </p>
            <AllowanceGauge quota={quota} tone="warn" className="mt-3" />
          </>
        ) : (
          <p className={cn('mt-3 text-[13px] font-semibold leading-relaxed', MUTED)}>
            Your free plan doesn&apos;t include {label} tests.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className={cn(MICRO, MUTED)}>Still free</p>
        <div className={cn(TILE, 'divide-y divide-[#ebeaf7] dark:divide-white/[0.07]')}>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <IconChip icon={Play} tone="emerald" size="sm" />
            <p className="text-[12px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
              Resume a test you&apos;ve already started
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <IconChip icon={ClipboardCheck} tone="sky" size="sm" />
            <p className="text-[12px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
              Review results from finished tests
            </p>
          </div>
        </div>
      </div>

      {onClose ? (
        <button type="button" onClick={onClose} className={cn(linkClass, 'cursor-pointer')}>
          Not now
        </button>
      ) : (
        <Link to={libraryPath} className={linkClass}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {label} tests
        </Link>
      )}
    </div>
  );
}

function ProColumn({ testType, surface, tier }) {
  const { plans, isLoading } = usePricing(DEFAULT_PRICING_PLANS);
  const pro = plans?.find((plan) => plan.tier === 'pro');
  const symbol = pro?.currencySymbol ?? '$';
  const price = pro?.basePrice;
  const oldPrice = pro?.oldPrice;

  return (
    // On a phone the offer leads; the wait panel is context, not the decision.
    <div className="order-first flex flex-col gap-4 p-5 sm:p-6 md:order-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
              Keep practising with Pro
            </h2>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5" aria-live="polite">
            {price != null && !isLoading ? (
              <>
                <span className={cn(NUM, 'text-2xl font-black text-slate-900 dark:text-slate-50')}>
                  {symbol}
                  {price}
                </span>
                <span className={cn(MICRO, MUTED)}>per month</span>
                {oldPrice ? (
                  <span
                    className={cn(
                      MICRO,
                      NUM,
                      'ml-1 text-slate-400 line-through dark:text-slate-500'
                    )}
                  >
                    {symbol}
                    {oldPrice}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="h-7 w-28 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
            )}
          </div>
        </div>
        <Pill tone="accent">
          <Sparkles className="h-3 w-3" />
          Most popular
        </Pill>
      </div>

      <ul className="space-y-2.5 border-t border-[#eceafa] pt-4 dark:border-white/[0.07]">
        {PRO_BENEFITS[testType].map((item) => (
          <li key={item.title} className="flex items-start gap-2.5">
            <IconChip icon={item.icon} tone={item.tone} size="sm" className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
                {item.title}
              </p>
              <p className={cn('mt-0.5 text-[11.5px] leading-snug', MUTED)}>{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-2.5">
        <Link
          to={UPGRADE_PATH}
          onClick={() =>
            void captureProductEvent('test_limit_upgrade_clicked', {
              test_type: testType,
              source: surface,
              current_tier: tier,
            })
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]"
        >
          Go unlimited with Pro
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </Link>
        <p
          className={cn('flex items-center justify-center gap-1.5 text-[11px] font-medium', MUTED)}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[rgb(var(--signal-ok))]" />
          Cancel anytime. Unlocks as soon as you pay.
        </p>
      </div>
    </div>
  );
}

function headline(testType, quota) {
  const label = TEST_TYPE_LABEL[testType];
  if (quota.limit === 0) return `${label} tests are part of Pro`;
  if (quota.limit === 1) return `You've used your free ${label} test`;
  return `You've used all ${quota.limit} of your free ${label} tests`;
}

function PaywallBody({ testType, quota, testTitle, surface, onClose, Heading, Lead }) {
  const { data: user } = useUserProfile();
  const tier = (user?.subscription_tier || 'free').toLowerCase();

  useEffect(() => {
    void captureProductEvent('test_limit_paywall_viewed', {
      test_type: testType,
      source: surface,
      current_tier: tier,
    });
    // One impression per mount: the paywall unmounts when it is dismissed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = TEST_TYPE_LABEL[testType];

  return (
    <>
      <header className="relative px-5 pb-5 pt-5 sm:px-7 sm:pt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[16px_16px] opacity-[0.06] dark:opacity-[0.10]"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <Pill tone="warn">Free {label} tests used</Pill>
        </div>

        <Heading className="relative mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-[28px]">
          {headline(testType, quota)}
        </Heading>
        <Lead className="relative mt-2 max-w-xl text-[13px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          {testTitle ? (
            <>
              <span className="font-bold text-slate-800 dark:text-slate-100">{testTitle}</span> is
              ready when you upgrade.{' '}
            </>
          ) : (
            'Upgrade to keep practising. '
          )}
          Your results and progress stay saved.
        </Lead>
      </header>

      <div className="grid grid-cols-1 border-t border-[#e4e2f0] dark:border-white/[0.07] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:divide-x md:divide-[#e4e2f0] md:dark:divide-white/[0.07]">
        <UsageColumn testType={testType} quota={quota} onClose={onClose} />
        <ProColumn testType={testType} surface={surface} tier={tier} />
      </div>
    </>
  );
}

const PageHeading = ({ children, className }) => <h1 className={className}>{children}</h1>;
const PageLead = ({ children, className }) => <p className={className}>{children}</p>;

/**
 * What a free learner sees once their Reading or Listening allowance is spent.
 *
 * `variant="page"` replaces the test screen; `variant="dialog"` opens over the
 * library when they press a locked card. Both state how many free tests were
 * used, what stays free, and what Pro changes, so it is never a dead end.
 */
export default function ObjectiveLimitPaywall({
  testType,
  quota,
  testTitle = '',
  surface = 'start_screen',
  variant = 'page',
  open = true,
  onClose,
}) {
  if (variant === 'dialog') {
    return (
      <AlertDialog open={open} onOpenChange={(next) => !next && onClose?.()}>
        <AlertDialogContent
          className={cn(
            PANEL,
            'max-h-[92vh] w-[calc(100%-2rem)] max-w-[820px] gap-0 overflow-y-auto rounded-2xl p-0'
          )}
        >
          <PaywallBody
            testType={testType}
            quota={quota}
            testTitle={testTitle}
            surface={surface}
            onClose={onClose}
            Heading={AlertDialogTitle}
            Lead={AlertDialogDescription}
          />
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8fb] p-4 dark:bg-[#08080a] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={cn(PANEL, 'relative w-full max-w-[860px] overflow-hidden rounded-2xl')}
      >
        <PaywallBody
          testType={testType}
          quota={quota}
          testTitle={testTitle}
          surface={surface}
          Heading={PageHeading}
          Lead={PageLead}
        />
      </m.div>
    </main>
  );
}
