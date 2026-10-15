// Exact words with harmless OCR typography normalized; never fuzzy matching.
function indexedText(source) {
  let value = '',
    offset = 0;
  const starts = [],
    ends = [];
  for (const character of source) {
    const normalized = character
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐‑‒–—]/g, '-');
    for (const part of normalized) {
      if (/\s/.test(part)) {
        if (value.endsWith(' ')) {
          ends[ends.length - 1] = offset + character.length;
          continue;
        }
        value += ' ';
      } else value += part;
      starts.push(offset);
      ends.push(offset + character.length);
    }
    offset += character.length;
  }
  return { value, starts, ends };
}
export function exactSourceExcerpt(source, quote) {
  if (typeof source !== 'string' || typeof quote !== 'string' || !quote.trim()) return null;
  const indexed = indexedText(source);
  const needle = indexedText(quote).value.trim();
  const start = indexed.value.indexOf(needle);
  return start < 0
    ? null
    : source.slice(indexed.starts[start], indexed.ends[start + needle.length - 1]);
}
