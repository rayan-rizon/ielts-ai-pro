import React, { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DebouncedInput from '@/components/ui/debounced-input'; // Assuming you have this accessible
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle'; // Adjust if needed
import { cn } from '@/lib/utils';
import { toRoman, calculateGlobalQuestionNumber } from '../../utils/helpers';
import DeepDivePopover from '@/features/testing/reading/components/DeepDivePopover';

const MatchingRenderer = memo(function MatchingRenderer({
  question,
  answers,
  onAnswerChange,
  flaggedQuestions,
  onToggleFlag,
  isFinished,
  validationMap,
  allQuestions, // Needed for global numbering
  explanationData,
  openDeepDive,
  setOpenDeepDive,
}) {
  // 1. Generic Matching
  if (question.type === 'matching') {
    return (
      <div className="space-y-1.5" data-oid="ilfhrc9">
        <div className="grid gap-1.5" data-oid="la-vhft">
          {question.options && question.options.length > 0 ? (
            question.options.map((option, optionIndex) => {
              const subId = String.fromCharCode(65 + optionIndex);
              const itemKey = `${question.id}_${subId}`;
              const isItemFlagged = flaggedQuestions.has(itemKey);
              const value = answers[itemKey] || '';
              const validation = validationMap?.[itemKey];
              const isCorrect = validation?.isCorrect === true;
              const isTypo = validation?.isTypo === true;
              let circleStatus = 'default';
              if (isFinished && validation) {
                circleStatus = isCorrect
                  ? 'correct'
                  : isTypo
                    ? 'typo'
                    : value
                      ? 'incorrect'
                      : 'unanswered';
              }

              let inputStyle = 'w-20 h-7 text-center text-sm border rounded-md transition-colors ';
              if (isFinished) {
                inputStyle += ' cursor-not-allowed opacity-100 ';
                if (value) {
                  if (isCorrect)
                    inputStyle +=
                      ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                  else
                    inputStyle +=
                      ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
                } else {
                  inputStyle +=
                    ' bg-white border-slate-300 text-slate-500 dark:bg-slate-900/50 dark:border-slate-700';
                }
              } else {
                inputStyle +=
                  ' bg-white/70 dark:bg-slate-950/40 border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 transition-all shadow-sm';
              }

              const displayNum =
                (question.question_number ||
                  calculateGlobalQuestionNumber(allQuestions, question.id)) + optionIndex;

              return (
                <div
                  key={optionIndex}
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
                  {isFinished &&
                    explanationData &&
                    (() => {
                      const actualKey = explanationData.blanks?.[displayNum] ? displayNum : null;
                      if (!actualKey) return null;

                      return (
                        <DeepDivePopover
                          explanationData={explanationData}
                          userAnswer={value}
                          isOpen={openDeepDive === itemKey}
                          onToggle={() =>
                            setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                          }
                          questionType={question.type}
                          blankKey={actualKey}
                          inline={true}
                        />
                      );
                    })()}
                </div>
              );
            })
          ) : (
            <div
              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
              data-oid="b1grdjf"
            >
              {(() => {
                const value = answers[question.id] || '';
                const validation = validationMap?.[question.id];
                const isCorrect = validation?.isCorrect === true;
                let inputStyle =
                  'bg-white/70 dark:bg-slate-950/40 border-slate-300/70 dark:border-slate-700/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 transition-all shadow-sm ';
                if (isFinished) {
                  inputStyle += ' cursor-not-allowed opacity-100 ';
                  if (value) {
                    if (isCorrect)
                      inputStyle +=
                        ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                    else
                      inputStyle +=
                        ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
                  } else {
                    inputStyle +=
                      ' bg-white border-slate-300 text-slate-500 dark:bg-slate-900/50 dark:border-slate-700';
                  }
                }

                return (
                  <DebouncedInput
                    value={value}
                    onChange={(val) => onAnswerChange(question.id, val)}
                    placeholder="Enter your matching answers"
                    className={inputStyle}
                    disabled={isFinished}
                    data-oid="pwtcd.3"
                  />
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Matching Headings
  if (question.type === 'matching_headings') {
    return (
      <div className="space-y-2" data-oid="4ty-rqc">
        {/* Display list of headings */}
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
                  <span
                    className="font-mono text-muted-foreground min-w-[1.5rem]"
                    data-oid="zmwt2jd"
                  >
                    {idx + 1}.
                  </span>
                  <span data-oid="zsyvezw">{heading}</span>
                </div>
              )) ||
              question.options?.map((heading, idx) => (
                <div key={idx} className="flex gap-2" data-oid="5l3.2j1">
                  <span
                    className="font-mono text-muted-foreground min-w-[1.5rem]"
                    data-oid="-5pzhjx"
                  >
                    {idx + 1}.
                  </span>
                  <span data-oid="_7rl4zj">{heading}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Individual paragraph matching */}
        <div className="space-y-1" data-oid="b-.9t_-">
          {question.questions?.map((q, idx) => {
            const itemKey = `${question.id}_${q.id || idx}`;
            const value = answers[itemKey] || '';
            const validation = validationMap?.[itemKey];
            const isCorrect = validation?.isCorrect === true;
            const isTypo = validation?.isTypo === true;
            let circleStatus = 'default';
            if (isFinished && validation) {
              circleStatus = isCorrect
                ? 'correct'
                : isTypo
                  ? 'typo'
                  : value
                    ? 'incorrect'
                    : 'unanswered';
            }

            let selectStyle = `w-20 h-7 text-sm bg-white/70 dark:bg-slate-950/40 ${isFinished ? 'opacity-100 cursor-not-allowed' : ''}`;
            if (isFinished && value) {
              if (isCorrect)
                selectStyle +=
                  ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
              else
                selectStyle +=
                  ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
            }

            return (
              <div
                key={idx}
                className="flex items-center justify-start gap-2 p-1.5 pl-2 bg-white/60 dark:bg-slate-950/30 rounded-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150"
                data-oid="7bb_yx1"
              >
                <QuestionNumberCircle
                  number={q.question_number ?? question.question_number + idx}
                  isFlagged={flaggedQuestions.has(itemKey)}
                  onClick={() => onToggleFlag(itemKey)}
                  status={circleStatus}
                  data-oid="olak0o0"
                />

                <span className="font-medium text-sm text-foreground ml-2" data-oid="ulad_p_">
                  {q.question_text?.replace(/^\d+\.\s*/, '')}
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
                  <SelectContent data-oid=":bz_m1v">
                    {(
                      question.content_items ||
                      question.matching_data?.headings ||
                      question.options ||
                      []
                    ).map((item, itemIdx) => {
                      const label = item.label || String.fromCharCode(105 + itemIdx);
                      return (
                        <SelectItem key={itemIdx} value={label} data-oid="8gu0vy_">
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {/* Inline DeepDive for Matching Headings (questions mapped) */}
                {isFinished &&
                  explanationData &&
                  (() => {
                    const actualKey = explanationData.blanks?.[
                      q.question_number ?? question.question_number + idx
                    ]
                      ? (q.question_number ?? question.question_number + idx)
                      : null;
                    if (!actualKey) return null;

                    return (
                      <DeepDivePopover
                        explanationData={explanationData}
                        userAnswer={value}
                        isOpen={openDeepDive === itemKey}
                        onToggle={() =>
                          setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                        }
                        questionType={question.type}
                        blankKey={actualKey}
                        inline={true}
                      />
                    );
                  })()}
              </div>
            );
          }) ||
            question.matching_data?.paragraphs?.map((para, idx) => {
              const itemKey = `${question.id}_${para.label}`;
              const value = answers[itemKey] || '';
              const validation = validationMap?.[itemKey];
              const isCorrect = validation?.isCorrect === true;
              const isTypo = validation?.isTypo === true;
              let circleStatus = 'default';
              if (isFinished && validation) {
                circleStatus = isCorrect
                  ? 'correct'
                  : isTypo
                    ? 'typo'
                    : value
                      ? 'incorrect'
                      : 'unanswered';
              }

              let selectStyle = `w-20 bg-white/70 dark:bg-slate-950/40 ${isFinished ? 'opacity-100 cursor-not-allowed' : ''}`;
              if (isFinished && value) {
                if (isCorrect)
                  selectStyle +=
                    ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                else
                  selectStyle +=
                    ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
              }

              return (
                <div
                  key={idx}
                  className="flex items-center justify-start gap-2 p-1.5 pl-2 bg-white/60 dark:bg-slate-950/30 rounded-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150"
                  data-oid="po6145x"
                >
                  <QuestionNumberCircle
                    number={para.question_number ?? question.question_number + idx}
                    isFlagged={flaggedQuestions.has(itemKey)}
                    onClick={() => onToggleFlag(itemKey)}
                    status={circleStatus}
                    data-oid="btuyk5u"
                  />

                  <span className="font-medium text-foreground ml-2" data-oid="2f6w_h9">
                    Paragraph {para.label}
                  </span>
                  <Select
                    value={value}
                    onValueChange={(val) => onAnswerChange(itemKey, val)}
                    disabled={isFinished}
                    data-oid="xo2pey8"
                  >
                    <SelectTrigger className={selectStyle} data-oid="jc2ln7-">
                      <SelectValue placeholder="Select" data-oid="x0nop._" />
                    </SelectTrigger>
                    <SelectContent data-oid="_-jck32">
                      {(question.matching_data?.headings || question.options || []).map(
                        (heading, headingIdx) => (
                          <SelectItem
                            key={headingIdx}
                            value={String.fromCharCode(105 + headingIdx)}
                            data-oid="l3.w03p"
                          >
                            {String.fromCharCode(105 + headingIdx)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {/* Inline DeepDive for Matching Headings (paragraphs mapped) */}
                  {isFinished &&
                    explanationData &&
                    (() => {
                      const actualKey = explanationData.blanks?.[
                        para.question_number ?? question.question_number + idx
                      ]
                        ? (para.question_number ?? question.question_number + idx)
                        : null;
                      if (!actualKey) return null;

                      return (
                        <DeepDivePopover
                          explanationData={explanationData}
                          userAnswer={value}
                          isOpen={openDeepDive === itemKey}
                          onToggle={() =>
                            setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                          }
                          questionType={question.type}
                          blankKey={actualKey}
                          inline={true}
                        />
                      );
                    })()}
                </div>
              );
            }) || (
              // Fallback for questions without detailed matching data
              <div className="space-y-2" data-oid="nbj-yrw">
                {Array.from({ length: 8 }, (_, i) => {
                  // Calculate global question number for this paragraph
                  const globalNum = calculateGlobalQuestionNumber(allQuestions, question.id, i + 1);
                  const itemKey = `${question.id}_${String.fromCharCode(65 + i)}`;
                  const value = answers[itemKey] || '';
                  const validation = validationMap?.[itemKey];
                  const isCorrect = validation?.isCorrect === true;
                  const isTypo = validation?.isTypo === true;
                  let circleStatus = 'default';
                  if (isFinished && validation) {
                    circleStatus = isCorrect
                      ? 'correct'
                      : isTypo
                        ? 'typo'
                        : value
                          ? 'incorrect'
                          : 'unanswered';
                  }

                  let selectStyle = `w-20 bg-white/70 dark:bg-slate-950/40 ${isFinished ? 'opacity-100 cursor-not-allowed' : ''}`;
                  if (isFinished && value) {
                    if (isCorrect)
                      selectStyle +=
                        ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                    else
                      selectStyle +=
                        ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
                  }

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-start gap-2 p-1.5 pl-2 bg-white/60 dark:bg-slate-950/30 rounded-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors duration-150"
                      data-oid="_k645p2"
                    >
                      <QuestionNumberCircle
                        number={globalNum}
                        isFlagged={flaggedQuestions.has(itemKey)}
                        onClick={() => onToggleFlag(itemKey)}
                        status={circleStatus}
                        data-oid="p29ef43"
                      />

                      <span className="font-medium text-foreground ml-2" data-oid="0nqp_cq">
                        Paragraph {String.fromCharCode(65 + i)}
                      </span>
                      <Select
                        value={value}
                        onValueChange={(val) => onAnswerChange(itemKey, val)}
                        disabled={isFinished}
                        data-oid="8ji0tag"
                      >
                        <SelectTrigger className={selectStyle} data-oid="5ajf-:_">
                          <SelectValue placeholder="Select" data-oid="813mn8v" />
                        </SelectTrigger>
                        <SelectContent data-oid="yzyavdq">
                          {/* Generic 10 options */}
                          {Array.from({ length: 10 }).map((_, headingIdx) => (
                            <SelectItem
                              key={headingIdx}
                              value={toRoman(headingIdx + 1)}
                              data-oid="6yd_e34"
                            >
                              {toRoman(headingIdx + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Inline DeepDive for Matching Headings (fallback mapped) */}
                      {isFinished &&
                        explanationData &&
                        (() => {
                          const actualKey = explanationData.blanks?.[globalNum] ? globalNum : null;
                          if (!actualKey) return null;

                          return (
                            <DeepDivePopover
                              explanationData={explanationData}
                              userAnswer={value}
                              isOpen={openDeepDive === itemKey}
                              onToggle={() =>
                                setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                              }
                              questionType={question.type}
                              blankKey={actualKey}
                              inline={true}
                            />
                          );
                        })()}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    );
  }

  // 3. Matching Features
  if (question.type === 'matching_features') {
    return (
      <div className="space-y-4" data-oid="1lv1gjz">
        {/* Box Options - Only show if options have content (not paragraph reference mode) */}
        {question.matching_features?.options?.some((opt) => opt?.trim()) && (
          <div
            className="border border-slate-200 dark:border-slate-800 py-4 px-6 bg-white dark:bg-slate-900/40 mb-6 rounded-xl shadow-sm w-full max-w-3xl mx-auto relative overflow-hidden"
            data-oid="9j48.ng"
          >
            {question.matching_features?.box_title !== '' && (
              <h4
                className="font-bold text-center mb-3 text-foreground text-lg tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2 uppercase"
                data-oid="tk5xf46"
              >
                {question.matching_features?.box_title || 'List of Features'}
              </h4>
            )}
            <div className="flex justify-center" data-oid="n541t:0">
              <div className="inline-block space-y-0" data-oid="75:0-jn">
                {question.matching_features?.options?.map((opt, idx) => {
                  let label = String.fromCharCode(65 + idx);
                  if (question.matching_features.style === 'ROMAN') {
                    label = toRoman(idx + 1).toLowerCase();
                  }
                  return (
                    <div
                      key={idx}
                      className="flex gap-4 items-baseline px-4 py-0.5"
                      data-oid="i:xgxfb"
                    >
                      <span
                        className="font-bold text-blue-600 dark:text-blue-400 min-w-[1.5rem] text-base text-right"
                        data-oid="z25a8kq"
                      >
                        {label}.
                      </span>
                      <span
                        className="text-foreground leading-relaxed text-base"
                        data-oid="0v50ild"
                      >
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Questions Area */}
        {question.matching_features?.mode === 'paragraph' ? (
          <div
            className="leading-normal text-justify relative p-5 bg-white/60 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-700/60 rounded-lg whitespace-pre-wrap shadow-sm"
            data-oid="_zy0lsk"
          >
            {question.matching_features?.questions_title && (
              <h4
                className="font-bold text-center mb-4 text-slate-800 dark:text-slate-100 text-lg"
                data-oid="summary-title"
              >
                {question.matching_features.questions_title}
              </h4>
            )}
            {(() => {
              // Paragraph Mode Rendering
              const text = question.matching_features.text || '';
              const parts = text.split(/\[(\d+)\]/g);

              return (
                <div data-oid="eu5op:q">
                  {parts.map((part, pIdx) => {
                    if (pIdx % 2 === 1) {
                      // This is a placeholder number (captured group)
                      const placeholderNum = parseInt(part);
                      const globalNum = placeholderNum;
                      const itemKey = `${question.id}_${placeholderNum}`;
                      const value = answers[itemKey] || '';
                      const validation = validationMap?.[itemKey];
                      const isCorrect = validation?.isCorrect === true;
                      const isTypo = validation?.isTypo === true;
                      let circleStatus = 'default';
                      if (isFinished && validation) {
                        circleStatus = isCorrect
                          ? 'correct'
                          : isTypo
                            ? 'typo'
                            : value
                              ? 'incorrect'
                              : 'unanswered';
                      }

                      let selectStyle = `inline-flex w-[90px] h-8 px-2 py-1 text-center bg-white/70 dark:bg-slate-950/40 border border-slate-300/70 dark:border-slate-700/70 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/50 hover:border-slate-400/80 dark:hover:border-slate-600/80 transition-all text-base ${isFinished ? 'opacity-100 cursor-not-allowed' : ''}`;
                      if (isFinished && value) {
                        if (isCorrect)
                          selectStyle +=
                            ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                        else
                          selectStyle +=
                            ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
                      }

                      return (
                        <span
                          key={pIdx}
                          className="inline-flex items-center gap-2 mx-1 align-middle leading-none"
                          data-oid="2i8ke49"
                        >
                          <QuestionNumberCircle
                            number={globalNum}
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
                                let label = String.fromCharCode(65 + oIdx);
                                if (question.matching_features.style === 'ROMAN') {
                                  label = toRoman(oIdx + 1).toLowerCase();
                                }
                                return (
                                  <SelectItem key={oIdx} value={label} data-oid="m.p2vhi">
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {/* Inline DeepDive for Matching Features (paragraph mode) */}
                          {isFinished &&
                            explanationData &&
                            (() => {
                              const actualKey = explanationData.blanks?.[globalNum]
                                ? globalNum
                                : null;
                              if (!actualKey) return null;

                              return (
                                <DeepDivePopover
                                  explanationData={explanationData}
                                  userAnswer={value}
                                  isOpen={openDeepDive === itemKey}
                                  onToggle={() =>
                                    setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                                  }
                                  questionType={question.type}
                                  blankKey={actualKey}
                                  inline={true}
                                />
                              );
                            })()}
                        </span>
                      );
                    } else {
                      // Text part
                      return (
                        <span key={pIdx} data-oid="tiozug6">
                          {part}
                        </span>
                      );
                    }
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-2 w-full overflow-hidden" data-oid="wycyjva">
            {question.matching_features?.questions?.map((q, idx) => {
              // Calculate global question number
              // For list mode, it's sequential
              const globalNum = calculateGlobalQuestionNumber(allQuestions, question.id) + idx;
              const itemKey = `${question.id}_${q.id}`;
              const value = answers[itemKey] || '';
              const validation = validationMap?.[itemKey];
              const isCorrect = validation?.isCorrect === true;
              const isTypo = validation?.isTypo === true;
              let circleStatus = 'default';
              if (isFinished && validation) {
                circleStatus = isCorrect
                  ? 'correct'
                  : isTypo
                    ? 'typo'
                    : value
                      ? 'incorrect'
                      : 'unanswered';
              }

              let selectStyle = `bg-white dark:bg-slate-950/40 ${isFinished ? 'opacity-100 cursor-not-allowed' : ''}`;
              if (isFinished && value) {
                if (isCorrect)
                  selectStyle +=
                    ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 font-semibold';
                else
                  selectStyle +=
                    ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 font-semibold';
              }

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-white/60 dark:bg-slate-950/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60 w-full"
                  data-oid="o37jbrr"
                >
                  <div className="flex-shrink-0" data-oid="59dx2qp">
                    <QuestionNumberCircle
                      number={globalNum}
                      isFlagged={flaggedQuestions.has(itemKey)}
                      onClick={() => onToggleFlag(itemKey)}
                      status={circleStatus}
                      data-oid="qky479a"
                    />
                  </div>

                  <div
                    className="flex-1 min-w-0 flex items-center justify-start gap-8"
                    data-oid="vvpxgdr"
                  >
                    <div className="text-foreground text-base leading-relaxed" data-oid="ofvjdev">
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
                          'h-8 w-[100px] flex-shrink-0 text-sm transition-all shadow-sm border-slate-300/50',
                          selectStyle,
                          !value && 'text-slate-400'
                        )}
                        data-oid="-fxljhw"
                      >
                        <SelectValue placeholder="Select" data-oid="48i1pis" />
                      </SelectTrigger>
                      <SelectContent className="min-w-[100px]" data-oid="jh_wbb_">
                        {question.matching_features?.options?.map((opt, oIdx) => {
                          let label = String.fromCharCode(65 + oIdx);
                          if (question.matching_features.style === 'ROMAN') {
                            label = toRoman(oIdx + 1).toLowerCase();
                          }
                          return (
                            <SelectItem
                              key={oIdx}
                              value={label}
                              className="text-base"
                              data-oid="kp_qks8"
                            >
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Inline DeepDive for Matching Features (questions mode) */}
                    {isFinished &&
                      explanationData &&
                      (() => {
                        const actualKey = explanationData.blanks?.[globalNum] ? globalNum : null;
                        if (!actualKey) return null;

                        return (
                          <DeepDivePopover
                            explanationData={explanationData}
                            userAnswer={value}
                            isOpen={openDeepDive === itemKey}
                            onToggle={() =>
                              setOpenDeepDive?.(openDeepDive === itemKey ? null : itemKey)
                            }
                            questionType={question.type}
                            blankKey={actualKey}
                            inline={true}
                          />
                        );
                      })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
});

export default MatchingRenderer;
