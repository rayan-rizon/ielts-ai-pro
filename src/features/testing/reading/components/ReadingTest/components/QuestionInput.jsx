/**
 * QuestionInput - Renders question text with inline debounced input fields.
 * Optimized for performance: uses local state to prevent global re-renders.
 */
import React, { memo } from 'react';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { cn } from '@/lib/cn';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';

const QuestionInput = memo(function QuestionInput({
  text,
  questionId,
  globalNum,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  disabled,
  validationMap,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
}) {
  if (!text) return null;

  // Parse text for blanks (underscores or numbered placeholders)
  const parts = text.split(/(_____+|\[(\d+)\])/g);
  let blankIndex = 0;

  return (
    <div className="block leading-[2.4rem] text-foreground" data-oid="fbm4jb1">
      {parts.map((part, idx) => {
        // Skip undefined parts from regex groups
        if (part === undefined) return null;

        // Check for blank patterns
        const isUnderscore = /^_____+$/.test(part);
        const isNumbered = /^\[\d+\]$/.test(part);

        if (isUnderscore || isNumbered) {
          blankIndex++;
          const currentBlankNum = isNumbered ? parseInt(part.match(/\d+/)[0]) : blankIndex;

          const answerKey =
            parts.filter((p) => /^_____+$/.test(p) || /^\[\d+\]$/.test(p)).length > 1
              ? `${questionId}_blank_${currentBlankNum}`
              : questionId;

          const isFlagged = flaggedQuestions?.has(answerKey);
          const validation = validationMap?.[answerKey];
          const displayNum = isNumbered ? currentBlankNum : globalNum;

          let circleStatus = 'default';
          let inputClass =
            'bg-white/70 dark:bg-white/4 border border-slate-300/70 dark:border-white/8 text-foreground hover:border-slate-400/80 dark:hover:border-white/[0.14] focus-visible:ring-[#5a63df]/40 focus-visible:border-[#5a63df]/50';

          if (disabled) {
            inputClass =
              'bg-white dark:bg-white/4 border-[#e4e2f0] dark:border-white/8 text-foreground'; // fallback
            if (validation) {
              if (validation.isCorrect === true) {
                circleStatus = 'correct';
                inputClass =
                  'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold';
              } else if (answers?.[answerKey]) {
                circleStatus = 'incorrect';
                inputClass =
                  'border-rose-500 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold';
              } else {
                circleStatus = 'unanswered';
              }
            }
          }

          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 mx-1 translate-y-[-2px] align-middle"
              data-oid="37cy.vv"
            >
              <QuestionNumberCircle
                number={displayNum}
                isFlagged={isFlagged}
                onClick={() => onToggleFlag?.(answerKey)}
                status={circleStatus}
                className="shrink-0"
                data-oid="e8..gw8"
              />

              <DebouncedInput
                value={answers?.[answerKey] || ''}
                onChange={(value) => onAnswerChange?.(answerKey, value)}
                disabled={disabled}
                placeholder="answer"
                className={cn(
                  'w-28 h-7 px-2 py-0.5 text-center text-[15px] rounded-lg transition-all duration-200 shadow-sm',
                  inputClass,
                  'focus-visible:outline-none focus-visible:ring-1'
                )}
                data-oid="-m5q_eq"
              />

              {/* Inline Explanation Popover */}
              {disabled &&
                explanationData &&
                (() => {
                  const actualKey = explanationData.blanks?.[currentBlankNum]
                    ? currentBlankNum
                    : explanationData.blanks?.[displayNum]
                      ? displayNum
                      : null;
                  if (!actualKey) return null;

                  return (
                    <DeepDivePopover
                      explanationData={explanationData}
                      userAnswer={answers?.[answerKey]}
                      isOpen={openDeepDive === answerKey}
                      onToggle={() =>
                        setOpenDeepDive?.(openDeepDive === answerKey ? null : answerKey)
                      }
                      questionType="short_answer"
                      blankKey={actualKey}
                      inline={true}
                    />
                  );
                })()}
            </span>
          );
        }

        // Regular text - preserve all whitespace
        return (
          <span key={idx} className="text-[15px] font-medium" data-oid="t.i_9.z">
            {part}
          </span>
        );
      })}
    </div>
  );
});

export default QuestionInput;
