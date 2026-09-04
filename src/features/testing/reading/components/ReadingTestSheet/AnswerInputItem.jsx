import React from 'react';
import { Input } from '@/components/ui/input';
import {
  checkAnswer,
  resolveCorrectAnswer,
  formatAnswerValue,
  resolveMultiSelectReview,
} from './answerSheetUtils';

function getMultiSelectAnswers(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Legacy answers may be comma-separated rather than JSON arrays.
  }

  return value.split(',').map((answer) => answer.trim());
}

function getMultiSelectSlotCount(question, groupAnswers, subId) {
  const declared = parseInt(String(question.question_count ?? ''), 10);
  const fallback = Math.max(groupAnswers.length, Number(subId) + 1);
  return Number.isFinite(declared) && declared > 0 ? Math.max(declared, fallback) : fallback;
}

function buildGroupUserAnswers(question, questionId, answers, groupAnswers, subId) {
  const slotCount = getMultiSelectSlotCount(question, groupAnswers, subId);
  return Array.from(
    { length: slotCount },
    (_, index) => answers[`${questionId}_${index}`] || groupAnswers[index] || ''
  );
}

function isMultiSelectEntry(question, subId) {
  return question.type === 'multiple_choice' && question.allow_multiple && Number.isInteger(subId);
}

function getItemContainerStyle(isFinished, isCorrect, value) {
  if (!isFinished) return 'border-border/60 hover:border-primary/40 hover:shadow-sm';
  if (isCorrect) return 'answer-correct shadow-sm';
  if (value) return 'answer-incorrect shadow-sm';
  return 'answer-unanswered';
}

function getBadgeStyle(isFinished, isCorrect, value) {
  if (!isFinished) {
    return 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-2 group-hover:ring-primary/20';
  }
  if (isCorrect) return 'bg-emerald-500 text-white shadow-sm';
  if (value) return 'bg-rose-500 text-white shadow-sm';
  return 'bg-amber-400 text-amber-900 shadow-sm';
}

function getValueTextStyle(isCorrect, value) {
  if (isCorrect) return 'text-emerald-700 dark:text-emerald-300';
  if (value) return 'text-rose-700 dark:text-rose-300';
  return 'text-amber-700 dark:text-amber-400';
}

export default function AnswerInputItem({
  question: q,
  globalNum,
  subId = null,
  correctAnswer = null,
  answers,
  handleAnswerChange,
  isFinished,
  onQuestionClick,
}) {
  const questionId = q.id;
  const answerKey = subId !== null && subId !== undefined ? `${questionId}_${subId}` : questionId;
  const isMultiSelect = isMultiSelectEntry(q, subId);
  const groupAnswers = isMultiSelect ? getMultiSelectAnswers(answers[questionId]) : [];
  const value = answers[answerKey] || groupAnswers[subId] || '';

  // Multi-select boxes are graded as a set, so this item needs the whole group.
  const groupReview =
    isFinished && isMultiSelect
      ? resolveMultiSelectReview(
          q,
          buildGroupUserAnswers(q, questionId, answers, groupAnswers, subId)
        )
      : null;

  const cAnswer = groupReview
    ? groupReview.expected[subId]
    : resolveCorrectAnswer(q, subId, correctAnswer);
  let isCorrect = false;
  if (isFinished) {
    isCorrect = groupReview ? groupReview.matches[subId] === true : checkAnswer(value, cAnswer);
  }

  const formattedUserValue = formatAnswerValue(value);
  const formattedCorrectValue = formatAnswerValue(cAnswer);

  const handleChange = (nextValue) => {
    if (!isMultiSelect) {
      handleAnswerChange(answerKey, nextValue);
      return;
    }

    const updatedAnswers = [...groupAnswers];
    updatedAnswers[subId] = nextValue.trim();
    handleAnswerChange(questionId, updatedAnswers.filter(Boolean).join(', '));
  };

  return (
    <div
      key={answerKey}
      className={`flex items-center gap-2 p-2 bg-card/70 rounded-lg border transition-all group ${getItemContainerStyle(
        isFinished,
        isCorrect,
        value
      )}`}
      data-oid="0ldq_fa"
    >
      <div className="flex items-center justify-center flex-none" data-oid="-3h9e27">
        <span
          onClick={() => onQuestionClick && onQuestionClick(questionId)}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer hover:scale-110 active:scale-95 ${getBadgeStyle(
            isFinished,
            isCorrect,
            value
          )}`}
          data-oid="94z:f23"
        >
          {globalNum}
        </span>
      </div>

      {isFinished ? (
        <div className="flex-1 min-w-0 flex flex-col justify-center" data-oid="lo1i2ox">
          <div
            className={`font-semibold text-sm ${getValueTextStyle(isCorrect, value)}`}
            data-oid="n6az2ld"
          >
            {formattedUserValue || (
              <span
                className="text-amber-600/80 dark:text-amber-500/80 italic font-medium text-xs"
                data-oid="laugwkv"
              >
                Not Answered
              </span>
            )}
          </div>
          {!isCorrect && (
            <div
              className={`text-[10px] text-muted-foreground truncate mt-1 pt-1 border-t flex items-center gap-1 ${
                value
                  ? 'border-rose-500/25 dark:border-rose-500/25'
                  : 'border-amber-500/25 dark:border-amber-500/25'
              }`}
              data-oid="rcns9sy"
            >
              <span
                className="text-muted-foreground/70 text-[9px] uppercase tracking-wider font-medium"
                data-oid="2iphazs"
              >
                Correct:
              </span>
              <span
                className="font-semibold text-emerald-700 dark:text-emerald-300"
                data-oid="7sx9m2:"
              >
                {formattedCorrectValue || '-'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <Input
          aria-label={`Answer for question ${globalNum}`}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder=""
          className="flex-1 h-8 min-w-0 px-2 text-sm bg-background/60 border-border/70 focus:ring-1 focus:ring-primary rounded-md font-medium text-center"
          data-oid="7.8qgbt"
        />
      )}
    </div>
  );
}
