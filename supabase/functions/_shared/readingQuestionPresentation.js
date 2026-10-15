// Presentation repairs for older imports. Never change question numbers or answers.
export const isQuestionRangeTitle = (title) =>
  /^questions?\s*\d+(?:\s*[-–—]\s*\d+)?\s*[.:]?$/i.test(String(title || '').trim());

export function readingBoxTitle(title, fallback = '') {
  return title == null || isQuestionRangeTitle(title) ? fallback : String(title).trim();
}

export function readingNotesPresentation(title, text) {
  let heading = readingBoxTitle(title);
  let body = String(text || '').replace(/\r\n?/g, '\n');
  const lines = body.split('\n');
  const first = lines.findIndex((line) => line.trim());
  const candidate = (lines[first] || '').trim().replace(/^(\*\*|__)(.*)\1$/, '$2');
  // Recover a separate short source heading, not a sentence or a numbered blank.
  const hasBody = lines.slice(first + 1).some((line) => /\[\d+\]/.test(line));
  const separateHeading =
    candidate &&
    candidate.length <= 100 &&
    candidate.split(/\s+/).length <= 12 &&
    !/[.!?:;[\]<>●•]/.test(candidate) &&
    !/^[-–]/.test(candidate) &&
    !isQuestionRangeTitle(candidate);
  if (hasBody && (candidate === heading || (!heading && separateHeading))) {
    heading ||= candidate;
    body = lines
      .slice(first + 1)
      .join('\n')
      .trim();
  }
  return { title: heading, text: body };
}

export function readingInstructionParagraphs(text) {
  const value = String(text || '');
  // Legacy rich text already owns its block structure. The caller still sanitizes it.
  if (/<\/?[a-z][^>]*>/i.test(value)) return value;
  return value
    .replace(/\\n/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/^(Questions?\s+\d+(?:\s*[-–—]\s*\d+)?)[.:]? +/i, '$1\n\n')
    .replace(
      /([.?!])[^\S\n]+(?=(?:Reading Passage\b|Which\b|Choose\b|Write\b|Complete\b|In boxes\b|NB\b|\(?Example:))/g,
      '$1\n\n'
    )
    .replace(/([^\n])[^\S\n]+(?=(?:TRUE|FALSE|NOT GIVEN|YES|NO)\s+if\b)/g, '$1\n')
    .replace(/(^|\n)\s*NB\s+/g, '$1**NB** ');
}
