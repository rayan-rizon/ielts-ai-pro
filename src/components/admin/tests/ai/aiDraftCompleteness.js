const hasText = (value) => typeof value === 'string' && !!value.trim();
const questions = (numbers) =>
  [...new Set(numbers)]
    .sort((a, b) => a - b)
    .map((n) => `Q${n}`)
    .join(', ');

// Advisory highlight checks complement the strict schema/evidence validator.
// NOT GIVEN describes absent information, not a highlighted answer phrase.
export function aiDraftCompleteness(draft, expectedQuestions) {
  const warnings = [];
  const sections = Array.isArray(draft?.sections) ? draft.sections : [];
  const missingPassages = sections.flatMap((section, index) =>
    hasText(section.content) ? [] : [index + 1]
  );
  if (!sections.length || missingPassages.length)
    warnings.push({
      code: 'passages',
      blocking: true,
      message: sections.length
        ? `Missing passage or audioscript text: ${missingPassages.join(', ')}.`
        : 'Passage or audioscript text is missing.',
    });
  const items = sections.flatMap((section) =>
    (section.groups || []).flatMap((group) => group.items || [])
  );
  const missingQuestions = [];
  for (let number = 1; number <= Number(expectedQuestions); number++) {
    const matches = items.filter((item) => item.number === number);
    if (matches.length !== 1 || !hasText(matches[0]?.text)) missingQuestions.push(number);
  }
  if (missingQuestions.length)
    warnings.push({
      code: 'questions',
      blocking: true,
      message: `Missing or repeated questions: ${questions(missingQuestions)}.`,
    });
  const missingAnswers = items.filter((item) => !hasText(item.answer)).map((item) => item.number);
  if (missingAnswers.length)
    warnings.push({
      code: 'answers',
      blocking: true,
      message: `Missing answers: ${questions(missingAnswers)}.`,
    });
  const missingExplanations = items
    .filter(
      (item) =>
        !hasText(item.explanation?.why_correct) || !hasText(item.explanation?.passage_highlight)
    )
    .map((item) => item.number);
  if (missingExplanations.length)
    warnings.push({
      code: 'explanations',
      blocking: true,
      message: `Missing explanations or passage evidence: ${questions(missingExplanations)}.`,
    });
  const missingHighlights = sections.flatMap((section) => {
    const covered = new Set(
      (section.highlights || [])
        .filter((highlight) => hasText(highlight.text) && section.content?.includes(highlight.text))
        .flatMap((highlight) => highlight.question_numbers || [])
    );
    return (section.groups || []).flatMap((group) =>
      (group.items || [])
        .filter(
          (item) =>
            hasText(item.answer) &&
            item.answer.trim().toUpperCase() !== 'NOT GIVEN' &&
            !covered.has(item.number)
        )
        .map((item) => item.number)
    );
  });
  if (missingHighlights.length)
    warnings.push({
      code: 'highlights',
      blocking: false,
      message: `Answer highlights missing: ${questions(missingHighlights)}. Check the passage evidence or regenerate. NOT GIVEN questions do not need an answer highlight.`,
    });
  return warnings;
}
