/** Shapes the report's visuals from data it already has. Pure, shared with the PDF. */
import { essayParagraphs } from '../../../../../supabase/functions/_shared/writingBandModels';

const flat = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
const loose = (text) =>
  flat(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, '');

/** Every score, the target and Band 8 as positions (0–100) on one scale. */
export function buildLadder(criteria, targetBand) {
  const low = Math.max(0, Math.min(4, ...criteria.map((row) => Math.floor(row.score))));
  const high = 9;
  const at = (value) => Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
  const target = Number(targetBand) > 0 ? Number(targetBand) : null;
  return {
    low,
    high,
    ticks: Array.from({ length: high - low + 1 }, (_, index) => low + index),
    target,
    targetAt: target === null ? null : at(target),
    eightAt: at(8),
    rows: criteria.map((row) => ({
      ...row,
      at: at(row.score),
      atTarget: target !== null && row.score >= target,
    })),
  };
}

/** One number per fix, in list order, so the essay and the list agree. */
export function numberMistakes(groups) {
  let n = 0;
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item, n: ++n })),
  }));
}

const overlapsAny = (spans, start, end) =>
  (spans || []).some((span) => start < span.end && span.start < end);

/** The first occurrence not already marked, or -1. */
function freeIndex(text, needle, spans) {
  for (let start = text.indexOf(needle); start >= 0; start = text.indexOf(needle, start + 1)) {
    if (!overlapsAny(spans, start, start + needle.length)) return start;
  }
  return -1;
}

function searchParagraphs(paragraphs, needle, taken) {
  for (const [index, text] of paragraphs.entries()) {
    const start = freeIndex(text, needle, taken[index]);
    if (start >= 0) return { paragraph: index, start, end: start + needle.length };
  }
  return null;
}

/** An exact match anywhere beats a match that differs only in capitals. */
const findOnce = (paragraphs, phrase, taken) => {
  const wanted = flat(phrase);
  if (!wanted) return null;
  return (
    searchParagraphs(paragraphs, wanted, taken) ||
    searchParagraphs(
      paragraphs.map((paragraph) => paragraph.toLowerCase()),
      wanted.toLowerCase(),
      taken
    )
  );
};

function placeMarks(paragraphs, marks) {
  const taken = {};
  for (const mark of marks) {
    const place = findOnce(paragraphs, mark.phrase, taken);
    if (place) (taken[place.paragraph] ??= []).push({ ...mark, ...place });
  }
  return taken;
}

const mistakeMarks = (groups) =>
  groups.flatMap((group) =>
    group.items.map((item) => ({
      phrase: item.original,
      n: item.n,
      kind: item.annotation?.severity === 'suggestion' ? 'suggestion' : 'error',
    }))
  );

/** The essay split into paragraphs of plain and marked pieces. */
export function markEssay(essay, groups, goodPhrases = []) {
  const paragraphs = essayParagraphs(essay);
  const marks = placeMarks(paragraphs, [
    ...mistakeMarks(groups),
    ...goodPhrases.map((phrase) => ({ phrase, n: null, kind: 'good' })),
  ]);
  return paragraphs.map((text, index) => {
    const segments = [];
    let cursor = 0;
    for (const mark of (marks[index] || []).sort((a, b) => a.start - b.start)) {
      if (mark.start > cursor)
        segments.push({ text: text.slice(cursor, mark.start), kind: null, n: null });
      segments.push({ text: text.slice(mark.start, mark.end), kind: mark.kind, n: mark.n });
      cursor = mark.end;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor), kind: null, n: null });
    return segments;
  });
}

function rolesFor(count, taskType) {
  // With fewer than three paragraphs, naming an introduction would be a guess.
  if (count < 3)
    return Array.from({ length: count }, (_, i) => ({ role: 'paragraph', number: i + 1 }));
  let body = 0;
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return { role: 'intro', number: null };
    // A Task 1 report has no conclusion paragraph.
    if (taskType === 'Task 2' && index === count - 1) return { role: 'conclusion', number: null };
    return { role: 'body', number: ++body };
  });
}

const noteFor = (text, paragraphNotes) => {
  const opening = loose(text);
  const match = (paragraphNotes || []).find((entry) => {
    const key = loose(entry?.opening);
    return key.length >= 3 && opening.startsWith(key);
  });
  return flat(match?.note);
};

/** Each paragraph's size, number of marked mistakes and the examiner's note. */
export function buildEssayMap(essay, taskType, groups, paragraphNotes) {
  const paragraphs = essayParagraphs(essay);
  const marks = placeMarks(paragraphs, mistakeMarks(groups));
  const words = paragraphs.map((text) => text.split(' ').length);
  const total = words.reduce((sum, count) => sum + count, 0) || 1;
  return rolesFor(paragraphs.length, taskType).map((role, index) => ({
    ...role,
    index,
    words: words[index],
    share: (words[index] / total) * 100,
    mistakes: (marks[index] || []).length,
    note: noteFor(paragraphs[index], paragraphNotes),
  }));
}

const MAX_DRILLS = 3;
const PRACTICE_FOR_CRITERION = { grammar: '/grammar', vocabulary: '/vocabulary' };

const countIn = (groups, id) => groups.find((group) => group.id === id)?.items.length || 0;

/** The paragraph with most marked mistakes; a body paragraph wins a tie. */
function weakestParagraph(essayMap) {
  const body = (entry) => (entry.role === 'body' ? 1 : 0);
  return essayMap
    .filter((entry) => entry.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes || body(b) - body(a) || a.index - b.index)[0];
}

function rewriteDrill({ essayMap, canRevise, comparable }) {
  const paragraph = weakestParagraph(essayMap);
  if (!paragraph) return null;
  const action = canRevise ? 'revise' : comparable.includes(paragraph.index) ? 'compare' : null;
  return { id: 'rewrite', paragraph, count: paragraph.mistakes, action };
}

function grammarDrill({ fixes }) {
  const count = countIn(fixes, 'grammar');
  if (!count) return null;
  const total = fixes.reduce((sum, group) => sum + group.items.length, 0);
  return { id: 'grammar', count, total, to: '/grammar' };
}

/**
 * The comparisons worth showing: only those above the learner's own score.
 *
 * @param {unknown} score
 */
export const bandsAbove = (score) => [7, 8].filter((band) => band > (Number(score) || 0));

/** The word suggestions "Practise next" shows. */
export function reportedWords(vocabulary) {
  return (Array.isArray(vocabulary) ? vocabulary : [])
    .map((entry) => ({
      original: flat(entry?.original),
      alternatives: (entry?.alternatives || []).map(flat).filter(Boolean).slice(0, 3),
    }))
    .filter((entry) => entry.original && entry.alternatives.length)
    .slice(0, 3);
}

/** The marker's word suggestions, or failing that the word-choice fixes. */
function wordsDrill({ fixes, vocabulary }) {
  const words = reportedWords(vocabulary);
  if (words.length) return { id: 'vocabulary', words, to: '/vocabulary' };
  const count = countIn(fixes, 'words');
  return count ? { id: 'words', count, to: '/vocabulary' } : null;
}

function criterionDrill({ criteria }) {
  const lowest = [...criteria].sort((a, b) => a.score - b.score)[0];
  if (!lowest) return null;
  return {
    id: 'criterion',
    criterion: lowest.label,
    score: lowest.score,
    to: PRACTICE_FOR_CRITERION[lowest.id] || null,
  };
}

/**
 * Up to three things to practise, each taken from this report: nothing is
 * suggested that the essay gives no reason for.
 *
 * Typed in JSDoc because the mobile app type-checks its copy of this file.
 *
 * @param {object} input
 * @param {any[]} [input.criteria]
 * @param {any[]} [input.fixes]
 * @param {any[]} [input.essayMap]
 * @param {any} [input.vocabulary]
 * @param {boolean} [input.canRevise]
 * @param {number[]} [input.comparable]
 * @returns {any[]}
 */
export function buildPractice({
  criteria = [],
  fixes = [],
  essayMap = [],
  vocabulary = [],
  canRevise = false,
  /** Paragraph indexes that have a Band 7/8 version available. */
  comparable = [],
}) {
  const input = { criteria, fixes, essayMap, vocabulary, canRevise, comparable };
  const drills = [rewriteDrill, grammarDrill, wordsDrill]
    .map((rule) => rule(input))
    .filter(Boolean);
  if (drills.length < 2) {
    const fallback = criterionDrill(input);
    if (fallback) drills.push(fallback);
  }
  return drills.slice(0, MAX_DRILLS);
}
