import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { MUTED, NUM, PANEL } from '@/features/dashboard/components/primitives.jsx';

const SAVE_TEXT = {
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved yet. We will try again when you change an answer.',
};

function NumberStrip({ slots, onJump }) {
  return (
    <ul className="flex max-w-full gap-1 overflow-x-auto p-0.5">
      {slots.map((slot) => (
        <li key={slot.id} className="shrink-0">
          <button
            type="button"
            aria-label={`Go to question ${slot.number}, ${slot.answered ? 'answered' : 'blank'}`}
            onClick={() => onJump(slot)}
            className={cn(
              NUM,
              'h-8 min-w-8 rounded-md border px-1 text-[11px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
              slot.answered
                ? 'border-[#5a63df] bg-[#5a63df] text-white'
                : 'border-[#e4e2f0] dark:border-white/10'
            )}
          >
            {slot.number}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Progress, save state and submit, kept in reach while the learner scrolls. */
export default function SessionProgressBar({ slots, answers, saveState, busy, onJump, onSubmit }) {
  // Remembering which answers were warned about resets the warning on any change.
  const [warnedFor, setWarnedFor] = useState(null);
  const done = slots.filter((slot) => slot.answered).length;
  const blank = slots.length - done;
  const warned = warnedFor === answers && blank > 0;
  const submit = () => {
    if (blank > 0 && !warned) setWarnedFor(answers);
    else onSubmit();
  };
  return (
    <div className="sticky bottom-0 z-20 pb-[env(safe-area-inset-bottom,0px)]">
      <div className={cn(PANEL, 'space-y-2 border-[#5a63df]/40 p-2.5 sm:p-3')}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <NumberStrip slots={slots} onJump={onJump} />
          <p className={`text-xs ${MUTED}`}>
            <span>
              {done} of {slots.length} answered
            </span>
            {SAVE_TEXT[saveState] && <span className="ml-2">{SAVE_TEXT[saveState]}</span>}
          </p>
          <Button disabled={busy} onClick={submit} className="ml-auto shrink-0 gap-1.5">
            Check my answers
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
        {warned && (
          <p role="status" className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {`${blank} still blank. Press Check my answers again to submit.`}
          </p>
        )}
      </div>
    </div>
  );
}
