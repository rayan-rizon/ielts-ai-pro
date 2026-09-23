export function plainText(html: string): string {
  return html
    .replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, value) => {
      const code = Number(value);
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : ' ';
    })
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function sentences(text: string) {
  let id = 0;
  return text.split(/\n+/).flatMap((part, paragraph) =>
    (part.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [])
      .map((source) => source.trim())
      .filter(Boolean)
      .map((source) => ({ id: ++id, paragraph, source }))
  );
}

function numericTokens(text: string) {
  return (text.match(/\b\d+(?:[.,]\d+)?%?\b/g) || []).sort().join('|');
}

export function resultValidationError(value: any, units: ReturnType<typeof sentences>) {
  if (value?.schemaVersion !== 1) return 'schema version is missing or unsupported';
  if (Number(value?.targetBand) !== 8) return 'target band is missing or invalid';
  if (!Array.isArray(value.segments)) return 'sentence segments are missing';
  let next = 1;
  for (const [index, row] of value.segments.entries()) {
    const ids = Array.isArray(row?.sourceSentenceIds)
      ? row.sourceSentenceIds.map((id: unknown) => Number(id))
      : [];
    if (
      ids.length !== 1 ||
      ids.some((id: number) => !Number.isSafeInteger(id)) ||
      typeof row.revisedText !== 'string' ||
      !row.revisedText.trim() ||
      row.revisedText.length > 650 ||
      typeof row.shortReason !== 'string' ||
      row.shortReason.length > 170 ||
      !Array.isArray(row.changeTags) ||
      row.changeTags.length > 3 ||
      row.changeTags.some(
        (tag: unknown) => !['Clarity', 'Vocabulary', 'Grammar', 'Cohesion'].includes(String(tag))
      )
    )
      return `segment ${index + 1} must contain one valid source sentence and complete fields`;
    for (const id of ids) {
      if (id !== next) return `sentence ${next} is missing, duplicated, or out of order`;
      next += 1;
    }
    const paragraphs = new Set(ids.map((id: number) => units[id - 1]?.paragraph));
    if (paragraphs.size !== 1 || paragraphs.has(undefined))
      return `segment ${index + 1} does not map to one paragraph`;
    const originals = ids.map((id: number) => units[id - 1]?.source || '').join(' ');
    if (numericTokens(originals) !== numericTokens(row.revisedText))
      return `segment ${index + 1} changed a number from the original answer`;
  }
  if (next !== units.length + 1)
    return `the response covered ${next - 1} of ${units.length} sentences`;
  if (
    !Array.isArray(value.languageNotes) ||
    value.languageNotes.length > 3 ||
    !value.languageNotes.every((note: any) => typeof note === 'string' && note.length <= 180)
  )
    return 'language notes are missing or too long';
  if (
    !Array.isArray(value.limitations) ||
    value.limitations.length > 3 ||
    !value.limitations.every((note: any) => typeof note === 'string' && note.length <= 180)
  )
    return 'limitations are missing or too long';
  return null;
}

export function validResult(value: any, units: ReturnType<typeof sentences>) {
  return resultValidationError(value, units) === null;
}
