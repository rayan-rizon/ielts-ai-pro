/** Everything the report shows, built from the (possibly translated) feedback. */
import { useMemo } from 'react';
import {
  comparisonParagraphs,
  essayParagraphs,
} from '../../../../../supabase/functions/_shared/writingBandModels';
import {
  buildChartCheck,
  buildCriteria,
  buildMistakeGroups,
  buildNextStep,
  buildPriorities,
  buildStrengths,
  describeMarking,
  taskTypeOf,
} from '../utils/writingReportModel';
import { bandsAbove, buildEssayMap, markEssay, numberMistakes } from './reportViewModel';

export { bandsAbove };

const praisedPhrases = (feedback) =>
  (feedback.annotations || [])
    .filter((annotation) => annotation?.severity === 'positive' || annotation?.type === 'positive')
    .map((annotation) => annotation.originalText);

function buildReport(feedback, essay, taskType, t) {
  const priorities = buildPriorities(feedback);
  const fixes = numberMistakes(buildMistakeGroups(feedback, t));
  return {
    criteria: buildCriteria(feedback, t),
    nextStep: buildNextStep(feedback, priorities, t),
    chartCheck: buildChartCheck(feedback, t),
    strengths: buildStrengths(feedback),
    marking: describeMarking(feedback.scoreAgreement, t),
    fixes,
    essayMap: buildEssayMap(essay, taskType, fixes, feedback.paragraphNotes),
    marked: markEssay(essay, fixes, praisedPhrases(feedback)),
  };
}

/**
 * `feedback` is the saved report and `shown` its translated copy; the essay is
 * the learner's own, whatever the language.
 */
export function useReportContent({ feedback, shown, originalHtml, sessionId, t }) {
  const taskType = taskTypeOf(feedback);
  const essay = feedback.originalSource || originalHtml || '';
  const report = useMemo(() => buildReport(shown, essay, taskType, t), [shown, essay, taskType, t]);
  const comparable = useMemo(() => comparisonParagraphs(essay, taskType), [essay, taskType]);
  // Comparison reads the saved attempt, so it needs one, and an essay to read.
  const bands = bandsAbove(feedback.overallBand);
  const canCompare = [sessionId, bands.length, essayParagraphs(essay).length].every(Boolean);
  return { ...report, essayText: essay, taskType, comparable, bands, canCompare };
}
