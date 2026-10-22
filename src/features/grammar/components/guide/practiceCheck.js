// Fair answer checking for the guide exercises. A learner's correction can be
// right without matching the model word for word, so a typed answer is never
// marked "wrong" here: it either matches an accepted model or is sent to the
// learner to compare.

const TRAILING_NOTE = /\s*\([^)]*\)\s*$/;

export function stripMarkdown(value) {
  // "\_" is a literal underscore (a blank), not emphasis, so protect it first.
  return String(value ?? '')
    .replace(/\\_/g, '\uE000')
    .replace(/\*\*|__/g, '')
    .replace(/[*_]/g, '')
    .replace(/\uE000/g, '_')
    .trim();
}

function normalize(value) {
  return stripMarkdown(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.;:!?]+$/, '');
}

// Short answers ("—, a", "will use") ignore spacing and commas around the parts.
const squash = (value) => value.replace(/[\s,]+/g, '');

/** "_A_ / _B_ (note)" -> the list of acceptable normalised answers. */
export function acceptedAnswers(answer) {
  return stripMarkdown(String(answer ?? '').replace(TRAILING_NOTE, ''))
    .split(/\s\/\s/)
    .map(normalize)
    .filter(Boolean);
}

/** @returns {'empty' | 'match' | 'different'} */
export function checkTypedAnswer(input, answer) {
  const typed = normalize(input);
  if (!typed) return 'empty';
  const accepted = acceptedAnswers(answer);
  const isShort = (value) => value.length <= 24;
  const matches = accepted.some(
    (candidate) =>
      candidate === typed || (isShort(candidate) && squash(candidate) === squash(typed))
  );
  return matches ? 'match' : 'different';
}

export function isLongAnswer(item) {
  return stripMarkdown(item?.answer).length > 140 || stripMarkdown(item?.question).length > 140;
}

/** Correction-style exercises start from the learner's own copy of the sentence. */
export function shouldPrefill(item, prompt) {
  if (!/^correct\b/i.test(String(prompt || '').replace(/[*_]/g, ''))) return false;
  if (item.options?.length) return false;
  return !/\[blank\]|_{2,}/i.test(item.question || '');
}

const SUCCESS = new Set(['correct', 'got']);

export function isSuccess(result) {
  return SUCCESS.has(result?.status);
}
