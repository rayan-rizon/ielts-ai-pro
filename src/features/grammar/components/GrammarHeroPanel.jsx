import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/features/dashboard/components/primitives';

function allowanceCopy(access) {
  if (access?.isPaid) return 'Unlimited practice';
  return `${access?.dailyRemaining ?? 0} of 5 free questions left today`;
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
  retestTarget,
  onStart,
}) {
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
          {dueReviews > 0 && (
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
              {dueReviews} review{dueReviews === 1 ? '' : 's'} due
            </span>
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
