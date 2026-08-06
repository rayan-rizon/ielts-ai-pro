import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { cn } from '@/lib/cn';
import { calculateGlobalQuestionNumber } from '../../../utils/helpers';
import InlineDeepDive from './InlineDeepDive';
import { getCircleStatus, getValidationInputStyle, getFeatureLabel } from './helpers';

function FeatureQuestionRowItem({
  q,
  idx,
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
}) {
  const globalNum = calculateGlobalQuestionNumber(allQuestions, question.id) + idx;
  const itemKey = `${question.id}_${q.id}`;
  const value = answers[itemKey] || '';
  const validation = validationMap?.[itemKey];
  const isCorrect = validation?.isCorrect === true;
  const circleStatus = getCircleStatus(isFinished, validation, value);
  const selectStyle = getValidationInputStyle(
    isFinished,
    value,
    isCorrect,
    'bg-white dark:bg-white/4'
  );

  return (
    <div
      className="flex items-center gap-3 p-2 bg-[#fbfbfe] dark:bg-white/3 rounded-lg border border-[#ebeaf7] dark:border-white/8 w-full"
      data-oid="o37jbrr"
    >
      <div className="shrink-0" data-oid="59dx2qp">
        <QuestionNumberCircle
          number={globalNum}
          isFlagged={flaggedQuestions.has(itemKey)}
          onClick={() => onToggleFlag(itemKey)}
          status={circleStatus}
          data-oid="qky479a"
        />
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-start gap-8" data-oid="vvpxgdr">
        <div className="text-foreground text-[15px] leading-relaxed" data-oid="ofvjdev">
          {q.text}
        </div>

        <Select
          value={value}
          onValueChange={(val) => onAnswerChange(itemKey, val)}
          disabled={isFinished}
          data-oid="h:z.o_7"
        >
          <SelectTrigger
            className={cn(
              'h-7 w-[100px] shrink-0 text-sm transition-all border-slate-300/50 dark:border-white/8',
              selectStyle,
              !value && 'text-slate-400'
            )}
            data-oid="-fxljhw"
          >
            <SelectValue placeholder="Select" data-oid="48i1pis" />
          </SelectTrigger>
          <SelectContent className="min-w-[100px]" data-oid="jh_wbb_">
            {question.matching_features?.options?.map((opt, oIdx) => {
              const label = getFeatureLabel(oIdx, question.matching_features?.style);
              return (
                <SelectItem key={oIdx} value={label} className="text-[15px]" data-oid="kp_qks8">
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <InlineDeepDive
          isFinished={isFinished}
          explanationData={explanationData}
          keyNumber={globalNum}
          itemKey={itemKey}
          openDeepDive={openDeepDive}
          setOpenDeepDive={setOpenDeepDive}
          questionType={question.type}
          userAnswer={value}
        />
      </div>
    </div>
  );
}

export default function MatchingFeaturesQuestionsMode(props) {
  const { question } = props;
  const questions = question.matching_features?.questions || [];

  return (
    <div className="space-y-2 w-full overflow-hidden" data-oid="wycyjva">
      {questions.map((q, idx) => (
        <FeatureQuestionRowItem key={q.id || idx} q={q} idx={idx} {...props} />
      ))}
    </div>
  );
}
