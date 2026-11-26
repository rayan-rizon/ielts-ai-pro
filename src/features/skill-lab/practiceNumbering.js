/** Lets the shared reading renderers print the numbers from the source test. */
export const withTestNumbers = (questions) =>
  (questions || []).map((question) => ({
    ...question,
    _practiceStartNumber: Number(question.question_number) || undefined,
  }));

export function numberRange(numbers) {
  if (numbers.length === 1) return `Question ${numbers[0]}`;
  const isRun = numbers.every((number, index) => !index || number === numbers[index - 1] + 1);
  return `Questions ${isRun ? `${numbers[0]}–${numbers.at(-1)}` : numbers.join(', ')}`;
}
