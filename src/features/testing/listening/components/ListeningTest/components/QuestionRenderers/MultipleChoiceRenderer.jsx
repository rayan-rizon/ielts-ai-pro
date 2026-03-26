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
  cardClass,
}) => {
  const isMulti = question.allow_multiple;
  const badgeDisplay = question._displayStartNumber || question.question_number;
  const badgeEnd = question._displayEndNumber;

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
      'flex items-start space-x-3 p-1.5 rounded-md border cursor-pointer transition-colors';

    if (!isFinished) {
      if (isSelected || isChecked) {
        return `${baseStyle} bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800`;
      }
      return `${baseStyle} bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50`;
    }

    // Review mode
    if (isSelected || isChecked) {
      if (isActualCorrect) {
        return `${baseStyle} bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700`;
      } else {
        return `${baseStyle} bg-rose-50 border-rose-300 dark:bg-rose-900/30 dark:border-rose-700`;
      }
    } else if (isActualCorrect) {
      // Indicate what the *actual* correct answer was
      return `${baseStyle} bg-emerald-50/50 border-emerald-300 border-dashed dark:bg-emerald-900/10 dark:border-emerald-600/50`;
    }

    return `${baseStyle} bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-70`;
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

  return (
    <div key={question.id} id={`question-${question.id}`} className={cardClass} data-oid="triy0j7">
      <div className={isInsideMergedCard ? 'px-0 pt-1 pb-0' : 'p-2'} data-oid="1j93:1x">
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
              className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-1.5 leading-relaxed"
              data-oid="qh4yas3"
            >
              {question.question_text}
            </p>

            {isMulti ? (
              <div className="space-y-1 pl-1" data-oid="304zzy-">
                {question.options.map((opt, idx) => {
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

                  return (
                    <Label
                      key={idx}
                      htmlFor={id}
                      className={getLabelStyle(opt, false, isChecked, isActualCorrect)}
                      data-oid="9v-kz03"
                    >
                      <Checkbox
                        id={id}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          !isFinished && onMultiSelectChange(question.id, opt, checked, limit)
                        }
                        disabled={isFinished}
                        className={
                          isFinished
                            ? isActualCorrect
                              ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-emerald-400'
                              : 'data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 border-rose-400'
                            : 'mt-0.5'
                        }
                        data-oid="gy78z.3"
                      />

                      <span
                        className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-300 flex-1"
                        data-oid="0yu_48m"
                      >
                        {opt}
                      </span>
                    </Label>
                  );
                })}
              </div>
            ) : (
              <RadioGroup
                value={currentAnswer || ''}
                onValueChange={(val) => !isFinished && onAnswerChange(question.id, val)}
                disabled={isFinished}
                className="space-y-1 pl-1"
                data-oid="feq15vq"
              >
                {question.options.map((opt, idx) => {
                  const isSelected = currentAnswer === opt;
                  const isActualCorrect = checkIsActualCorrect(opt);
                  const id = `${question.id}-${idx}`;
                  return (
                    <Label
                      key={idx}
                      htmlFor={id}
                      className={getLabelStyle(opt, isSelected, false, isActualCorrect)}
                      data-oid="xj0v2v8"
                    >
                      <RadioGroupItem
                        value={opt}
                        id={id}
                        className={
                          isFinished
                            ? isActualCorrect
                              ? 'text-emerald-600 border-emerald-400 fill-emerald-600'
                              : 'text-rose-600 border-rose-400 fill-rose-600'
                            : 'mt-0.5'
                        }
                        data-oid="zuduu96"
                      />
                      <span
                        className="text-sm font-normal leading-tight text-slate-700 dark:text-slate-300 flex-1"
                        data-oid="53qno_v"
                      >
                        {opt}
                      </span>
                    </Label>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceRenderer;
