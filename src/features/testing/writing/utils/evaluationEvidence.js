import {
  CURRENT_EVALUATION_VERSION,
  WRITING_CALIBRATION_REVISION,
} from '@/features/testing/shared/evaluationVersion';

export function normalizeWritingSource(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HTML_ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" };

/**
 * The essay as the marker should read it: plain text with paragraph breaks
 * kept. normalizeWritingSource flattens everything to one line, which is right
 * for cache keys and comparisons but hid the learner's paragraphing from the
 * examiner, and paragraphing is part of Coherence and Cohesion. The server
 * still hashes the flattened form, so cached reports keep matching.
 */
export function writingSourceForMarking(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, name) => HTML_ENTITIES[name])
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Task prompts are stored as rich text by the test runner and as plain text by
 * the writing checker. Compare and transmit them in one canonical shape so the
 * same Cambridge task resolves to one cache entry instead of two.
 */
export function normalizeTaskPrompt(value) {
  return normalizeWritingSource(value);
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
  if (feedback.writingCalibrationRevision !== WRITING_CALIBRATION_REVISION) return false;
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
    normalizeTaskPrompt(feedback.taskPrompt) === normalizeTaskPrompt(prompt) &&
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
