import React, { memo } from 'react';
import DebouncedInput from '@/components/ui/debounced-input';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { calculateGlobalQuestionNumber } from '../../../utils/helpers';
import InlineDeepDive from './InlineDeepDive';
import { getCircleStatus, getValidationInputStyle } from './helpers';

function SingleMatchingItem({ question, answers, onAnswerChange, isFinished, validationMap }) {
  const value = answers[question.id] || '';
  const validation = validationMap?.[question.id];
  const isCorrect = validation?.isCorrect === true;
  const baseStyle =
    'bg-white/70 dark:bg-slate-950/40 border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 transition-all shadow-sm ';
  const inputStyle = getValidationInputStyle(isFinished, value, isCorrect, baseStyle);

  return (
    <div className="space-y-1.5" data-oid="ilfhrc9">
      <div className="grid gap-1.5" data-oid="la-vhft">
        <div
          className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
          data-oid="b1grdjf"
        >
          <DebouncedInput
            value={value}
            onChange={(val) => onAnswerChange(question.id, val)}
            placeholder="Enter your matching answers"
            className={inputStyle}
            disabled={isFinished}
            data-oid="pwtcd.3"
          />
        </div>
      </div>
    </div>
  );
}

function GenericMatchingOptionItem({
  option,
  optionIndex,
  question,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  isFinished,
  validationMap,
  allQuestions,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
  baseInputStyle,
}) {
  const subId = String.fromCharCode(65 + optionIndex);
  const itemKey = `${question.id}_${subId}`;
  const isItemFlagged = flaggedQuestions.has(itemKey);
  const value = answers[itemKey] || '';
  const validation = validationMap?.[itemKey];
  const isCorrect = validation?.isCorrect === true;
  const circleStatus = getCircleStatus(isFinished, validation, value);
  const inputStyle = getValidationInputStyle(isFinished, value, isCorrect, baseInputStyle);

  const displayNum =
    (question.question_number || calculateGlobalQuestionNumber(allQuestions, question.id)) +
    optionIndex;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 bg-white/60 dark:bg-slate-950/30 rounded-md border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300/70 dark:hover:border-slate-600/80 transition-colors duration-150"
      data-oid="gey:do2"
    >
      <QuestionNumberCircle
        number={displayNum}
        isFlagged={isItemFlagged}
        onClick={() => onToggleFlag(itemKey)}
        status={circleStatus}
        data-oid="bk6puce"
      />

      <span className="text-sm font-medium text-foreground ml-2" data-oid="gwt-68p">
        {option?.replace(/^\d+\.\s*/, '')}
      </span>
      <DebouncedInput
        value={value}
        onChange={(val) => onAnswerChange(itemKey, val)}
        placeholder={isFinished ? (value ? '' : '-') : 'Ans'}
        className={inputStyle}
        disabled={isFinished}
        data-oid="ulujnky"
      />
      <InlineDeepDive
        isFinished={isFinished}
        explanationData={explanationData}
        keyNumber={displayNum}
        itemKey={itemKey}
        openDeepDive={openDeepDive}
        setOpenDeepDive={setOpenDeepDive}
        questionType={question.type}
        userAnswer={value}
      />
    </div>
  );
}

const GenericMatchingRenderer = memo(function GenericMatchingRenderer(props) {
  const { question } = props;

  if (!question.options || question.options.length === 0) {
    return <SingleMatchingItem {...props} />;
  }

  const baseInputStyle =
    'w-20 h-7 text-center text-sm border rounded-md transition-colors bg-white/70 dark:bg-slate-950/40 border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 transition-all shadow-sm';

  return (
    <div className="space-y-1.5" data-oid="ilfhrc9">
      <div className="grid gap-1.5" data-oid="la-vhft">
        {question.options.map((option, optionIndex) => (
          <GenericMatchingOptionItem
            key={optionIndex}
            option={option}
            optionIndex={optionIndex}
            baseInputStyle={baseInputStyle}
            {...props}
          />
        ))}
      </div>
    </div>
  );
});

export default GenericMatchingRenderer;
