import React, { memo } from 'react';
import { isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

const TrueFalseRenderer = memo(function TrueFalseRenderer({
  question,
  answers,
  onAnswerChange,
  isFinished,
  validationMap,
}) {
  if (question.type !== 'true_false_not_given' && question.type !== 'yes_no_not_given') {
    return null;
  }

  const options =
    question.type === 'true_false_not_given'
      ? ['True', 'False', 'Not Given']
      : ['Yes', 'No', 'Not Given'];

  return (
    <div className="flex gap-2 flex-wrap mt-2.5 justify-start ml-0.5 sm:ml-1" data-oid="qu01ivn">
      {options.map((option) => {
        const isSelected = answers[question.id] === option;
        const validation = validationMap?.[question.id];
        const isActualCorrect =
          isFinished && validation && isAnswerCorrect(option, validation.correctAnswer);

        let optionClass =
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm sm:text-[15px] font-medium transition-all duration-150 select-none cursor-pointer ';
        let dotClass =
          'w-3.5 h-3.5 rounded-full border transition-all shrink-0 flex items-center justify-center ';

        if (isFinished) {
          optionClass += 'cursor-not-allowed opacity-100 ';
          if (isSelected) {
            if (validation?.isCorrect === true) {
              optionClass +=
                'bg-emerald-50/90 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/70 dark:text-emerald-200 font-semibold shadow-xs';
              dotClass += 'border-emerald-600 bg-emerald-600';
            } else {
              optionClass +=
                'bg-rose-50/90 border-rose-500 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500/70 dark:text-rose-200 font-semibold shadow-xs';
              dotClass += 'border-rose-600 bg-rose-600';
            }
          } else if (isActualCorrect) {
            optionClass +=
              'bg-emerald-50/40 border-emerald-400/70 border-dashed text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500/50 dark:text-emerald-300 font-medium';
            dotClass += 'border-emerald-500/60 bg-emerald-500/20';
          } else {
            optionClass +=
              'bg-slate-50/50 border-slate-200/50 dark:bg-slate-900/30 dark:border-slate-800/80 text-slate-400 dark:text-slate-500';
            dotClass += 'border-slate-300 dark:border-slate-700 bg-transparent';
          }
        } else {
          if (isSelected) {
            optionClass +=
              'bg-[#5a63df]/10 border-[#5a63df]/60 text-[#3a3f9e] dark:bg-[#5a63df]/20 dark:border-[#5a63df]/50 dark:text-[#c9cdf3] font-semibold shadow-xs ring-1 ring-[#5a63df]/20';
            dotClass += 'border-[#5a63df] bg-[#5a63df]';
          } else {
            optionClass +=
              'bg-white/80 border-slate-200/90 text-slate-700 dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-[#5a63df]/40 dark:hover:border-[#5a63df]/40';
            dotClass += 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900';
          }
        }

        return (
          <label key={option} className={optionClass} data-oid="chn.ts_">
            <input
              type="radio"
              name={`q_${question.id}`}
              value={option}
              checked={isSelected}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              className="sr-only"
              disabled={isFinished}
              data-oid="y4imoyv"
            />
            <span className={dotClass}>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <span className="relative z-10" data-oid=".eweqmm">
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
});

export default TrueFalseRenderer;
