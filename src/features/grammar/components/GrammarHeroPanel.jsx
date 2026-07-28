import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  onStart,
}) {
  return (
    <div className="relative min-h-[248px] overflow-hidden bg-[#f4f1fb] px-5 py-6 sm:px-7 sm:py-7">
      <img
        src="/images/grammar/grammar-lab-study-hero.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8f7fd_0%,rgba(248,247,253,0.98)_42%,rgba(248,247,253,0.18)_70%)] dark:bg-[linear-gradient(90deg,#11131f_0%,rgba(17,19,31,0.96)_44%,rgba(17,19,31,0.25)_76%)]" />
      <div className="relative max-w-[525px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#dfe3ff] bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5058d9] backdrop-blur">
            Today's grammar plan
          </span>
          {dueReviews > 0 && (
            <span className="text-xs font-extrabold text-orange-700">
              {dueReviews} review{dueReviews === 1 ? '' : 's'} due
            </span>
          )}
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-[34px] sm:leading-[1.08] dark:text-white">
          {primaryTitle}
        </h2>
        <p className="mt-2.5 max-w-lg text-sm font-medium leading-5 text-slate-600 dark:text-slate-300">
          {primaryDescription}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Button
            onClick={onStart}
            disabled={
              isStarting ||
              isResuming ||
              (!inProgressAttempt &&
                (dailyLimitReached ||
                  (primaryMode === 'diagnostic' && !access.diagnosticAvailable)))
            }
            className="h-10 rounded-xl bg-[#5661e9] px-5 font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(76,87,225,0.9)] hover:bg-[#4853d6]"
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
          <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-600 backdrop-blur dark:bg-white/5 dark:text-slate-300">
            {access.isPaid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <LockKeyhole className="h-4 w-4 text-[#6670e8]" />
            )}
            {allowanceCopy(access)}
          </div>
        </div>
      </div>
    </div>
  );
}
