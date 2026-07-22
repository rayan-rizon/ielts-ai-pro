import React, { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { toRoman, calculateGlobalQuestionNumber } from '../../../utils/helpers';
import InlineDeepDive from './InlineDeepDive';
import { getCircleStatus, getValidationInputStyle } from './helpers';

function HeadingsHeaderList({ question }) {
  return (
    <div className="border border-border rounded-md p-2.5 bg-muted/30 mb-2" data-oid="b549_35">
      <h4 className="font-semibold text-foreground mb-2 text-center text-sm" data-oid="830zuyo">
        List of Headings
      </h4>
      <div className="text-xs space-y-0.5" data-oid="k4dt-5a">
        {question.content_items?.map((item, idx) => (
          <div key={idx} className="flex gap-2" data-oid="1v43u8i">
            <span className="font-mono text-muted-foreground min-w-[1.5rem]" data-oid="iqry2qz">
              {item.label}.
            </span>
            <span data-oid="ffgy_x3">{item.content}</span>
          </div>
        )) ||
          question.matching_data?.headings?.map((heading, idx) => (
            <div key={idx} className="flex gap-2" data-oid="4yjvd70">
              <span className="font-mono text-muted-foreground min-w-[1.5rem]" data-oid="zmwt2jd">
                {idx + 1}.
              </span>
              <span data-oid="zsyvezw">{heading}</span>
            </div>
          )) ||
          question.options?.map((heading, idx) => (
            <div key={idx} className="flex gap-2" data-oid="5l3.2j1">
              <span className="font-mono text-muted-foreground min-w-[1.5rem]" data-oid="-5pzhjx">
                {idx + 1}.
              </span>
              <span data-oid="_7rl4zj">{heading}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function HeadingRowItem({
  itemKey,
  label,
  questionNumber,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  isFinished,
  validationMap,
  explanationData,
  openDeepDive,
  setOpenDeepDive,
  questionType,
  selectOptions,
  selectStyleBase = 'w-20 h-7 text-sm bg-white/70 dark:bg-slate-950/40',
  dataOidDiv = '7bb_yx1',
  dataOidCircle = 'olak0o0',
  dataOidSpan = 'ulad_p_',
}) {
  const value = answers[itemKey] || '';
  const validation = validationMap?.[itemKey];
  const isCorrect = validation?.isCorrect === true;
  const circleStatus = getCircleStatus(isFinished, validation, value);
  const selectStyle = getValidationInputStyle(isFinished, value, isCorrect, selectStyleBase);

  return (
    <div
      className="flex items-center justify-start gap-2 p-1.5 pl-2 bg-white/60 dark:bg-slate-950/30 rounded-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150"
      data-oid={dataOidDiv}
    >
      <QuestionNumberCircle
        number={questionNumber}
        isFlagged={flaggedQuestions.has(itemKey)}
        onClick={() => onToggleFlag(itemKey)}
        status={circleStatus}
        data-oid={dataOidCircle}
      />

      <span className="font-medium text-sm text-foreground ml-2" data-oid={dataOidSpan}>
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(val) => onAnswerChange(itemKey, val)}
        disabled={isFinished}
        data-oid="g0oo469"
      >
        <SelectTrigger className={selectStyle} data-oid="2zdf:oy">
          <SelectValue placeholder="Select" data-oid=".q2f3g4" />
        </SelectTrigger>
        <SelectContent data-oid=":bz_m1v">{selectOptions}</SelectContent>
      </Select>
      <InlineDeepDive
        isFinished={isFinished}
        explanationData={explanationData}
        keyNumber={questionNumber}
        itemKey={itemKey}
        openDeepDive={openDeepDive}
        setOpenDeepDive={setOpenDeepDive}
        questionType={questionType}
        userAnswer={value}
      />
    </div>
  );
}

const MatchingHeadingsRenderer = memo(function MatchingHeadingsRenderer(props) {
  const { question, allQuestions } = props;
  const headings =
    question.content_items || question.matching_data?.headings || question.options || [];

  return (
    <div className="space-y-2" data-oid="4ty-rqc">
      <HeadingsHeaderList question={question} />

      <div className="space-y-1" data-oid="b-.9t_-">
        {question.questions?.map((q, idx) => {
          const itemKey = `${question.id}_${q.id || idx}`;
          const qNum = q.question_number ?? question.question_number + idx;
          const selectOptions = headings.map((item, itemIdx) => {
            const label = item.label || String.fromCharCode(105 + itemIdx);
            return (
              <SelectItem key={itemIdx} value={label} data-oid="8gu0vy_">
                {label}
              </SelectItem>
            );
          });

          return (
            <HeadingRowItem
              key={idx}
              {...props}
              itemKey={itemKey}
              label={q.question_text?.replace(/^\d+\.\s*/, '')}
              questionNumber={qNum}
              selectOptions={selectOptions}
              questionType={question.type}
            />
          );
        }) ||
          question.matching_data?.paragraphs?.map((para, idx) => {
            const itemKey = `${question.id}_${para.label}`;
            const qNum = para.question_number ?? question.question_number + idx;
            const selectOptions = (question.matching_data?.headings || question.options || []).map(
              (heading, headingIdx) => (
                <SelectItem
                  key={headingIdx}
                  value={String.fromCharCode(105 + headingIdx)}
                  data-oid="l3.w03p"
                >
                  {String.fromCharCode(105 + headingIdx)}
                </SelectItem>
              )
            );

            return (
              <HeadingRowItem
                key={idx}
                {...props}
                itemKey={itemKey}
                label={`Paragraph ${para.label}`}
                questionNumber={qNum}
                selectOptions={selectOptions}
                selectStyleBase="w-20 bg-white/70 dark:bg-slate-950/40"
                questionType={question.type}
                dataOidDiv="po6145x"
                dataOidCircle="btuyk5u"
                dataOidSpan="2f6w_h9"
              />
            );
          }) || (
            <div className="space-y-2" data-oid="nbj-yrw">
              {Array.from({ length: 8 }, (_, i) => {
                const globalNum = calculateGlobalQuestionNumber(allQuestions, question.id, i + 1);
                const itemKey = `${question.id}_${String.fromCharCode(65 + i)}`;
                const selectOptions = Array.from({ length: 10 }).map((_, headingIdx) => (
                  <SelectItem key={headingIdx} value={toRoman(headingIdx + 1)} data-oid="6yd_e34">
                    {toRoman(headingIdx + 1)}
                  </SelectItem>
                ));

                return (
                  <HeadingRowItem
                    key={i}
                    {...props}
                    itemKey={itemKey}
                    label={`Paragraph ${String.fromCharCode(65 + i)}`}
                    questionNumber={globalNum}
                    selectOptions={selectOptions}
                    selectStyleBase="w-20 bg-white/70 dark:bg-slate-950/40"
                    questionType={question.type}
                    dataOidDiv="_k645p2"
                    dataOidCircle="p29ef43"
                    dataOidSpan="0nqp_cq"
                  />
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
});

export default MatchingHeadingsRenderer;
