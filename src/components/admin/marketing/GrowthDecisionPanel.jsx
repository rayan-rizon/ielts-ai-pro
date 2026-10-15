import { ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BODY, MICRO, NUM, PANEL, Pill, TITLE } from '@/components/admin/ui/primitives';

const psychologyByCohort = {
  at_risk_paid: 'Protect the value they already paid for; offer help before any incentive.',
  high_intent_free:
    'Make progress concrete and show the single benefit that removes their next limit.',
  exam_countdown: 'Use the real exam date to make the next step timely, specific, and achievable.',
  broken_streak: 'Reduce effort: invite one small restart instead of emphasizing lost progress.',
  score_plateau: 'Show evidence of the bottleneck and a focused route through it.',
};

const findLargestLoss = (stages = []) => {
  let result = null;
  for (let index = 1; index < stages.length; index += 1) {
    const from = stages[index - 1];
    const to = stages[index];
    if (!from?.value) continue;
    const lost = Math.max(0, from.value - (to?.value || 0));
    const lossRate = Math.round((lost / from.value) * 100);
    if (!result || lossRate > result.lossRate) result = { from, to, lost, lossRate };
  }
  return result;
};

export default function GrowthDecisionPanel({ growth, currentSubscriptions, compact = false }) {
  if (!growth || growth.unavailable) {
    return (
      <section className={cn(PANEL, 'p-4')}>
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4 text-[rgb(var(--signal-warn))]" />
          <div>
            <h3 className={TITLE}>Subscription decision loop</h3>
            <p className={cn(BODY, 'mt-1')}>
              Growth evidence is unavailable in this environment. Recommendations stay paused rather
              than guessing from campaign delivery alone.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const stages = growth.stages || [];
  const cohorts = [...(growth.cohorts || [])]
    .filter((cohort) => cohort.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const loss = findLargestLoss(stages);
  const pricingInterest = stages.find((stage) => stage.key === 'pricing_interest');
  const checkout = stages.find((stage) => stage.key === 'checkout_started');
  const pricingWithoutCheckout = Math.max(
    0,
    Number(pricingInterest?.value || 0) - Number(checkout?.value || 0)
  );

  if (compact) {
    return (
      <section
        className={cn(PANEL, 'flex flex-col gap-3 p-3.5 lg:flex-row lg:items-center')}
        aria-label="Subscription opportunity"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="warn">Priority</Pill>
            <h3 className={TITLE}>Pricing follow-up</h3>
          </div>
          <p className={cn(BODY, 'mt-1')}>
            <span className={cn(NUM, 'font-bold text-stone-900 dark:text-stone-50')}>
              {pricingWithoutCheckout}
            </span>{' '}
            interested learners did not start checkout. Copilot prepares one helpful comparison for
            review.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Pill tone="ok">
            <span className={NUM}>{currentSubscriptions?.total ?? 0}</span> paying now
          </Pill>
          <Pill tone="accent">
            <span className={NUM}>{stages.find((stage) => stage.key === 'paid')?.value ?? 0}</span>{' '}
            new paid
          </Pill>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(PANEL, 'overflow-hidden min-w-0 max-w-full')}
      aria-labelledby="growth-decision-title"
    >
      <div className="border-b border-stone-200/80 p-3.5 sm:p-4 dark:border-white/[0.07]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Measured</Pill>
              <h3 id="growth-decision-title" className={TITLE}>
                Subscription decision loop
              </h3>
            </div>
            <p className={cn(BODY, 'mt-1 max-w-2xl text-xs')}>
              Find the largest verified loss, choose a relevant learner cohort, review one action,
              and measure practice or paid conversion against a holdout.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
            <Pill tone="ok">
              <span className={NUM}>{currentSubscriptions?.total ?? 0}</span> current paying
            </Pill>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]" />
              <span className="leading-tight">
                AI proposes · an admin approves · outcomes are measured
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 min-w-0 max-w-full lg:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0 max-w-full overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-200/80 p-3.5 sm:p-4 dark:border-white/[0.07]">
          <div className="flex items-center justify-between mb-2">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Account lifecycle</p>
            <span className="text-[9px] font-medium text-stone-400 dark:text-stone-500 sm:hidden">
              Swipe stages →
            </span>
          </div>
          <div className="no-scrollbar touch-pan-x flex min-w-0 max-w-full items-stretch gap-1.5 overflow-x-auto pb-1.5 pt-0.5 overscroll-x-contain">
            {stages.map((stage, index) => {
              const previous = stages[index - 1];
              const rate = previous?.value
                ? Math.round((stage.value / previous.value) * 100)
                : null;
              const stageLabel = stage.key === 'paid' ? 'New paid' : stage.label;
              return (
                <div key={stage.key} className="flex shrink-0 items-center gap-1.5">
                  {index > 0 && (
                    <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-0.5">
                      <ArrowRight className="h-3 w-3 text-stone-300 dark:text-stone-600" />
                      <span
                        className={cn(
                          NUM,
                          'text-[8px] font-bold text-stone-400 dark:text-stone-500'
                        )}
                      >
                        {rate}%
                      </span>
                    </div>
                  )}
                  <div className="w-[88px] sm:w-[100px] shrink-0 rounded-lg border border-stone-200/80 bg-stone-50/70 p-2 sm:p-2.5 dark:border-white/[0.08] dark:bg-white/[0.035] transition-all">
                    <p
                      className={cn(
                        NUM,
                        'text-base font-bold text-stone-900 dark:text-stone-50 leading-tight'
                      )}
                    >
                      {stage.value ?? 0}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                      {stageLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {loss && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[rgb(var(--signal-warn)/0.25)] bg-[rgb(var(--signal-warn)/0.05)] p-2.5">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-warn))]" />
              <p className="text-[11px] font-medium leading-relaxed text-stone-700 dark:text-stone-200 break-words">
                <span className="font-extrabold">Largest measured loss:</span> {loss.from.label} →{' '}
                {loss.to.label}. <span className={NUM}>{loss.lost}</span> learners,{' '}
                <span className={NUM}>{loss.lossRate}%</span> of the prior stage. Diagnose this step
                before increasing message volume.
              </p>
            </div>
          )}
          {pricingInterest && (
            <div className="mt-2 rounded-lg bg-stone-100/70 p-2.5 dark:bg-white/[0.045]">
              <p className="text-[11px] font-extrabold text-stone-900 dark:text-stone-50 break-words">
                Pricing follow-up · <span className={NUM}>{pricingWithoutCheckout}</span> did not
                start checkout
              </p>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-stone-500 dark:text-stone-400 break-words">
                Copilot considers recent free learners only after they select a plan or visit
                pricing at least twice within 48 hours. It prepares a helpful comparison for admin
                review; it does not send automatically or offer an invented discount.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 max-w-full p-3.5 sm:p-4">
          <p className={cn(MICRO, 'mb-2 text-stone-500 dark:text-stone-400')}>Best review queues</p>
          <div className="space-y-2">
            {cohorts.map((cohort) => (
              <div
                key={cohort.key}
                className="rounded-lg bg-stone-100/70 p-2.5 dark:bg-white/[0.045]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-extrabold text-stone-900 dark:text-stone-50">
                    {cohort.label}
                  </p>
                  <span className={cn(NUM, 'text-xs font-bold text-stone-700 dark:text-stone-200')}>
                    {cohort.count}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium leading-snug text-stone-500 dark:text-stone-400">
                  {psychologyByCohort[cohort.key] || cohort.action}
                </p>
                <p className={cn(MICRO, 'mt-1.5 text-indigo-600 dark:text-indigo-400')}>
                  {cohort.timing} · {cohort.channel?.replaceAll('_', ' ')}
                </p>
              </div>
            ))}
            {cohorts.length === 0 && (
              <p className={cn(BODY, 'py-4 text-center')}>No measured opportunity cohort today.</p>
            )}
          </div>
        </div>
      </div>

      {growth.coverage?.note && (
        <p className="border-t border-stone-200/80 px-4 py-2 text-[10px] font-medium text-stone-500 dark:border-white/[0.07] dark:text-stone-400 break-words">
          Coverage · {growth.coverage.note}
        </p>
      )}
    </section>
  );
}
