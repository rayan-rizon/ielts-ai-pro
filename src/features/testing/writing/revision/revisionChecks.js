/** What a revised draft changed, and why its estimate moved. */
import {
  endsMidSentence,
  markingParagraphs,
} from '../../../../../supabase/functions/_shared/writingRevisionText';

/** Fewer changed words than this rarely moves a score. */
const SMALL_EDIT_WORDS = 15;
const MINIMUM_WORDS = { 'Task 1': 150, 'Task 2': 250 };

/** Words, with each paragraph break kept as its own token. */
const tokensOf = (text) =>
  markingParagraphs(text)
    .split(/(\n\n)|[ \t]+/)
    .filter(Boolean);

/** Longest-common-subsequence lengths for every pair of suffixes. */
function commonLengths(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

/** Whether the longest shared run is kept by dropping a word from the original. */
function dropsFirst(table, { a, b, i, j }) {
  if (i >= a.length) return false;
  return j >= b.length || table[i + 1][j] >= table[i][j + 1];
}

const keeps = ({ a, b, i, j }) => i < a.length && a[i] === b[j];

function tokenSteps(a, b) {
  const table = commonLengths(a, b);
  const steps = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    const at = { a, b, i, j };
    if (keeps(at)) {
      steps.push({ type: 'same', token: a[i] });
      i += 1;
      j += 1;
    } else if (dropsFirst(table, at)) {
      steps.push({ type: 'removed', token: a[i] });
      i += 1;
    } else {
      steps.push({ type: 'added', token: b[j] });
      j += 1;
    }
  }
  return steps;
}

const joinTokens = (tokens) => tokens.join(' ').replace(/ ?\n\n ?/g, '\n\n');

/** The draft against the original, as runs of kept, removed and added words. */
export function diffWords(before, after) {
  const runs = [];
  for (const { type, token } of tokenSteps(tokensOf(before), tokensOf(after))) {
    const last = runs.at(-1);
    if (last?.type === type) last.tokens.push(token);
    else runs.push({ type, tokens: [token] });
  }
  return runs.map(({ type, tokens }) => ({ type, text: joinTokens(tokens) }));
}

const countWords = (text) => String(text || '').match(/\S+/g)?.length || 0;

export function revisionSummary(original, draft, taskType) {
  const runs = diffWords(original, draft);
  const wordsIn = (type) =>
    runs.filter((run) => run.type === type).reduce((sum, run) => sum + countWords(run.text), 0);
  const added = wordsIn('added');
  const removed = wordsIn('removed');
  const words = countWords(draft);
  const minimum = MINIMUM_WORDS[taskType] || MINIMUM_WORDS['Task 2'];
  return {
    runs,
    words,
    added,
    removed,
    // A new paragraph break counts: paragraphing is part of Coherence and Cohesion.
    changed: runs.some((run) => run.type !== 'same'),
    unfinished: endsMidSentence(draft),
    small: Math.max(added, removed) < SMALL_EDIT_WORDS,
    minimum,
    belowMinimum: words < minimum,
  };
}

const sameCriterion = (name) =>
  String(name || '')
    .replace(/&/g, 'and')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();

const criterionLabel = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(' And ', ' and ')
    .replace(' And ', ' and ');

/** Each score before and after, with the marker's note for the ones that moved. */
export function criterionChanges(before = {}, after = {}, priorities = []) {
  return Object.entries(after).map(([key, score]) => {
    const previous = Number(before[key]);
    const delta = Number.isFinite(previous) ? Number(score) - previous : 0;
    const about =
      delta !== 0 &&
      priorities.find((item) => sameCriterion(item.criterion) === sameCriterion(key));
    return {
      key,
      label: criterionLabel(key),
      before: Number.isFinite(previous) ? previous : null,
      after: Number(score),
      delta,
      note: about?.issue || '',
      evidence: about?.evidenceText || '',
    };
  });
}
