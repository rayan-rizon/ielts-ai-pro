export function markReadingSourceHighlights(source, highlights = []) {
  const ranges = highlights
    .map((highlight) => ({
      start: source.indexOf(highlight.text),
      end: source.indexOf(highlight.text) + highlight.text.length,
      numbers: highlight.question_numbers,
    }))
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start < previous.end) {
      previous.end = Math.max(previous.end, range.end);
      previous.numbers = [...new Set([...previous.numbers, ...range.numbers])];
    } else merged.push({ ...range });
  }
  let output = source;
  for (const range of merged.reverse())
    output =
      output.slice(0, range.start) +
      `[answer q=${range.numbers.join(',')}]` +
      source.slice(range.start, range.end) +
      '[/answer]' +
      output.slice(range.end);
  return output;
}
