/**
 * "Your paragraph next to a stronger one": which paragraphs to rewrite at Band 7
 * or 8, what a usable model reply looks like, and how to highlight it.
 */
import type { WritingTaskType } from './writingReportTypes.ts';

export const MODEL_CRITERIA = ['task', 'coherence', 'vocabulary', 'grammar'] as const;
export type ModelCriterion = (typeof MODEL_CRITERIA)[number];

export type ComparisonParagraph = { index: number; text: string };
export type ModelNote = { n: number; criterion: ModelCriterion; phrase: string; why: string };
export type BandModelParagraph = {
  index: number;
  original: string;
  model: string;
  notes: ModelNote[];
};

const MIN_WORDS = 25;
const MAX_PARAGRAPH_WORDS = 220;
const MAX_PARAGRAPHS = 3;
const MAX_PARAGRAPH_CHARS = 1_800;

const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
};

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Paragraphs as the marker read them (mirrors `writingSourceForMarking`). */
export function essayParagraphs(source: unknown): string[] {
  return String(source || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, name) => HTML_ENTITIES[name])
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function bodyOf(candidates: ComparisonParagraph[], taskType: WritingTaskType) {
  if (candidates.length <= 1) return candidates;
  // A Task 1 report has no conclusion, so everything after the introduction counts.
  if (taskType === 'Task 1') return candidates.slice(1);
  if (candidates.length === 2) return candidates;
  return candidates.slice(1, -1);
}

export function comparisonParagraphs(
  source: unknown,
  taskType: WritingTaskType
): ComparisonParagraph[] {
  const candidates = essayParagraphs(source)
    .map((text, index) => ({ index, text }))
    .filter((paragraph) => countWords(paragraph.text) >= MIN_WORDS);
  return bodyOf(candidates, taskType)
    .filter(
      ({ text }) => countWords(text) <= MAX_PARAGRAPH_WORDS && text.length <= MAX_PARAGRAPH_CHARS
    )
    .slice(0, MAX_PARAGRAPHS);
}

const figures = (text: string) =>
  Array.from(text.matchAll(/\d(?:[\d,]*\d)?(?:\.\d+)?/g), (match) => match[0].replace(/,/g, ''));

type Placed = Omit<ModelNote, 'n'> & { start: number; end: number };

// The prompt bans these, but small models still write them.
const STIFF_OPENER =
  /(^|[.!?]\s+)(?:Primarily|Moreover|Furthermore|Undoubtedly|Invariably),\s+(\w)/g;
const EMPTY_EMPHASIS = /,\s*(?:undoubtedly|invariably),|\s*\b(?:undoubtedly|invariably)\b/gi;

const plainStyle = (text: string) =>
  text
    .replace(STIFF_OPENER, (_, lead: string, first: string) => lead + first.toUpperCase())
    .replace(EMPTY_EMPHASIS, '')
    .trim();

const MAX_REASON_CHARS = 300;
const trimmed = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** A note with a known criterion, a phrase and a short reason, or null. */
function readNote(note: any): Omit<ModelNote, 'n'> | null {
  const phrase = plainStyle(trimmed(note?.phrase));
  const why = trimmed(note?.why);
  if (!MODEL_CRITERIA.includes(note?.criterion)) return null;
  const complete = [phrase, why].every(Boolean);
  return complete && why.length <= MAX_REASON_CHARS
    ? { criterion: note.criterion, phrase, why }
    : null;
}

function positionOf(model: string, phrase: string) {
  const exact = model.indexOf(phrase);
  return exact >= 0 ? exact : model.toLowerCase().indexOf(phrase.toLowerCase());
}

function placeNote(model: string, note: unknown): Placed | null {
  const read = readNote(note);
  const start = read ? positionOf(model, read.phrase) : -1;
  if (!read || start < 0) return null;
  const end = start + read.phrase.length;
  return { ...read, phrase: model.slice(start, end), start, end };
}

const overlapsAny = (candidate: Placed, placed: Placed[]) =>
  placed.some((other) => candidate.start < other.end && other.start < candidate.end);

function usableNotes(model: string, notes: unknown): ModelNote[] {
  const placed: Placed[] = [];
  for (const note of Array.isArray(notes) ? notes : []) {
    const candidate = placeNote(model, note);
    if (candidate === null) continue;
    if (!overlapsAny(candidate, placed)) placed.push(candidate);
    if (placed.length === MODEL_CRITERIA.length) break;
  }
  return placed
    .sort((a, b) => a.start - b.start)
    .map(({ criterion, phrase, why }, index) => ({ n: index + 1, criterion, phrase, why }));
}

type CheckContext = {
  paragraphs: ComparisonParagraph[];
  taskType: WritingTaskType;
  /** Essay and task prompt: the only figures a Task 1 model may use. */
  sourceText: string;
};

function rewrittenText(reply: any, paragraph: ComparisonParagraph) {
  const model = plainStyle(trimmed(reply?.model).replace(/\s+/g, ' '));
  if (!model) throw new Error(`Model reply is missing paragraph ${paragraph.index}`);
  return model;
}

function checkLength(model: string, paragraph: ComparisonParagraph) {
  const ratio = countWords(model) / countWords(paragraph.text);
  if (ratio < 0.7 || ratio > 2)
    throw new Error(`Model paragraph length is out of range for paragraph ${paragraph.index}`);
}

/** A Task 1 model may not state any figure the learner did not. */
function checkFigures(model: string, known: Set<string>, taskType: WritingTaskType) {
  if (taskType !== 'Task 1') return;
  if (figures(model).some((figure) => !known.has(figure)))
    throw new Error('Model paragraph uses a figure the learner never wrote');
}

function checkParagraph(
  replies: any[],
  paragraph: ComparisonParagraph,
  known: Set<string>,
  taskType: WritingTaskType
): BandModelParagraph {
  const reply = replies.find((item) => Number(item?.index) === paragraph.index);
  const model = rewrittenText(reply, paragraph);
  checkLength(model, paragraph);
  checkFigures(model, known, taskType);
  const notes = usableNotes(model, reply.notes);
  if (notes.length < 2) throw new Error('Model reply has too few usable notes');
  return { index: paragraph.index, original: paragraph.text, model, notes };
}

const repliesIn = (parsed: any): any[] =>
  Array.isArray(parsed?.paragraphs) ? parsed.paragraphs : [];

/** Throws when any requested paragraph is unusable, so the fallback model runs. */
export function validateBandModels(
  parsed: unknown,
  { paragraphs, taskType, sourceText }: CheckContext
): BandModelParagraph[] {
  const replies = repliesIn(parsed);
  const known = new Set(figures(sourceText));
  return paragraphs.map((paragraph) => checkParagraph(replies, paragraph, known, taskType));
}

export type ModelSegment = { text: string; n: number | null };

export function segmentModelParagraph(model: string, notes: ModelNote[]): ModelSegment[] {
  const segments: ModelSegment[] = [];
  let cursor = 0;
  for (const note of [...notes].sort((a, b) => a.n - b.n)) {
    const start = model.indexOf(note.phrase, cursor);
    if (start < 0) continue;
    if (start > cursor) segments.push({ text: model.slice(cursor, start), n: null });
    segments.push({ text: note.phrase, n: note.n });
    cursor = start + note.phrase.length;
  }
  if (cursor < model.length) segments.push({ text: model.slice(cursor), n: null });
  return segments;
}
