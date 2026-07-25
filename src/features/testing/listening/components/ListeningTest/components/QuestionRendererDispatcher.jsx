import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import GapFillRenderer from './QuestionRenderers/GapFillRenderer';
import TableCompletionRenderer from './QuestionRenderers/TableCompletionRenderer';
import MultipleChoiceRenderer from './QuestionRenderers/MultipleChoiceRenderer';
import MatchingFeaturesRenderer from './QuestionRenderers/MatchingFeaturesRenderer';
import MapLabelingRenderer from './QuestionRenderers/MapLabelingRenderer';
import FlowchartRenderer from './QuestionRenderers/FlowchartRenderer';

export default function QuestionRendererDispatcher({
  question,
  answers,
  handleAnswerChange,
  handleMultiSelectChange,
  toggleFlag,
  flaggedQuestions,
  isFinished,
  correctAnswersMap,
  isInsideMergedCard = false,
}) {
  const props = {
    question,
    answers,
    handleAnswerChange,
    onAnswerChange: handleAnswerChange,
    onMultiSelectChange: handleMultiSelectChange,
    toggleFlag,
    flaggedQuestions,
    isFinished,
    correctAnswersMap,
    isInsideMergedCard,
    cardClass: isInsideMergedCard
      ? 'mb-2.5 bg-transparent p-0 border-0 shadow-none'
      : 'mb-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900 rounded-xl overflow-hidden',
  };

  return (
    <div id={`question-${question.id}`} key={question.id} data-oid="listening-q-wrap">
      <Suspense
        fallback={
          <div className="p-4 flex justify-center" data-oid="w2itdlr">
            <Loader2 className="animate-spin h-5 w-5 text-blue-500" data-oid="62j.nqg" />
          </div>
        }
        data-oid="0p03x66"
      >
        {question.type === 'gap_fill' &&
          (question.gap_fill?.text || question.gap_fill?.content) && (
            <GapFillRenderer {...props} data-oid="vg-b476" />
          )}
        {question.type === 'table_completion' && question.table_data && (
          <TableCompletionRenderer {...props} data-oid="72j2ku2" />
        )}
        {question.type === 'multiple_choice' && question.options && (
          <MultipleChoiceRenderer {...props} data-oid="xh04nel" />
        )}
        {question.type === 'matching_features' && (
          <MatchingFeaturesRenderer {...props} data-oid="-wjd1v0" />
        )}
        {(question.type === 'map_labeling' ||
          question.type === 'diagram_label_completion' ||
          question.type === 'diagram_completion') &&
          (question.map_labeling || question.diagram_data || question.diagram_completion) && (
            <MapLabelingRenderer {...props} data-oid=".tk--5n" />
          )}
        {question.type === 'flowchart' && (
          <FlowchartRenderer {...props} data-oid="flowchart-main" />
        )}
      </Suspense>
    </div>
  );
}
