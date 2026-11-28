/**
 * What the next band looks like for one criterion. The wording behind each key
 * is a short summary of the public IELTS Writing band descriptors.
 */

/**
 * The band to aim at: the learner's target while it is still ahead, otherwise the
 * next one up. Descriptions and model paragraphs exist for Bands 7 and 8, so a
 * target above 7 is aimed at with 8; from 8 there is nothing to add.
 */
export function bandGoal(score, target) {
  const value = Number(score);
  if (!(value > 0) || value >= 8) return null;
  return value >= 7 || Number(target) > 7 ? 8 : 7;
}

/** Matches however the marker spelt the criterion. */
const KINDS = [
  ['coherence', 'Coherence'],
  ['lexical', 'Vocabulary'],
  ['vocab', 'Vocabulary'],
  ['gramm', 'Grammar'],
  ['task', 'Task'],
];

export function goalTextKey(criterion, taskType, band) {
  const name = String(criterion || '').toLowerCase();
  const kind = KINDS.find(([part]) => name.includes(part))?.[1];
  if (!kind || !band) return null;
  // Task 1 is judged on reporting a visual, not on answering a question.
  const worded = kind === 'Task' && taskType === 'Task 1' ? 'Report' : kind;
  return `goal${worded}${band}`;
}
