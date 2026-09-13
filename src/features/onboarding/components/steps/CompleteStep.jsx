import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Gauge,
  LockKeyhole,
  Sparkles,
  Target,
} from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
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
import { buildOnboardingPlanPreview } from './onboardingPlanPreview';

const ASSEMBLY_STEPS = [
  { icon: CalendarDays, shortLabel: 'Schedule', label: 'Fitting sessions to your week' },
  { icon: Target, shortLabel: 'Focus', label: 'Setting your first priority' },
  { icon: Gauge, shortLabel: 'Pace', label: 'Calibrating your target pace' },
];

const PLAN_OPTIONS = {
  pro: {
    name: 'Pro',
    icon: Sparkles,
    description: 'Adaptive schedule',
    features: ['Complete Grammar guides', 'Expanded Practice Lab'],
    tone: 'accent',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    description: 'More AI feedback',
    features: ['Higher AI feedback limits', 'Advanced vocabulary kits'],
    tone: 'sky',
  },
};

function PlanAssembly({ preview }) {
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(reduceMotion ? ASSEMBLY_STEPS.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, ASSEMBLY_STEPS.length - 1));
    }, 520);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const progress = ((activeStep + 1) / ASSEMBLY_STEPS.length) * 100;

  return (
    <div className="flex min-h-[250px] flex-col justify-center py-2 text-center">
      <Pill tone="accent" className="mx-auto w-fit">
        <Sparkles className="h-3 w-3" />
        Personalizing
      </Pill>
      <h2 className="mt-2.5 text-xl font-black tracking-tight text-slate-900 text-balance dark:text-white">
        Building your Band {preview.targetBand.toFixed(1)} plan
      </h2>
      <p className={cn('mx-auto mt-1 max-w-sm text-[12px] font-medium text-pretty', MUTED)}>
        Matching {preview.weeklyMinutes} weekly minutes to your {preview.focusLabel} priority.
      </p>

      <div className={cn(WELL, 'mx-auto mt-4 w-full max-w-md rounded-xl p-2.5')}>
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {ASSEMBLY_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const complete = index <= activeStep;
            return (
              <div key={step.shortLabel} className="flex flex-col items-center gap-1.5">
                <m.span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-lg border',
                    complete
                      ? 'border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/12 dark:text-[#b8bdff]'
                      : 'border-[#dedbea] bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/3 dark:text-slate-600'
                  )}
                  animate={
                    reduceMotion || !complete ? undefined : { scale: [0.96, 1], opacity: [0.7, 1] }
                  }
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {complete ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </m.span>
                <span
                  className={cn(MICRO, complete ? 'text-slate-700 dark:text-slate-200' : MUTED)}
                >
                  {step.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[#dedbea] dark:bg-white/8">
          <m.div
            className="h-full rounded-full bg-[#5a63df] dark:bg-[#8f97ff]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
          />
        </div>
        <p
          role="status"
          aria-live="polite"
          className={cn('mt-2 text-[11.5px] font-semibold', MUTED)}
        >
          {ASSEMBLY_STEPS[activeStep].label}
        </p>
      </div>
    </div>
  );
}

function PlanOption({ tier, recommended, onSelect }) {
  const option = PLAN_OPTIONS[tier];
  const PlanIcon = option.icon;

  return (
    <article
      className={cn(
        TILE,
        'flex min-w-0 flex-col p-3 text-left',
        recommended && 'border-[#5a63df]/35 bg-[#5a63df]/4 dark:border-[#8f97ff]/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative">
            <IconChip icon={PlanIcon} tone={option.tone} size="sm" />
            <span className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-slate-700 text-white dark:border-[#131218] dark:bg-slate-200 dark:text-slate-900">
              <LockKeyhole className="h-2 w-2" strokeWidth={2.5} />
            </span>
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-black text-slate-900 dark:text-white">{option.name}</h3>
            <p className={cn('text-[10.5px] font-medium leading-tight', MUTED)}>
              {option.description}
            </p>
          </div>
        </div>
        {recommended && <Pill tone="accent">Best fit</Pill>}
      </div>

      <ul className="mt-2.5 flex-1 space-y-1.5">
        {option.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-1.5 text-[10.5px] font-semibold leading-snug text-slate-700 dark:text-slate-300"
          >
            <Check className="mt-px h-3 w-3 shrink-0 text-[rgb(var(--signal-ok))]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(tier)}
        className={cn(
          'mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] active:scale-[0.98]',
          recommended
            ? 'bg-[#5a63df] text-white hover:bg-[#4a52c9]'
            : 'border border-[#d7d4e7] bg-white text-slate-800 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/12 dark:bg-white/4 dark:text-slate-100 dark:hover:border-[#8f97ff]/40'
        )}
      >
        Choose {option.name}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function ReadyPlan({ preview, hasPaidPlan, onUpgrade, onContinue, onOpenPlan }) {
  const recommendedTier = preview.targetBand >= 8 ? 'premium' : 'pro';

  return (
    <m.div initial={false} className="space-y-3">
      <header className="flex items-center gap-3 text-left">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[rgb(var(--signal-ok))]/20 bg-[rgb(var(--signal-ok))]/8 text-[rgb(var(--signal-ok))]">
          <BookOpenCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-xl font-black tracking-tight text-slate-900 text-balance dark:text-white">
              Your study plan is ready
            </h2>
            <Pill tone="ok">Personalized</Pill>
          </div>
          <p className={cn('mt-0.5 text-[11.5px] font-medium text-pretty', MUTED)}>
            Your choices set the starting point. Results will make it more precise.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2" aria-label="Your plan settings">
        {[
          ['Target', `Band ${preview.targetBand.toFixed(1)}`],
          ['Study week', `${preview.studyDays} days`],
          ['Weekly pace', `${preview.weeklyMinutes} min`],
        ].map(([label, value]) => (
          <div key={label} className={cn(TILE, 'min-w-0 px-2 py-2 text-center')}>
            <p className={cn(MICRO, MUTED)}>{label}</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 truncate text-[12px] font-black text-slate-900 dark:text-white'
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className={cn(PANEL, 'p-2.5')} aria-label="Your first study sequence">
        <div className="grid grid-cols-3 gap-1.5">
          {preview.planItems.map((item, index) => (
            <div key={item.label} className={cn(WELL, 'min-w-0 rounded-lg px-2 py-2')}>
              <span className={cn(NUM, MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                0{index + 1}
              </span>
              <p className="mt-0.5 text-[10.5px] font-extrabold leading-tight text-slate-800 text-pretty dark:text-slate-100">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {hasPaidPlan ? (
        <button
          type="button"
          onClick={onOpenPlan}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5a63df] px-5 text-sm font-bold text-white transition-colors hover:bg-[#4a52c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] active:scale-[0.98]"
        >
          Open my AI Learning Path
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <section className={cn(WELL, 'rounded-xl p-2.5')} aria-labelledby="unlock-plan-title">
          <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-1.5">
              <LockKeyhole className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#afb5ff]" />
              <h2
                id="unlock-plan-title"
                className="text-[12px] font-extrabold text-slate-900 dark:text-white"
              >
                Unlock your adaptive plan
              </h2>
            </div>
            <span className={cn(MICRO, MUTED)}>Cancel anytime</span>
          </div>
          <div className="grid gap-2 min-[360px]:grid-cols-2">
            {Object.keys(PLAN_OPTIONS).map((tier) => (
              <PlanOption
                key={tier}
                tier={tier}
                recommended={tier === recommendedTier}
                onSelect={onUpgrade}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onContinue}
            className={cn(
              MICRO,
              'mt-1.5 inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-md text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5a63df] dark:text-slate-400 dark:hover:text-white'
            )}
          >
            Continue with free practice
            <ChevronRight className="h-3 w-3" />
          </button>
        </section>
      )}
    </m.div>
  );
}

export default function CompleteStep({
  formData,
  hasPaidPlan = false,
  onUpgrade,
  onContinue,
  onOpenPlan,
}) {
  const reduceMotion = useReducedMotion();
  const [isAssembling, setIsAssembling] = useState(true);
  const preview = useMemo(() => buildOnboardingPlanPreview(formData), [formData]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsAssembling(false), reduceMotion ? 200 : 1750);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return isAssembling ? (
    <PlanAssembly preview={preview} />
  ) : (
    <ReadyPlan
      preview={preview}
      hasPaidPlan={hasPaidPlan}
      onUpgrade={onUpgrade}
      onContinue={onContinue}
      onOpenPlan={onOpenPlan}
    />
  );
}
