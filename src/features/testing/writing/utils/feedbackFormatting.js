/**
 * Shared text-formatting utilities for writing feedback UI.
 * Kept in a separate module so FeedbackPanel stays below complexity thresholds.
 */

/**
 * Strip markdown markup and optional bold headings from a feedback string.
 */
export function cleanFeedbackText(value, { dropHeading = false } = {}) {
  let text = typeof value === 'string' ? value : '';
  if (dropHeading) {
    text = text.replace(/^\s*\*\*[^*\n:]{2,64}:\*\*\s*/u, '');
  }

  return text
    .replace(/\*\*([^*]+)\*\*/gu, '$1')
    .replace(/__([^_]+)__/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/~~([^~]+)~~/gu, '$1')
    .replace(/^\s*[-*•]\s+/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Trim cleaned text to maxChars, preferring a sentence boundary.
 * Returns the raw cleaned string (not an object).
 */
export function compactUiText(value, maxChars, options) {
  const cleaned = cleanFeedbackText(value, options);
  if (!cleaned || cleaned.length <= maxChars) return cleaned;

  const firstSentence = cleaned.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= maxChars) return firstSentence;

  const clipped = cleaned.slice(0, maxChars - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > maxChars * 0.65 ? lastSpace : clipped.length).trim()}…`;
}

/**
 * Return a { full, preview, isTruncated } object for expandable text fields.
 */
export function prepareFeedbackText(value, maxChars, options) {
  const full = cleanFeedbackText(value, options);
  const preview = compactUiText(full, maxChars);

  return {
    full,
    preview,
    isTruncated: full !== preview,
  };
}
