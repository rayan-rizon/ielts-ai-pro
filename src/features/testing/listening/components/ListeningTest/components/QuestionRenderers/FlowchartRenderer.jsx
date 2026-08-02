import React from 'react';
import { ArrowDown } from 'lucide-react';
import GapFillContent from '../GapFillContent';
import { cn } from '@/lib/cn';
import { ACCENT_TEXT } from '@/features/testing/shared/questionUiTokens';

const FlowchartRenderer = ({
  question,
  answers,
  handleAnswerChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap = {},
  isInsideMergedCard,
  cardClass,
}) => {
  const flowchart = question.flowchart;
  if (!flowchart) return null;

  return (
    <div
      key={question.id}
      id={`question-${question.id}`}
      className={cardClass}
      data-oid="flowchart-renderer"
    >
      <div
        className={cn('p-1.5 sm:p-2.5 flex flex-col items-center', isInsideMergedCard && 'px-0')}
      >
        {/* External Options Box */}
        {flowchart.answer_mode === 'dropdown' && flowchart.options?.length > 0 && (
          <div className="mb-3 border border-[#e4e2f0] dark:border-white/[0.07] p-3 bg-[#f4f3fb] dark:bg-white/[0.04] rounded-xl inline-block min-w-[200px] shadow-sm">
            <ul className="space-y-1">
              {flowchart.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx);
                return (
                  <li
                    key={idx}
                    className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2 items-baseline"
                  >
                    <span className={cn('shrink-0 w-4 font-bold', ACCENT_TEXT)}>{label}.</span>
                    <span>{opt}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Flowchart Outer Border Box */}
        <div className="border border-[#e4e2f0] dark:border-white/[0.07] p-2 sm:p-3 rounded-2xl bg-[#f4f3fb]/60 dark:bg-white/[0.03] w-full shadow-xs">
          {/* Flowchart Title */}
          {flowchart.box_title && (
            <div className="mb-2 text-center">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {flowchart.box_title}
              </h3>
            </div>
          )}

          {/* Steps Container */}
          <div className="flex flex-col items-center max-w-3xl mx-auto space-y-0 gap-1 sm:gap-1.5">
            {(() => {
              let cumulativeGaps = 0;
              return flowchart.steps.map((step, idx) => {
                const stepText = step.text || '';
                const currentGaps = (stepText.match(/\[gap\]|__BLANK__|__BLANK_\d+__/g) || [])
                  .length;

                const result = (
                  <React.Fragment key={step.id}>
                    {/* Step Box */}
                    <div className="w-full bg-white dark:bg-[#131315] border border-[#e4e2f0] dark:border-white/[0.07] px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center rounded-xl shadow-xs hover:border-[#5a63df]/40 dark:hover:border-[#5a63df]/40 transition-all duration-200 relative">
                      <div className="w-full text-[14.5px] font-medium leading-normal text-slate-800 dark:text-slate-200">
                        <GapFillContent
                          question={{
                            id: question.id,
                            gap_fill: { text: stepText },
                          }}
                          answers={answers}
                          handleAnswerChange={handleAnswerChange}
                          isFinished={isFinished}
                          questionNum={question._displayStartNumber || question.question_number}
                          gapStartIndex={cumulativeGaps}
                          toggleFlag={toggleFlag}
                          flaggedQuestions={flaggedQuestions}
                          correctAnswersMap={correctAnswersMap}
                          idPrefix={step.id}
                          variant="flowchart"
                          answerMode={flowchart.answer_mode}
                          options={flowchart.options}
                        />
                      </div>
                    </div>

                    {/* Arrow Connector */}
                    {idx < flowchart.steps.length - 1 && (
                      <div className="py-0 flex justify-center">
                        <ArrowDown
                          className="w-4 h-4 text-[#5a63df]/70 dark:text-[#a9afff]/70 animate-pulse"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
                cumulativeGaps += currentGaps;
                return result;
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowchartRenderer;
