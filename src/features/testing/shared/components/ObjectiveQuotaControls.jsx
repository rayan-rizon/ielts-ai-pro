import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, RotateCcw } from 'lucide-react';
import { MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives';
import LibraryUsagePanel from './LibraryUsagePanel';
import { cn } from '@/lib/cn';
import { withLearningActivity } from '@/features/testing/shared/activityContext';
import ObjectiveLimitPaywall, { AllowanceGauge } from './ObjectiveLimitPaywall';
import {
  TEST_TYPE_LABEL,
  describeAllowance,
  describeUsage,
  freeTestsPhrase,
  isPaywallRequested,
} from '@/features/testing/shared/quota/objectiveQuota';
import {
  useObjectiveTestQuota,
  useQuotaPaywallStore,
} from '@/features/testing/shared/quota/useObjectiveTestQuota';

const UPGRADE_PATH = '/pricing?plan=pro';

const WARN_BUTTON =
  'border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] text-[rgb(var(--signal-warn))] hover:bg-[rgb(var(--signal-warn)/0.14)] dark:bg-[rgb(var(--signal-warn)/0.14)]';

const ACTION_CLASS =
  'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';

/** Opens the paywall once the free tests are used; otherwise a quiet link to Pro. */
function StripAction({ exhausted, onOpen }) {
  if (exhausted) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className={cn(
          ACTION_CLASS,
          'rounded-lg bg-[#5a63df] px-4 text-white transition-all hover:bg-[#4a52c9] active:scale-[0.98] cursor-pointer focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]'
        )}
      >
        Go unlimited
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <Link
      to={UPGRADE_PATH}
      className={cn(
        ACTION_CLASS,
        'rounded-lg px-1 text-[#5a63df] transition-colors hover:text-[#4a52c9] dark:text-[#afb5ff] dark:hover:text-white'
      )}
    >
      Go unlimited
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function starterSetAllowance(quota, label) {
  const remaining = quota.remaining;
  return {
    title: `Free ${label} tests`,
    detail: quota.exhausted
      ? 'No starts left. You can still resume a test.'
      : `${remaining} ${remaining === 1 ? 'start' : 'starts'} left on the newest ${quota.limit} tests`,
    tone: remaining <= 1 ? 'warn' : 'accent',
  };
}

/**
 * The allowance, stated where the learner chooses a test. Silent for anyone who
 * is not limited, so paid learners and Free plans without a cap see nothing.
 */
export function ObjectiveQuotaStrip({ testType, starterSetsAvailable = true }) {
  const quota = useObjectiveTestQuota(testType);
  const openPaywall = useQuotaPaywallStore((state) => state.openPaywall);
  if (!quota.limited) return null;

  const label = TEST_TYPE_LABEL[testType];
  const { title, detail, tone } = starterSetsAvailable
    ? starterSetAllowance(quota, label)
    : describeAllowance(quota, label);

  return (
    <LibraryUsagePanel
      label={`Free ${label} tests`}
      title={title}
      detail={detail}
      blocked={quota.exhausted}
      tone={tone === 'warn' ? 'amber' : 'accent'}
      action={<StripAction exhausted={quota.exhausted} onOpen={() => openPaywall(testType)} />}
    >
      {quota.limit > 0 && (
        <div className="flex items-center gap-1.5 @[560px]:gap-2.5">
          <AllowanceGauge
            quota={quota}
            tone={tone}
            className="min-w-0 flex-1 [&>span]:min-w-0 [&>span]:flex-1"
          />
          <span
            className={cn(
              MICRO,
              NUM,
              MUTED,
              'shrink-0 whitespace-nowrap tracking-wider @[560px]:tracking-[0.14em]'
            )}
          >
            {describeUsage(quota)} used
          </span>
        </div>
      )}
    </LibraryUsagePanel>
  );
}

/** Slim note above the start screen: this start spends one free test. */
export function ObjectiveStartNote({ testType }) {
  const quota = useObjectiveTestQuota(testType);
  if (!quota.limited || quota.exhausted) return null;

  const label = TEST_TYPE_LABEL[testType];
  const { remaining } = quota;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#e4e2f0] bg-[#f4f3fb] px-4 py-1.5 text-[11.5px] font-semibold text-slate-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-300">
      <span className="flex items-center gap-2">
        <AllowanceGauge quota={quota} tone={remaining === 1 ? 'warn' : 'accent'} />
        Starting uses 1 of your {freeTestsPhrase(quota.limit, label)}.{' '}
        <span className="font-bold text-slate-800 dark:text-slate-100">
          {remaining === 1 ? 'This is your last one.' : `${remaining} left.`}
        </span>
      </span>
      <Link
        to={UPGRADE_PATH}
        className="inline-flex items-center gap-1 font-bold text-[#5a63df] hover:text-[#4a52c9] dark:text-[#afb5ff] dark:hover:text-white"
      >
        Go unlimited
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/** One paywall dialog per library page, opened by the strip or any locked card. */
export function ObjectiveLimitDialog({ testType }) {
  const quota = useObjectiveTestQuota(testType);
  const request = useQuotaPaywallStore((state) => state.open);
  const closePaywall = useQuotaPaywallStore((state) => state.closePaywall);
  // The store is global, so leaving the library must not leave a dialog queued.
  useEffect(() => closePaywall, [closePaywall]);
  if (!isPaywallRequested(request, testType, quota)) return null;

  return (
    <ObjectiveLimitPaywall
      variant="dialog"
      surface="library"
      testType={testType}
      quota={quota}
      testTitle={request.testTitle}
      onClose={closePaywall}
    />
  );
}

/** Restart icon that opens the paywall instead of a test that cannot start. */
export function RetakeLink({ test, path, quotaLock, buttonClass, iconClass, startLocked }) {
  if (startLocked) return null;
  const locked = quotaLock.locked;
  return (
    <Link
      to={withLearningActivity(`${path}?test-id=${test.id}&retake=true`)}
      onClick={
        locked
          ? (event) => {
              event.preventDefault();
              quotaLock.open(test.title);
            }
          : undefined
      }
    >
      <button
        type="button"
        className={buttonClass}
        aria-label={locked ? 'Restart test, free limit reached' : 'Restart test'}
        aria-haspopup={locked ? 'dialog' : undefined}
      >
        {locked ? <Lock className={iconClass} /> : <RotateCcw className={iconClass} />}
      </button>
    </Link>
  );
}

/** Replaces "Start Practice" / "Start" once the allowance is spent. */
export function LimitReachedButton({ test, quotaLock, className, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => quotaLock.open(test.title)}
      aria-haspopup="dialog"
      className={cn(className, WARN_BUTTON)}
    >
      <Lock className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {compact ? 'Limit' : 'Free limit reached'}
    </button>
  );
}
