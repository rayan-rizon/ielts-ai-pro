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
    <div className="flex gap-2 flex-wrap mt-2 justify-start ml-10" data-oid="qu01ivn">
      {options.map((option) => {
        const isSelected = answers[question.id] === option;
        const validation = validationMap?.[question.id];
        const isActualCorrect =
          isFinished && validation && isAnswerCorrect(option, validation.correctAnswer);

        let optionClass =
          'flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-all duration-300 relative overflow-hidden ';
        let radioClass =
          "appearance-none w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 relative after:content-[''] after:absolute after:inset-[2px] after:rounded-full after:scale-0 checked:after:scale-100 after:transition-transform ";

        if (isFinished) {
          optionClass += 'cursor-not-allowed opacity-100 ';
          if (isSelected) {
            if (validation?.isCorrect === true) {
              optionClass +=
                'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm';
              radioClass +=
                'border-emerald-500 checked:border-emerald-600 dark:checked:border-emerald-400 after:bg-emerald-600 dark:after:bg-emerald-400';
            } else {
              optionClass +=
                'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400 font-bold shadow-sm';
              radioClass +=
                'border-rose-500 checked:border-rose-600 dark:checked:border-rose-400 after:bg-rose-600 dark:after:bg-rose-400';
            }
          } else if (isActualCorrect) {
            // Highlight the correct answer if the user missed it
            optionClass +=
              'bg-emerald-500/5 border-emerald-500/40 text-emerald-700/80 dark:text-emerald-400/80 font-semibold border-dashed';
            radioClass += 'border-emerald-400/50 dark:border-emerald-500/50';
          } else {
            optionClass +=
              'bg-slate-50/50 border-slate-200/60 dark:bg-slate-900/40 dark:border-slate-800 text-slate-400 dark:text-slate-500';
            radioClass += 'border-slate-300 dark:border-slate-600';
          }
        } else {
          optionClass += 'cursor-pointer backdrop-blur-sm ';
          radioClass +=
            'border-slate-300 dark:border-slate-600 checked:border-blue-500 dark:checked:border-blue-400 after:bg-blue-500 dark:after:bg-blue-400 focus:ring-blue-500/20';

          if (isSelected) {
            optionClass +=
              'bg-blue-600/10 border-blue-500 text-blue-700 dark:bg-blue-500/20 dark:border-blue-400 dark:text-blue-100 font-semibold shadow-sm ring-1 ring-blue-500/20';
          } else {
            optionClass +=
              'bg-white/60 border-slate-200 text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 hover:scale-[1.02] active:scale-[0.98]';
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
              className={radioClass}
              disabled={isFinished}
              data-oid="y4imoyv"
            />

            {isSelected && !isFinished && (
              <div
                className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/5 animate-pulse pointer-events-none"
                data-oid="5:ca8e7"
              />
            )}
            <span className="text-sm tracking-wide relative z-10" data-oid=".eweqmm">
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
});

export default TrueFalseRenderer;
