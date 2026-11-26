import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, Pill } from '@/features/dashboard/components/primitives.jsx';
import { numberRange } from '../practiceNumbering';

function steps(isListening) {
  return [isListening ? 'Listen again' : 'Find proof', 'Answer below', 'See why'];
}

/** Says what this screen is, which questions to answer, and what happens next. */
export default function RetryGuide({ numbers, isListening }) {
  return (
    <section
      aria-label="Retry guide"
      className="mb-3 rounded-xl border border-amber-500/30 bg-amber-50/70 p-3 dark:border-amber-400/25 dark:bg-amber-500/[0.07]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100">
          <RotateCcw size={13} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
          You got these wrong last time
        </h2>
        <Pill tone="warn">Practice only, not scored</Pill>
      </div>
      <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">
        <strong>{numberRange(numbers)}</strong> from an earlier test — try again before seeing the
        answer.
      </p>
      <ol className={cn('mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] font-semibold', MUTED)}>
        {steps(isListening).map((step, index) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
