import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PILL_BASE, Pill, pillTone } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

// A 9px pill is a fine label but a poor tap target, so the due-reviews chip
// keeps the pill's shape and grows to a ~24px hit area once it does something.
const CHIP_SIZE = 'gap-1.5 px-2.5 py-1 text-[10px]';

function allowanceCopy(access) {
  if (access?.isPaid) return 'Unlimited practice';
  return `${access?.dailyRemaining ?? 0} of 5 free questions left today`;
}

/**
 * "N reviews due" used to be a dead orange label — the one number on the panel
 * that named an action and then refused to perform it. It is now the panel's
 * secondary control: a pill button that starts the review set straight away,
 * and that says why it cannot when it is out of reach (no allowance left, or a
 * start already in flight) instead of just dimming.
 */
function DueReviewsChip({ dueReviews, dueSkillLabels, disabledReason, onStartReview }) {
  const label = `${dueReviews} review${dueReviews === 1 ? '' : 's'} due`;
  const skillHint = dueSkillLabels?.length ? ` · ${dueSkillLabels.join(', ')}` : '';

  if (disabledReason) {
    return (
      <span
        title={`${label}${skillHint}. ${disabledReason}`}
        className={cn(PILL_BASE, pillTone('amber'), CHIP_SIZE, 'cursor-not-allowed opacity-70')}
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onStartReview}
      title={`Start a 5-question review${skillHint}`}
      aria-label={`Start a review of ${label}`}
      className={cn(
        PILL_BASE,
        pillTone('amber'),
        CHIP_SIZE,
        'group cursor-pointer pr-2 transition duration-200',
        'hover:border-amber-500/50 hover:bg-amber-500/[0.14] hover:text-amber-700',
        'dark:hover:bg-amber-400/[0.22] dark:hover:text-amber-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50'
      )}
    >
      <RotateCcw
        className="h-3 w-3 transition duration-300 group-hover:-rotate-45"
        aria-hidden="true"
      />
      {label}
      <ChevronRight
        className="h-3 w-3 opacity-50 transition duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
        aria-hidden="true"
      />
    </button>
  );
}

/**
 * The hero panel at the top of the grammar dashboard — shows the primary CTA
 * with title, description, and start/resume button.
 */
export default function GrammarHeroPanel({
  primaryTitle,
  primaryDescription,
  primaryMode,
  inProgressAttempt,
  isStarting,
  isResuming,
  dailyLimitReached,
  access,
  dueReviews,
  dueSkillLabels,
  retestTarget,
  onStart,
  onStartReview,
}) {
  const reviewCount = Number(dueReviews || 0);
  const noAllowance = !access?.isPaid && Number(access?.dailyRemaining || 0) <= 0;
  const reviewDisabledReason = isStarting
    ? 'Starting a set already.'
    : isResuming
      ? 'Resuming your attempt.'
      : noAllowance
        ? 'Your free questions for today are used — reviews unlock again tomorrow, or with a paid plan.'
        : null;

  return (
    <div className="relative h-full min-h-[248px] overflow-hidden bg-[#f4f1fb] px-5 py-6 dark:bg-[#131315] sm:px-7 sm:py-7">
      <img
        src="/images/grammar/grammar-lab-study-hero.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8f7fd_0%,rgba(248,247,253,0.98)_42%,rgba(248,247,253,0.18)_70%)] dark:bg-[linear-gradient(90deg,#11131f_0%,rgba(17,19,31,0.96)_44%,rgba(17,19,31,0.25)_76%)]" />
      <div className="relative max-w-[525px]">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">Today's grammar plan</Pill>
          {reviewCount > 0 && (
            <DueReviewsChip
              dueReviews={reviewCount}
              dueSkillLabels={dueSkillLabels}
              disabledReason={reviewDisabledReason}
              onStartReview={onStartReview}
            />
          )}
        </div>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {primaryTitle}
        </h2>
        <p className="mt-1.5 max-w-lg text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {primaryDescription}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button
            onClick={onStart}
            disabled={
              isStarting ||
              isResuming ||
              (!inProgressAttempt &&
                (dailyLimitReached ||
                  (primaryMode === 'diagnostic' && !access.diagnosticAvailable)))
            }
            className="h-10 rounded-lg bg-[#5a63df] px-5 font-bold text-white hover:bg-[#4a52c9]"
          >
            {isStarting || isResuming ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : inProgressAttempt ? (
              <ArrowRight className="mr-2 h-4 w-4" />
            ) : primaryMode === 'diagnostic' ? (
              <ClipboardCheck className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {inProgressAttempt
              ? 'Resume attempt'
              : primaryMode === 'retest'
                ? `Take a ${retestTarget === 'speaking' ? 'Speaking' : 'Writing'} test`
                : primaryMode === 'diagnostic'
                  ? access.diagnosticAvailable
                    ? 'Start level check'
                    : 'Level check used this month'
                  : dailyLimitReached
                    ? 'Daily practice used'
                    : primaryMode === 'review'
                      ? 'Start review'
                      : 'Start 5-question practice'}
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-[#e2e5f2] bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {access.isPaid ? (
              <CheckCircle2 className="h-4 w-4 text-[rgb(var(--signal-ok))]" />
            ) : (
              <LockKeyhole className="h-4 w-4 text-[#5a63df]" />
            )}
            {allowanceCopy(access)}
          </div>
        </div>
      </div>
    </div>
  );
}
