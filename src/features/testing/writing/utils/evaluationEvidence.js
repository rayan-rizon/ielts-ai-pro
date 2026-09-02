import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

export function normalizeWritingSource(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateWeightedWritingBand(task1Band, task2Band) {
  const task1 = task1Band == null ? null : Number(task1Band);
  const task2 = task2Band == null ? null : Number(task2Band);
  if (Number.isFinite(task1) && Number.isFinite(task2)) {
    return Math.round(((task1 + task2 * 2) / 3) * 2) / 2;
  }
  if (Number.isFinite(task2)) return task2;
  if (Number.isFinite(task1)) return task1;
  return null;
}

export function isCurrentWritingFeedbackCache({ feedback, response, prompt, imageUrl = null }) {
  if (!feedback || feedback.evaluationVersion !== CURRENT_EVALUATION_VERSION) return false;
  if (feedback.writingCalibrationRevision !== 2) return false;
  if (feedback.taskType === 'Task 1' && !feedback.taskAnalysis) return false;
  if (feedback.originalSource == null) return false;
  const hasScore = [
    feedback.overallBand,
    feedback.overall_band,
    feedback.band_score,
    feedback.score,
  ].some((value) => value !== undefined && value !== null);
  return (
    hasScore &&
    normalizeWritingSource(feedback.originalSource) === normalizeWritingSource(response) &&
    String(feedback.taskPrompt || '') === String(prompt || '') &&
    (feedback.imageUrl || null) === (imageUrl || null)
  );
}

function readCriterion(criteria, keys) {
  for (const key of keys) {
    const score = Number(criteria?.[key]);
    if (Number.isFinite(score) && score >= 0 && score <= 9) return score;
  }
  return null;
}

export function extractWritingCriteria(feedback) {
  const criteria = feedback?.criteriaScores;
  if (!criteria) return null;
  return {
    taskAchievement: readCriterion(criteria, [
      'TaskAchievement',
      'TaskResponse',
      'task_achievement',
      'task_response',
      'TA',
      'TR',
    ]),
    coherence: readCriterion(criteria, ['Coherence & Cohesion', 'CoherenceAndCohesion', 'CC']),
    lexicalResource: readCriterion(criteria, ['Lexical Resource', 'LexicalResource', 'LR']),
    grammar: readCriterion(criteria, [
      'GrammaticalRangeAndAccuracy',
      'Grammatical Range & Accuracy',
      'GrammaticalRange',
      'GRA',
    ]),
  };
}

export function aggregateWritingCriteria(task1Feedback, task2Feedback) {
  const task1 = extractWritingCriteria(task1Feedback);
  const task2 = extractWritingCriteria(task2Feedback);
  if (!task1 && !task2) return null;
  if (!task1) return task2;
  if (!task2) return task1;

  return Object.fromEntries(
    Object.keys(task1).map((key) => {
      const first = task1[key];
      const second = task2[key];
      if (first == null) return [key, second];
      if (second == null) return [key, first];
      return [key, Math.round(((first + second * 2) / 3) * 2) / 2];
    })
  );
}
