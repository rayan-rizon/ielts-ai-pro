import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MUTED } from '@/features/dashboard/components/primitives.jsx';

export const LINK = 'font-semibold text-[#5a63df] hover:underline dark:text-[#afb5ff]';

const SEEN_NOTES = {
  familiar: 'You have seen this passage or audio before.',
  repeated: 'You have answered these questions before. Use them for revision.',
};

/** What starting this set costs the learner, kept calm and one line long. */
export function SetNote({ set }) {
  const seen = SEEN_NOTES[set.familiarity];
  if (seen) {
    return (
      <p className={`text-[11px] leading-relaxed ${MUTED}`}>
        {seen} Your full-test result stays separate.
      </p>
    );
  }
  return (
    <details className={`text-[11px] leading-relaxed ${MUTED}`}>
      <summary className="cursor-pointer">
        Part of this source test will count as practised.{' '}
        <span className={LINK}>What this means</span>
      </summary>
      <p className="mt-1">
        This marks the source Cambridge test as partly practised, so save it for a clean mock if you
        want one. Your full-test result stays separate.
      </p>
    </details>
  );
}

export function StartButton({ set, busy, canStart, onStart }) {
  const label = set.familiarity === 'repeated' ? 'Practise again' : 'Start practice';
  return (
    <Button
      size="sm"
      className="h-[42px] w-full shrink-0 rounded-lg bg-[#5a63df] px-5 font-bold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#4f58d4] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#5a63df] sm:w-auto"
      disabled={busy || !canStart}
      onClick={() => onStart(set)}
    >
      {busy ? 'Opening your set…' : label}
      <ArrowRight size={14} className="ml-1.5" aria-hidden="true" />
    </Button>
  );
}
