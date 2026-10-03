import { MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';

const steps = [
  ['Apply', 'Submit your institution details.'],
  ['Admin review', 'Our team will review your request.'],
  ['Owner invitation', 'If approved, we’ll send an invitation to your institution’s owner.'],
];

export default function InstitutionApprovalSteps() {
  return (
    <ol aria-label="Institution approval steps" className="grid gap-5 sm:grid-cols-3 sm:gap-6">
      {steps.map(([title, description], index) => {
        const isCurrent = index === 0;
        return (
          <li key={title} className="relative flex items-start gap-3">
            <span
              className={cn(
                NUM,
                'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-all duration-200',
                isCurrent
                  ? 'border-[#5a63df] bg-[#5a63df] text-white shadow-xs'
                  : 'border-stone-200/80 bg-stone-100/70 text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-400'
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <h2
                  className={cn(
                    MICRO,
                    'whitespace-nowrap font-bold tracking-wider',
                    isCurrent
                      ? 'text-[#5a63df] dark:text-[#bfc3ff]'
                      : 'text-stone-600 dark:text-stone-300'
                  )}
                >
                  {title}
                </h2>
                {isCurrent && (
                  <span className="rounded-full bg-[#5a63df]/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#bfc3ff]">
                    Active
                  </span>
                )}
                {index < 2 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-stone-200/80 sm:block dark:bg-white/10"
                  />
                )}
              </div>
              <p className={cn(MUTED, 'mt-1 text-xs leading-relaxed')}>{description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
