/** The rules a revised answer must meet, shared by the web app and the coach. */

const LIMITS = {
  'Task 1': { words: 50, characters: 5000 },
  'Task 2': { words: 100, characters: 8000 },
} as const;

/**
 * Whether the draft stops partway through a sentence. A cut-off ending lowers
 * the score, and a learner has one revision check, so it is caught first.
 */
export function endsMidSentence(text: string) {
  return !/[.!?…。؟۔]["'”’)\]]*$/.test(String(text || '').trim());
}

/** Paragraphs separated by a blank line, as the first review reads them. */
export function markingParagraphs(text: string) {
  return String(text || '')
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function outsideLimits(revision: string, task: keyof typeof LIMITS) {
  const words = revision.match(/\S+/g)?.length || 0;
  return words < LIMITS[task].words || revision.length > LIMITS[task].characters;
}

/** Why this draft must not use the check, or an empty string. */
export function revisionProblem(draft: {
  revision: string;
  source: string;
  taskType: 'Task 1' | 'Task 2';
}) {
  const unchanged = markingParagraphs(draft.revision) === markingParagraphs(draft.source);
  if (unchanged || outsideLimits(draft.revision, draft.taskType)) {
    return 'Revise your answer before requesting a check, and keep it within the writing limits.';
  }
  return endsMidSentence(draft.revision)
    ? 'Finish your last sentence before you check your revision. Your check has not been used.'
    : '';
}
