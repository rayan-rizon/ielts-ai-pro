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
    accuracy: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
  };
}

/**
 * Tone for a question-type row.
 *
 * Sample size is checked before accuracy on purpose: 0% from two questions is
 * noise, and colouring it like a real weakness sends learners to drill a
 * question type they have barely met.
 */
export function questionSuccessTone(accuracy, sampleSize = 0) {
  if (sampleSize < 5) {
    return { label: 'Low sample', pill: 'neutral', bar: 'bg-slate-300 dark:bg-white/20' };
  }
  if (accuracy >= 70) {
    return { label: 'Strong', pill: 'ok', bar: 'bg-[rgb(var(--signal-ok))]' };
  }
  if (accuracy >= 50) {
    return { label: 'Developing', pill: 'warn', bar: 'bg-[rgb(var(--signal-warn))]' };
  }
  return { label: 'Focus next', pill: 'accent', bar: 'bg-[#5a63df]' };
}
