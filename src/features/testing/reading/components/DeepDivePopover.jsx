import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lightbulb, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { IconChip, MICRO, TILE, PANEL, Pill } from '@/features/dashboard/components/primitives.jsx';
import { answerChoices, wrongOptions, temptingAnswer } from '../utils/readingExplanations';

export function ExplanationBody({ entries, userAnswer }) {
  const chosen = answerChoices(userAnswer);
  return (
    <div className="max-h-[min(70dvh,560px)] space-y-4 overflow-y-auto overflow-x-hidden p-3.5">
      {entries.map(({ key, data }, index) => {
        const wrong = wrongOptions(data);
        const chosenWrong = Object.entries(wrong).filter(([option]) =>
          chosen.includes(option.toUpperCase())
        );
        const otherWrong = Object.entries(wrong).filter(
          ([option]) => !chosen.includes(option.toUpperCase())
        );
        const mappings = data.synonym_map || [];
        const correct = answerChoices(data.correct_answer);
        const answerLabel = correct.length ? correct.join(' / ') : data.correct_answer;
        const tempting = temptingAnswer(data);
        return (
          <section
            key={key ?? index}
            aria-label={key ? `Explanation for question ${key}` : 'Answer explanation'}
            className="space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#8f97ff]')}>
                {key ? `Question ${key}` : 'Answer explanation'}
              </span>
              {answerLabel && (
                <Pill tone="ok" className="max-w-full whitespace-normal break-words">
                  Answer: {answerLabel}
                </Pill>
              )}
            </div>
            <div className={cn(TILE, 'p-3 space-y-1.5')}>
              <div className="flex items-center gap-1.5">
                <IconChip icon={Lightbulb} tone="accent" size="sm" />
                <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
                  Why this answer fits
                </span>
              </div>
              <p className="text-[13px] font-medium leading-relaxed text-slate-800 dark:text-slate-100 break-words">
                {data.why_correct}
              </p>
            </div>
            {typeof data.trap === 'string' && data.trap.trim() && (
              <div className="flex items-start gap-2 rounded-md bg-[rgb(var(--signal-warn)/0.07)] px-2.5 py-2">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-warn))]"
                  aria-hidden="true"
                />
                <div className="min-w-0 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200 break-words">
                  {tempting && (
                    <p className="mb-1">
                      <span className="font-bold">Tempting answer: </span>
                      {tempting}
                    </p>
                  )}
                  <p>
                    <span className="font-bold">Common trap: </span>
                    {data.trap}
                  </p>
                </div>
              </div>
            )}
            {chosenWrong.map(([option, reason]) => (
              <div key={option} className={cn(TILE, 'p-3 border-[rgb(var(--signal-warn)/0.3)]')}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IconChip icon={AlertTriangle} tone="amber" size="sm" />
                  <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>
                    Your answer: {option}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 break-words">
                  {reason}
                </p>
              </div>
            ))}
            {mappings.length > 0 && (
              <details className={cn(TILE, 'p-2.5')}>
                <summary className="cursor-pointer rounded-sm text-[12px] font-bold text-[#5a63df] dark:text-[#a8afff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  Key wording
                </summary>
                <div className="mt-2.5 space-y-2.5">
                  {mappings.map((mapping, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-start gap-2 text-[12px] leading-relaxed">
                        <Target
                          className="mt-1 h-3 w-3 shrink-0 text-[#5a63df]"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 break-words text-slate-700 dark:text-slate-200">
                          {mapping.question_keyword}
                        </span>
                        <ArrowRight
                          className="mt-1 h-3 w-3 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 break-words text-[rgb(var(--signal-ok))]">
                          {mapping.passage_keyword}
                        </span>
                      </div>
                      {mapping.connection && (
                        <p className="pl-5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {mapping.connection}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
            {otherWrong.length > 0 && (
              <details className={cn(TILE, 'p-2.5')}>
                <summary className="cursor-pointer rounded-sm text-[12px] font-bold text-slate-700 dark:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                  Why other answers do not fit
                </summary>
                <div className="mt-2.5 space-y-2.5">
                  {otherWrong.map(([option, reason]) => (
                    <div key={option} className="flex items-start gap-2">
                      <Pill tone="neutral" className="shrink-0">
                        {option}
                      </Pill>
                      <p className="min-w-0 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300 break-words">
                        {reason}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}

const DeepDivePopover = ({
  explanationData,
  userAnswer,
  isOpen,
  onToggle,
  blankKey,
  questionNumber,
  inline = false,
}) => {
  const entries = useMemo(() => {
    if (!explanationData) return [];
    if (explanationData.blanks) {
      const stripped = blankKey != null ? String(blankKey).replace(/^(gap_|blank_)/, '') : null;
      if (stripped) {
        const data = explanationData.blanks[blankKey] || explanationData.blanks[stripped];
        return data ? [{ key: stripped, data }] : [];
      }
      return Object.entries(explanationData.blanks)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([key, data]) => ({ key, data }));
    }
    return [{ key: questionNumber != null ? String(questionNumber) : null, data: explanationData }];
  }, [explanationData, blankKey, questionNumber]);

  React.useEffect(() => {
    if (!isOpen || !entries.length) return;
    const keys = entries.map((entry) => entry.key).filter(Boolean);
    if (keys.length)
      window.dispatchEvent(
        new CustomEvent('set-passage-highlight', { detail: { type: 'specific', keys } })
      );
  }, [isOpen, entries]);

  if (!entries.length) return null;
  const label =
    entries[0].key && entries.length === 1
      ? `Explain question ${entries[0].key}`
      : 'Show answer explanation';
  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (open !== isOpen) onToggle();
      }}
    >
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          aria-label={label}
          initial={false}
          whileTap={{ scale: 0.98 }}
          className={cn(
            inline
              ? 'inline-flex h-7 w-7 ml-2 align-middle items-center justify-center rounded-md border border-[#5a63df]/30 bg-[#5a63df]/8 text-[#5a63df] dark:text-[#a8afff] dark:border-[#8f97ff]/30'
              : 'w-full mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#e4e2f0] dark:border-white/[0.07] text-xs font-semibold text-slate-700 dark:text-slate-200',
            'hover:bg-[#5a63df]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a63df] focus-visible:outline-offset-2 transition-colors'
          )}
          data-oid="deep-dive-trigger"
        >
          {inline ? (
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <>
              <span className="flex items-center gap-2">
                <IconChip icon={Sparkles} tone="accent" size="sm" />
                Answer explanation
              </span>
              {entries.length > 1 && <Pill tone="accent">{entries.length} questions</Pill>}
            </>
          )}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align={inline ? 'end' : 'start'}
        sideOffset={8}
        collisionPadding={16}
        className={cn(
          PANEL,
          'relative z-100 w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden p-0 shadow-none'
        )}
        data-oid="deep-dive-content"
      >
        <ExplanationBody entries={entries} userAnswer={userAnswer} />
      </PopoverContent>
    </Popover>
  );
};
export default DeepDivePopover;
