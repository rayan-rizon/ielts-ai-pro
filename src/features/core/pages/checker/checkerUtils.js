/**
 * Utility helpers used by the IELTS writing checker components.
 */

/** Strip HTML tags from a string. */
export const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Count the number of whitespace-separated words in a string (after stripping HTML). */
export const countWords = (value) => {
  const plain = stripHtml(value);
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
};

/**
 * Resolve a value from two sources (primary and fallback), trying both camelCase and snake_case keys.
 */
function resolveField(primary, fallback, camelKey, snakeKey) {
  return primary[camelKey] ?? primary[snakeKey] ?? fallback[camelKey] ?? fallback[snakeKey];
}

/** Coalesce an array field from primary and fallback sources. */
function resolveArray(primary, fallback, key) {
  const value = primary[key] ?? fallback[key];
  return Array.isArray(value) ? value : [];
}

/**
 * Normalize the feedback payload from the API into a consistent shape.
 * Handles both camelCase and snake_case response formats.
 */
export const normalizeFeedback = (result) => {
  const raw = result?.data || result || {};
  const feedback = raw.feedback || raw;
  const overallRaw = resolveField(feedback, raw, 'overallBand', 'overall_band') || 0;

  // The v3+ evaluator emits `priorities` ({criterion, issue, action}) instead of
  // separate weaknesses/suggestions lists, so derive those for the result panel.
  const priorities = resolveArray(feedback, raw, 'priorities');
  const weaknesses = resolveArray(feedback, raw, 'weaknesses');
  const suggestions = resolveArray(feedback, raw, 'suggestions');
  const priorityWeaknesses = priorities
    .map((item) =>
      item?.issue ? `${item.criterion ? `${item.criterion}: ` : ''}${item.issue}` : ''
    )
    .filter(Boolean);
  const priorityActions = priorities.map((item) => item?.action).filter(Boolean);

  return {
    ...feedback,
    overallBand: Number.parseFloat(overallRaw) || null,
    criteriaScores: resolveField(feedback, raw, 'criteriaScores', 'criteria_scores') || {},
    strengths: resolveArray(feedback, raw, 'strengths'),
    priorities,
    weaknesses: weaknesses.concat(priorityWeaknesses),
    suggestions: suggestions.length ? suggestions : priorityActions,
    corrections: resolveArray(feedback, raw, 'corrections'),
    vocabularyEnhancements: resolveArray(feedback, raw, 'vocabularyEnhancements'),
  };
};

/**
 * Extract the four IELTS criteria scores from normalized feedback,
 * mapping the correct label for Task 1 vs Task 2.
 */
export const getCriteria = (feedback, taskType) => {
  const scores = feedback?.criteriaScores || {};
  return [
    {
      label: taskType === 'Task 1' ? 'Task Achievement' : 'Task Response',
      score:
        scores.TaskAchievement ??
        scores.TaskResponse ??
        scores.task_achievement ??
        scores.task_response,
    },
    {
      label: 'Coherence & Cohesion',
      score: scores.CoherenceAndCohesion ?? scores.coherence_and_cohesion,
    },
    { label: 'Lexical Resource', score: scores.LexicalResource ?? scores.lexical_resource },
    {
      label: 'Grammatical Range & Accuracy',
      score: scores.GrammaticalRangeAndAccuracy ?? scores.grammatical_range_and_accuracy,
    },
  ];
};
