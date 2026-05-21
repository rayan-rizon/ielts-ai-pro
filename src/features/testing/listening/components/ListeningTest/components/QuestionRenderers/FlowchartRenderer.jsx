import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowDown } from 'lucide-react';
import GapFillContent from '../GapFillContent';
import { cn } from '@/lib/cn';

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
      <div className={cn('p-2 sm:p-4 flex flex-col items-center', isInsideMergedCard && 'px-0')}>
        {/* External Options Box - Matches Image 1 (Top, Centered, Standard Border) */}
        {flowchart.answer_mode === 'dropdown' && flowchart.options?.length > 0 && (
          <div className="mb-6 border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl inline-block min-w-[200px] shadow-sm">
            <ul className="space-y-1.5">
              {flowchart.options.map((opt, idx) => {
                const label = String.fromCharCode(65 + idx);
                return (
                  <li
                    key={idx}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-2.5 items-baseline"
                  >
                    <span className="shrink-0 w-5 font-bold text-primary">{label}.</span>
                    <span>{opt}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Flowchart Outer Border Box - Matches Global Theme */}
        <div className="border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-950/50 w-full shadow-sm">
          {/* Flowchart Title - Styled for Consistency */}
          {flowchart.box_title && (
            <p className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-4 text-center leading-relaxed">
              {flowchart.box_title}
            </p>
          )}

          {/* Steps Container */}
          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-0">
            {(() => {
              let cumulativeGaps = 0;
              return flowchart.steps.map((step, idx) => {
                const stepText = step.text || '';
                const currentGaps = (stepText.match(/\[gap\]|__BLANK__|__BLANK_\d+__/g) || [])
                  .length;

                const result = (
                  <React.Fragment key={step.id}>
                    {/* Step Box - Standard Card Style */}
                    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center rounded-xl shadow-sm hover:border-primary/30 transition-colors">
                      <div className="w-full">
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

                    {/* Arrow - Improved Visibility */}
                    {idx < flowchart.steps.length - 1 && (
                      <div className="py-2 flex justify-center">
                        <ArrowDown className="w-6 h-6 text-slate-400 dark:text-slate-500" />
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
