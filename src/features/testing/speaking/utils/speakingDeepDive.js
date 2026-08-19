function isQuestionFeedback(value) {
  if (!value || typeof value !== 'object') return false;
  const part = Number(value.part);
  return [1, 2, 3].includes(part) && typeof value.question === 'string';
}

/**
 * Normalizes current and historical deep-dive payloads for rendering.
 *
 * The Edge Function attaches metadata to an array-shaped analysis. Spreading
 * that array into an object produces numeric keys ("0", "1", ...), while
 * older clients and the report renderer expect an array. Keep this boundary
 * tolerant so saved reports remain readable across both representations.
 */
export function normalizeSpeakingDeepDive(value) {
  if (!value) return null;

  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value.questions)
      ? value.questions
      : Array.isArray(value.items)
        ? value.items
        : Object.entries(value)
            .filter(([key]) => /^\d+$/.test(key))
            .sort(([left], [right]) => Number(left) - Number(right))
            .map(([, item]) => item);

  const questions = candidates
    .filter(isQuestionFeedback)
    .map((item) => ({ ...item, part: Number(item.part) }));

  return questions.length > 0 ? questions : null;
}
