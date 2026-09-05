/** Keep decimal bands and common abbreviations inside their original sentence. */
export function splitFeedbackSentences(text: string): string[] {
  const protectedDots: string[] = [];
  const protectedText = text.replace(
    /\b(?:e\.g\.|i\.e\.|Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|vs\.)|\d+\.\d+/gi,
    (match) => {
      protectedDots.push(match);
      return `\uE000${protectedDots.length - 1}\uE001`;
    }
  );
  return (protectedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [protectedText])
    .map((sentence) =>
      sentence.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedDots[Number(index)]).trim()
    )
    .filter(Boolean);
}
