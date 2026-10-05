import { percentOf } from '@/features/testing/shared/utils/resultEvidence';

export function getQuestionSuccessSummary(data = []) {
  const totals = data.reduce(
    (summary, item) => ({
      correct: summary.correct + (Number(item.correct) || 0),
      total: summary.total + (Number(item.total) || 0),
    }),
    { correct: 0, total: 0 }
  );

  return {
    ...totals,
    accuracy: percentOf(totals.correct, totals.total),
  };
}

/**
 * Plain-words verdict for one question type, used in its tooltip.
 *
 * Sample size is checked before accuracy on purpose: 0% from two questions is
 * noise, and calling that a weakness sends learners to drill a question type
 * they have barely met. In the chart this mostly resolves itself — bar length
 * tracks how many questions were sat, so a tiny sample is a tiny bar — but the
 * tooltip still says so outright.
 */
export function questionTypeVerdict(accuracy, sampleSize = 0) {
  if (Number(sampleSize) < 5) return 'Too few answered to judge yet';
  if (accuracy >= 70) return 'Strong';
  if (accuracy >= 50) return 'Developing';
  return 'Needs work';
}

/**
 * Marks actually dropped on a question type.
 *
 * Ranking by accuracy alone put "0% of 4 questions" above "0% of 76", which is
 * exactly backwards as a practice queue — the second one is costing nineteen
 * times as many marks. This is the number the list is ordered by.
 */
export function marksLost(item) {
  const total = Number(item?.total) || 0;
  const correct = Number(item?.correct) || 0;
  return Math.max(0, total - correct);
}
