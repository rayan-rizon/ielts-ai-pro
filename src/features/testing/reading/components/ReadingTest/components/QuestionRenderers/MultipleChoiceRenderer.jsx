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

  return (
    <div className="space-y-2 ml-10" data-oid="gt9t:w6">
      {/* Options */}
      {question.options.map((option, index) => {
        const isSelected = isOptionSelected(option);
        const optionLetter = option.match(/^([A-E])/)?.[1] || option;

        // Find if this specific option is one of the correct answers
        const isActualCorrect =
          isFinished && correctAnswersList.some((ans) => isAnswerCorrect(optionLetter, ans));

        let labelClass =
          'flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 relative overflow-hidden ';
        let inputClass = isMultiSelect
          ? "appearance-none w-4 h-4 rounded-md border-2 transition-all duration-300 focus:outline-none focus:ring-2 relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white after:text-[10px] after:font-bold after:opacity-0 checked:after:opacity-100 "
          : "appearance-none w-4 h-4 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 relative after:content-[''] after:absolute after:inset-[2px] after:rounded-full after:scale-0 checked:after:scale-100 after:transition-transform ";

        if (isFinished) {
          labelClass += 'cursor-not-allowed opacity-100 ';
          if (isSelected) {
            // For multi-select, if it's selected AND in the correct list, it's correct.
            // For single-select, just check validationMap[question.id].isCorrect
            const isCorrectSelection = isMultiSelect
              ? isActualCorrect
              : validationMap[question.id]?.isCorrect === true;

            if (isCorrectSelection) {
              labelClass +=
                'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm';
              inputClass +=
                'border-emerald-500 checked:border-emerald-600 dark:checked:border-emerald-400 checked:bg-emerald-600 dark:checked:bg-emerald-400';
              if (!isMultiSelect) inputClass += ' after:bg-emerald-600 dark:after:bg-emerald-400';
            } else {
              labelClass +=
                'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400 font-bold shadow-sm';
              inputClass +=
                'border-rose-500 checked:border-rose-600 dark:checked:border-rose-400 checked:bg-rose-600 dark:checked:bg-rose-400';
              if (!isMultiSelect) inputClass += ' after:bg-rose-600 dark:after:bg-rose-400';
            }
          } else if (isActualCorrect) {
            labelClass +=
              'bg-emerald-500/5 border-emerald-500/40 text-emerald-700/80 dark:text-emerald-400/80 font-semibold border-dashed';
            inputClass += 'border-emerald-400/50 dark:border-emerald-500/50';
          } else {
            labelClass +=
              'bg-slate-50/50 border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800 text-slate-400 dark:text-slate-500';
            inputClass += 'border-slate-300 dark:border-slate-600';
          }
        } else {
          labelClass += 'cursor-pointer backdrop-blur-sm ';
          inputClass +=
            'border-slate-300 dark:border-slate-600 checked:border-blue-500 dark:checked:border-blue-400 checked:bg-blue-500 dark:checked:bg-blue-400 focus:ring-blue-500/20';
          if (!isMultiSelect)
            inputClass +=
              ' after:bg-blue-500 dark:after:bg-blue-400 checked:bg-transparent dark:checked:bg-transparent'; // radio specific

          if (isSelected) {
            labelClass +=
              'bg-blue-600/10 border-blue-500 text-blue-700 dark:bg-blue-500/20 dark:border-blue-400 dark:text-blue-100 font-semibold shadow-sm ring-1 ring-blue-500/20';
          } else {
            labelClass +=
              'bg-white/60 border-slate-200 text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 hover:scale-[1.005] active:scale-[0.995]';
          }
        }

        return (
          <label key={index} className={labelClass} data-oid="jcsdbv.">
            {isMultiSelect ? (
              <input
                type="checkbox"
                name={`question-${question.id}-${index}`}
                value={option}
                checked={isSelected}
                onChange={(e) => handleMultiSelectChange(option, e.target.checked)}
                className={inputClass}
                disabled={isFinished}
                data-oid="qyle9xz"
              />
            ) : (
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={isSelected}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className={inputClass}
                disabled={isFinished}
                data-oid="wrk:0e:"
              />
            )}
            {isSelected && !isFinished && (
              <div
                className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 animate-pulse pointer-events-none"
                data-oid="v92amr."
              />
            )}
            <span className="text-sm font-medium tracking-wide relative z-10" data-oid="as1ywry">
              {option}
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
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold" data-oid="vn77tvr">
              ({selectedAnswers.length} SELECTED)
            </span>
          )}
        </p>
      )}
    </div>
  );
});

export default MultipleChoiceRenderer;
