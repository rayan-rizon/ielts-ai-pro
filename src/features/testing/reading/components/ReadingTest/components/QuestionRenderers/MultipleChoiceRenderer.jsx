import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

const MultipleChoiceRenderer = memo(function MultipleChoiceRenderer({
  question,
  answers,
  onAnswerChange,
  isFinished,
  validationMap,
}) {
  if (
    question.type !== 'multiple_choice' ||
    !question.options ||
    !Array.isArray(question.options)
  ) {
    return null;
  }

  const isMultiSelect = question.allow_multiple || question.question_count > 1;
  const questionCount = question.question_count || 1;
  const startNum = question.question_number || 1;
  const endNum = startNum + questionCount - 1;
  const questionRange = questionCount > 1 ? `${startNum}-${endNum}` : startNum;

  // For multi-select, answers are stored as an array or comma-separated string
  const getSelectedAnswers = () => {
    const ans = answers[question.id];
    if (!ans) return [];
    if (Array.isArray(ans)) return ans;
    if (typeof ans === 'string') {
      try {
        if (ans.trim().startsWith('[')) {
          const parsed = JSON.parse(ans);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        // Fallback to comma split
      }
      return ans.split(',').map((a) => a.trim());
    }
    return [];
  };

  const selectedAnswers = isMultiSelect ? getSelectedAnswers() : [];

  const handleMultiSelectChange = (option, checked) => {
    let newAnswers = [...selectedAnswers];
    const optionLetter = option.match(/^([A-E])/)?.[1] || option;

    if (checked) {
      if (!newAnswers.includes(optionLetter)) {
        newAnswers.push(optionLetter);
      }
    } else {
      newAnswers = newAnswers.filter((a) => a !== optionLetter);
    }

    // Sort alphabetically and store
    newAnswers.sort();
    onAnswerChange(question.id, newAnswers.join(', '));
  };

  const isOptionSelected = (option) => {
    if (isMultiSelect) {
      const optionLetter = option.match(/^([A-E])/)?.[1] || option;
      return selectedAnswers.includes(optionLetter);
    }
    return answers[question.id] === option;
  };

  const correctAnswersList = useMemo(() => {
    if (!isFinished || !validationMap) return [];
    if (isMultiSelect) {
      let correct = [];
      Object.keys(validationMap).forEach((key) => {
        if (key.startsWith(`${question.id}_multi_`)) {
          correct.push(validationMap[key].correctAnswer);
        }
      });
      return correct.filter(Boolean);
    } else {
      return [validationMap[question.id]?.correctAnswer].filter(Boolean);
    }
  }, [isFinished, validationMap, isMultiSelect, question.id]);

  const parseOption = (optionStr, index) => {
    const fallbackLetter = String.fromCharCode(65 + index);
    if (!optionStr || typeof optionStr !== 'string') {
      return { letter: fallbackLetter, body: optionStr || '' };
    }
    const match = optionStr.match(/^([A-Z])[\.\)\s]\s*(.*)/i);
    if (match) {
      return { letter: match[1].toUpperCase(), body: match[2].trim() || optionStr };
    }
    return { letter: fallbackLetter, body: optionStr };
  };

  return (
    <div className="mt-2.5 space-y-1 ml-0.5 sm:ml-1" data-oid="gt9t:w6">
      {/* Options */}
      {question.options.map((option, index) => {
        const { letter, body } = parseOption(option, index);
        const isSelected = isOptionSelected(option);

        // Find if this specific option is one of the correct answers
        const isActualCorrect =
          isFinished && correctAnswersList.some((ans) => isAnswerCorrect(letter, ans));

        let labelClass =
          'flex items-center gap-2.5 px-2.5 py-1 rounded-lg border transition-all duration-150 relative overflow-hidden select-none group ';
        let badgeClass =
          'w-[18px] h-[18px] min-w-[18px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 ';

        if (isFinished) {
          labelClass += 'cursor-not-allowed opacity-100 ';
          if (isSelected) {
            const isCorrectSelection = isMultiSelect
              ? isActualCorrect
              : validationMap[question.id]?.isCorrect === true;

            if (isCorrectSelection) {
              labelClass +=
                'bg-emerald-50/80 border-emerald-500/60 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-500/40 dark:text-emerald-200 font-semibold';
              badgeClass += 'bg-emerald-600 text-white dark:bg-emerald-500';
            } else {
              labelClass +=
                'bg-rose-50/80 border-rose-500/60 text-rose-950 dark:bg-rose-950/30 dark:border-rose-500/40 dark:text-rose-200 font-semibold';
              badgeClass += 'bg-rose-600 text-white dark:bg-rose-500';
            }
          } else if (isActualCorrect) {
            labelClass +=
              'bg-emerald-50/30 border-emerald-400/50 border-dashed text-emerald-800 dark:bg-emerald-950/15 dark:border-emerald-500/35 dark:text-emerald-300 font-medium';
            badgeClass +=
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
          } else {
            labelClass +=
              'border-[#ebeaf7] dark:border-white/[0.05] bg-transparent text-slate-400 dark:text-slate-500';
            badgeClass += 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-600';
          }
        } else {
          labelClass += 'cursor-pointer ';
          if (isSelected) {
            labelClass +=
              'bg-[#5a63df]/[0.08] border-[#5a63df]/35 text-[#3a3f9e] dark:bg-[#5a63df]/[0.14] dark:border-[#5a63df]/30 dark:text-[#c9cdf3] font-medium ring-1 ring-[#5a63df]/15';
            badgeClass += 'bg-[#5a63df] text-white shadow-2xs scale-105';
          } else {
            labelClass +=
              'border-[#ebeaf7] dark:border-white/[0.06] bg-[#fbfbfe]/70 dark:bg-white/[0.02] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:border-[#5a63df]/25 dark:hover:border-[#5a63df]/25';
            badgeClass +=
              'bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300 group-hover:bg-[#5a63df]/15 dark:group-hover:bg-[#5a63df]/25 group-hover:text-[#5a63df] dark:group-hover:text-[#c9cdf3]';
          }
        }

        return (
          <label key={index} className={labelClass} data-oid="jcsdbv.">
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type={isMultiSelect ? 'checkbox' : 'radio'}
                name={
                  isMultiSelect ? `question-${question.id}-${index}` : `question-${question.id}`
                }
                value={option}
                checked={isSelected}
                onChange={(e) =>
                  isMultiSelect
                    ? handleMultiSelectChange(option, e.target.checked)
                    : onAnswerChange(question.id, e.target.value)
                }
                disabled={isFinished}
                className="sr-only"
                data-oid="mcq-input-option"
              />
              <span className={badgeClass} data-oid="mcq-badge">
                {letter}
              </span>
            </div>
            <span
              className="text-sm sm:text-[15px] leading-snug flex-1 font-medium"
              data-oid="as1ywry"
            >
              {body}
            </span>
          </label>
        );
      })}

      {/* Selection hint for multi-select */}
      {isMultiSelect && !isFinished && (
        <p
          className="text-[10px] text-muted-foreground mt-1 ml-1 uppercase tracking-tight opacity-70"
          data-oid="0_0xvnt"
        >
          Choose {questionCount} letters
          {selectedAnswers.length > 0 && (
            <span className="ml-1 text-[#5a63df] dark:text-[#a9afff] font-bold" data-oid="vn77tvr">
              ({selectedAnswers.length} SELECTED)
            </span>
          )}
        </p>
      )}
    </div>
  );
});

export default MultipleChoiceRenderer;
