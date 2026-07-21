import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';

const MultipleChoiceRenderer = ({
  question,
  answers,
  onAnswerChange,
  onMultiSelectChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
  isInsideMergedCard,
  customCardClass,
}) => {
  const isMulti = question.allow_multiple;
  const badgeDisplay = question._displayStartNumber || question.question_number;
  const badgeEnd = question._displayEndNumber;
  const cardClass =
    customCardClass ||
    (isInsideMergedCard
      ? 'bg-transparent border-0 shadow-none my-0 py-0'
      : 'bg-white/70 dark:bg-slate-900/55 border border-slate-200/60 dark:border-slate-700/60 rounded-lg shadow-sm p-2 sm:p-2.5');

  const currentAnswer = answers[question.id];

  // Get correctness for this question (single choice only, multi-select needs per-option checks)
  const validation = correctAnswersMap[question.id];
  const isCorrect = validation?.isCorrect === true;

  // Compute status for the main circle (mostly applies to single selection)
  let circleStatus = 'default';
  if (isFinished) {
    if (isMulti) {
      // For multi-select, check if *all* required options are met
      // It's usually checked per-option in the UI, so we can just show 'unanswered' if completely empty
      const hasAnySelected = Array.isArray(currentAnswer) && currentAnswer.length > 0;
      circleStatus = hasAnySelected ? 'default' : 'unanswered';
      // Individual options will show correct/incorrect
    } else {
      circleStatus = isCorrect ? 'correct' : currentAnswer ? 'incorrect' : 'unanswered';
    }
  }

  // Get label style based on state
  const getLabelStyle = (opt, isSelected, isChecked, isActualCorrect = false) => {
    const baseStyle =
      'flex items-start gap-2.5 px-2 py-1 rounded-md border cursor-pointer transition-all duration-150 select-none group';

    if (!isFinished) {
      if (isSelected || isChecked) {
        return `${baseStyle} bg-blue-50/90 border-blue-500/80 text-blue-950 dark:bg-blue-950/40 dark:border-blue-500/60 dark:text-blue-100 font-medium shadow-xs ring-1 ring-blue-500/20`;
      }
      return `${baseStyle} border-transparent bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:border-slate-200/60 dark:hover:border-slate-700/60`;
    }

    // Review mode
    if (isSelected || isChecked) {
      if (isActualCorrect) {
        return `${baseStyle} bg-emerald-50/90 border-emerald-500 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/70 dark:text-emerald-200 font-semibold shadow-xs`;
      } else {
        return `${baseStyle} bg-rose-50/90 border-rose-500 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500/70 dark:text-rose-200 font-semibold shadow-xs`;
      }
    } else if (isActualCorrect) {
      // Indicate what the *actual* correct answer was
      return `${baseStyle} bg-emerald-50/40 border-emerald-400/70 border-dashed text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-500/50 dark:text-emerald-300 font-medium`;
    }

    return `${baseStyle} border-transparent bg-transparent text-slate-400 dark:text-slate-500 opacity-70`;
  };

  // Extract correct answers for highlighting
  let actualCorrectAnswers = [];
  if (isFinished && question.correct_answer) {
    if (Array.isArray(question.correct_answer)) {
      actualCorrectAnswers = question.correct_answer;
    } else if (typeof question.correct_answer === 'string') {
      try {
        const parsed = JSON.parse(question.correct_answer);
        actualCorrectAnswers = Array.isArray(parsed) ? parsed : question.correct_answer.split(',');
      } catch (e) {
        actualCorrectAnswers = question.correct_answer.split(',');
      }
    }
    // Normalize format to upper case or trim if needed
    actualCorrectAnswers = actualCorrectAnswers.map((a) => a.trim().toUpperCase());
  }

  // Check if an option is the actual correct answer
  const checkIsActualCorrect = (opt) => {
    if (!isFinished) return false;

    // Some options have the letter prefix e.g. "A. Something"
    const optLetterMatch = String(opt).match(/^([A-Za-z])(?:[.\s]|$)/);
    const optLetter = optLetterMatch ? optLetterMatch[1].toUpperCase() : String(opt).toUpperCase();

    // Ensure direct matching if the original actual correct format matches the whole text
    if (actualCorrectAnswers.some((a) => a === String(opt).toUpperCase() || a === optLetter)) {
      return true;
    }

    return false;
  };

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
    <div key={question.id} id={`question-${question.id}`} className={cardClass} data-oid="triy0j7">
      <div className={isInsideMergedCard ? 'px-0 py-0.5' : 'p-2'} data-oid="1j93:1x">
        <div className="flex gap-3 items-start" data-oid="qq-r_lg">
          <QuestionNumberCircle
            number={
              badgeEnd && badgeEnd !== badgeDisplay ? `${badgeDisplay}-${badgeEnd}` : badgeDisplay
            }
            isFlagged={flaggedQuestions.has(question.id)}
            onClick={() => toggleFlag(question.id)}
            status={circleStatus}
            className="mt-0.5"
            data-oid="g.xzx6i"
          />

          <div className="flex-1" data-oid="9ce8g0m">
            <p
              className="text-[15px] font-medium text-foreground leading-relaxed mb-1.5"
              data-oid="qh4yas3"
            >
              {question.question_text}
            </p>

            {isMulti ? (
              <div className="space-y-1 ml-0.5" data-oid="304zzy-">
                {question.options.map((opt, idx) => {
                  const { letter, body } = parseOption(opt, idx);
                  const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
                  const isActualCorrect = checkIsActualCorrect(opt);

                  const rawCount = question.question_count ? parseInt(question.question_count) : 0;
                  const limit =
                    rawCount > 1
                      ? rawCount
                      : Array.isArray(question.correct_answer) && question.correct_answer.length > 1
                        ? question.correct_answer.length
                        : 2;

                  const id = `${question.id}-${idx}`;

                  let badgeClass =
                    'w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 mt-0.5 ';
                  if (isFinished) {
                    if (isChecked && isActualCorrect) badgeClass += 'bg-emerald-600 text-white dark:bg-emerald-500';
                    else if (isChecked) badgeClass += 'bg-rose-600 text-white dark:bg-rose-500';
                    else if (isActualCorrect) badgeClass += 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
                    else badgeClass += 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600';
                  } else if (isChecked) {
                    badgeClass += 'bg-blue-600 text-white dark:bg-blue-500 shadow-xs scale-105';
                  } else {
                    badgeClass += 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-700 dark:group-hover:text-blue-300';
                  }

                  return (
                    <label
                      key={idx}
                      htmlFor={id}
                      className={getLabelStyle(opt, false, isChecked, isActualCorrect)}
                      data-oid="9v-kz03"
                    >
                      <input
                        type="checkbox"
                        id={id}
                        checked={isChecked}
                        onChange={(e) =>
                          !isFinished && onMultiSelectChange(question.id, opt, e.target.checked, limit)
                        }
                        disabled={isFinished}
                        className="sr-only"
                        data-oid="gy78z.3"
                      />

                      <span className={badgeClass} data-oid="mcq-badge">
                        {letter}
                      </span>

                      <span
                        className="text-[13.5px] sm:text-sm font-medium leading-tight text-slate-700 dark:text-slate-300 flex-1 pt-0.5"
                        data-oid="0yu_48m"
                      >
                        {body}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div
                className="space-y-1 ml-0.5"
                role="radiogroup"
                data-oid="feq15vq"
              >
                {question.options.map((opt, idx) => {
                  const { letter, body } = parseOption(opt, idx);
                  const isSelected = currentAnswer === opt;
                  const isActualCorrect = checkIsActualCorrect(opt);
                  const id = `${question.id}-${idx}`;

                  let badgeClass =
                    'w-5 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0 mt-0.5 ';
                  if (isFinished) {
                    if (isSelected && isActualCorrect) badgeClass += 'bg-emerald-600 text-white dark:bg-emerald-500';
                    else if (isSelected) badgeClass += 'bg-rose-600 text-white dark:bg-rose-500';
                    else if (isActualCorrect) badgeClass += 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
                    else badgeClass += 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600';
                  } else if (isSelected) {
                    badgeClass += 'bg-blue-600 text-white dark:bg-blue-500 shadow-xs scale-105';
                  } else {
                    badgeClass += 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-700 dark:group-hover:text-blue-300';
                  }

                  return (
                    <label
                      key={idx}
                      htmlFor={id}
                      className={getLabelStyle(opt, isSelected, false, isActualCorrect)}
                      data-oid="xj0v2v8"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={opt}
                        id={id}
                        checked={isSelected}
                        onChange={() => !isFinished && onAnswerChange(question.id, opt)}
                        disabled={isFinished}
                        className="sr-only"
                        data-oid="zuduu96"
                      />
                      <span className={badgeClass} data-oid="mcq-badge">
                        {letter}
                      </span>
                      <span
                        className="text-[13.5px] sm:text-sm font-medium leading-tight text-slate-700 dark:text-slate-300 flex-1 pt-0.5"
                        data-oid="53qno_v"
                      >
                        {body}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceRenderer;
