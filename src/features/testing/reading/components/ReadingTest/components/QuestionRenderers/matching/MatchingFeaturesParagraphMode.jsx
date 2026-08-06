import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import InlineDeepDive from './InlineDeepDive';
import { getCircleStatus, getValidationInputStyle, getFeatureLabel } from './helpers';

function ParagraphPlaceholderItem({
  placeholderNum,
  question,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  isFinished,
  validationMap,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
}) {
  const itemKey = `${question.id}_${placeholderNum}`;
  const value = answers[itemKey] || '';
  const validation = validationMap?.[itemKey];
  const isCorrect = validation?.isCorrect === true;
  const circleStatus = getCircleStatus(isFinished, validation, value);
  const selectStyle = getValidationInputStyle(
    isFinished,
    value,
    isCorrect,
    'inline-flex w-[90px] h-7 px-2 py-0.5 text-center bg-white/70 dark:bg-white/4 border border-slate-300/70 dark:border-white/8 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5a63df]/40 focus-visible:border-[#5a63df]/50 hover:border-slate-400/80 dark:hover:border-white/[0.14] transition-all text-[15px]'
  );

  return (
    <span
      className="inline-flex items-center gap-2 mx-1 align-middle leading-none"
      data-oid="2i8ke49"
    >
      <QuestionNumberCircle
        number={placeholderNum}
        isFlagged={flaggedQuestions.has(itemKey)}
        onClick={() => onToggleFlag(itemKey)}
        status={circleStatus}
        data-oid="-wtupb:"
      />

      <Select
        value={value}
        onValueChange={(val) => onAnswerChange(itemKey, val)}
        disabled={isFinished}
        data-oid="tc398vy"
      >
        <SelectTrigger className={selectStyle} data-oid="cv36:t1">
          <SelectValue placeholder="Select" data-oid="na7g3k1" />
        </SelectTrigger>
        <SelectContent data-oid="42wspx4">
          {question.matching_features?.options?.map((opt, oIdx) => {
            const label = getFeatureLabel(oIdx, question.matching_features?.style);
            return (
              <SelectItem key={oIdx} value={label} data-oid="m.p2vhi">
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <InlineDeepDive
        isFinished={isFinished}
        explanationData={explanationData}
        keyNumber={placeholderNum}
        itemKey={itemKey}
        openDeepDive={openDeepDive}
        setOpenDeepDive={setOpenDeepDive}
        questionType={question.type}
        userAnswer={value}
      />
    </span>
  );
}

export default function MatchingFeaturesParagraphMode(props) {
  const { question } = props;
  const text = question.matching_features?.text || '';
  const parts = text.split(/\[(\d+)\]/g);
  const questionsTitle = question.matching_features?.questions_title;

  return (
    <div
      className="leading-normal text-justify relative p-4 bg-[#fbfbfe] dark:bg-white/3 border border-[#ebeaf7] dark:border-white/8 rounded-lg whitespace-pre-wrap"
      data-oid="_zy0lsk"
    >
      {questionsTitle && (
        <h4
          className="font-bold text-center mb-4 text-slate-800 dark:text-slate-100 text-lg"
          data-oid="summary-title"
        >
          {questionsTitle}
        </h4>
      )}
      <div data-oid="eu5op:q">
        {parts.map((part, pIdx) =>
          pIdx % 2 === 1 ? (
            <ParagraphPlaceholderItem key={pIdx} placeholderNum={parseInt(part)} {...props} />
          ) : (
            <span key={pIdx} data-oid="tiozug6">
              {part}
            </span>
          )
        )}
      </div>
    </div>
  );
}
