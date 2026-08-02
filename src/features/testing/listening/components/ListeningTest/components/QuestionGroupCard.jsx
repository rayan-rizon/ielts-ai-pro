import React from 'react';
import { Lightbulb } from 'lucide-react';
import { formatInstructionHTML } from '@/lib/utils';
import { cn } from '@/lib/cn';
import {
  PANEL_CARD,
  INSTRUCTION_RAIL,
  INSTRUCTION_ICON_CHIP,
} from '@/features/testing/shared/questionUiTokens';
import QuestionRendererDispatcher from './QuestionRendererDispatcher';

export default function QuestionGroupCard({
  group,
  answers,
  handleAnswerChange,
  handleMultiSelectChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap,
}) {
  const hasInstructions = group.instructions && group.instructions !== '<p><br></p>';

  return (
    <div className="mb-3" data-oid=".ffofwm">
      <div
        className={cn(
          PANEL_CARD,
          'relative shadow-2xs overflow-hidden transition-all duration-200'
        )}
        data-oid="yfsdv5u"
      >
        {hasInstructions && (
          <div
            className="relative px-3.5 py-2.5 bg-[#5a63df]/[0.05] dark:bg-[#131315] border-b border-[#5a63df]/10 dark:border-[#5a63df]/25 flex items-start gap-2.5"
            data-oid="6dw9uti"
          >
            <span className={INSTRUCTION_RAIL} aria-hidden="true" />
            <div className={cn('p-1 rounded-lg shrink-0 mt-0.5', INSTRUCTION_ICON_CHIP)}>
              <Lightbulb className="w-3.5 h-3.5" data-oid="3h83xkd" />
            </div>
            <div
              className="text-[14px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: formatInstructionHTML(group.instructions),
              }}
              data-oid="cpz5p_a"
            />
          </div>
        )}

        {group.mcq_title && (
          <div className="px-2.5 pt-2" data-oid="z15c3c.">
            <div className="flex items-center justify-center gap-3 mb-2" data-oid="1n1k.e1">
              <div
                className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.10] to-transparent"
                data-oid="nhsoa0s"
              />

              <h3
                className="text-center font-bold text-base text-slate-800 dark:text-slate-200 tracking-tight"
                data-oid="g6izwei"
              >
                {group.mcq_title}
              </h3>
              <div
                className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-white/[0.10] to-transparent"
                data-oid="nu3tn.2"
              />
            </div>
          </div>
        )}

        <div
          className={`px-2.5 pb-2.5 ${!group.mcq_title && !hasInstructions ? 'p-2 sm:p-2.5' : 'pt-1'}`}
          data-oid="mt_5c5t"
        >
          {!hasInstructions && !group.mcq_title && (
            <div className="mb-2" data-oid="jh.-gh7">
              <div className="flex items-center gap-3 mb-1.5" data-oid=".vlkfrk">
                <div
                  className="w-7 h-7 rounded-lg bg-[#5a63df] flex items-center justify-center shrink-0"
                  data-oid="1_4q4.x"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-white" data-oid=":cg-0hu" />
                </div>
                <div data-oid="oh:s49w">
                  <h2
                    className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200"
                    data-oid="gj95ryw"
                  >
                    Questions {group.questions[0]?._displayStartNumber}–
                    {group.questions[group.questions.length - 1]?._displayEndNumber}
                  </h2>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3" data-oid="kt4a2v0">
            {group.questions.map((question) => (
              <QuestionRendererDispatcher
                key={question.id}
                question={question}
                answers={answers}
                handleAnswerChange={handleAnswerChange}
                handleMultiSelectChange={handleMultiSelectChange}
                toggleFlag={toggleFlag}
                flaggedQuestions={flaggedQuestions}
                isFinished={isFinished}
                correctAnswersMap={correctAnswersMap}
                isInsideMergedCard={true}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
