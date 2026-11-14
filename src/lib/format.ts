/**
 * Format a band score value to a consistent one decimal place string.
 * Returns '0.0' for invalid inputs.
 */
export function formatBand(value: number | string | null | undefined): string {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0.0';
  return v.toFixed(1);
}

const SUFFIXES = new Set(['JR', 'SR', 'II', 'III', 'IV', 'V']);

type GraphemeSegmenter = { segment: (input: string) => Iterable<{ segment: string }> };
type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: string }
) => GraphemeSegmenter;

function createGraphemeSegmenter(): GraphemeSegmenter | null {
  if (typeof Intl === 'undefined') return null;
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter;
  return Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null;
}

function firstGrapheme(word: string, segmenter: GraphemeSegmenter | null): string {
  if (!segmenter) return Array.from(word)[0];
  return Array.from(segmenter.segment(word), (part) => part.segment)[0];
}

function initialWords(words: string[]): string[] {
  if (words.length < 2) return words;
  let lastIndex = words.length - 1;
  const suffix = words[lastIndex].toUpperCase().replace(/\./g, '');
  if (words.length > 2 && SUFFIXES.has(suffix)) lastIndex--;
  return [words[0], words[lastIndex]];
}

/** Extract grapheme-safe initials, ignoring name suffixes and excess whitespace. */
export function getInitials(name: string | null | undefined, fallback: string = 'U'): string {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const segmenter = createGraphemeSegmenter();
  const words = initialWords(trimmed.split(/\s+/));
  return words
    .map((word) => firstGrapheme(word, segmenter))
    .join('')
    .toUpperCase();
}
