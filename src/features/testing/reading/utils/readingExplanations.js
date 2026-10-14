import { isAnswerCorrect } from '../../../../lib/ieltsAnswerValidation.js';

// A question row can own several scored numbers; each explanation still belongs
// to exactly one of those numbers. Keep that boundary when importing content.
export function readingAnswer(question, number = question.question_number) {
  const n = String(number);
  const gapAnswer = question.gap_fill?.answers?.[n];
  if (gapAnswer) return String(gapAnswer);
  const table = question.table_data;
  const blank = (table?.blank_positions || table?.blanks || []).find(
    (b) => String(b.blankNumber ?? b.questionNumber) === n
  );
  if (blank?.answer) return String(blank.answer);
  const matching = question.matching_features;
  const match =
    matching?.answers?.[n] ||
    matching?.questions?.find((item) => String(item.questionNumber) === n)?.answer ||
    matching?.questions?.[Number(number) - Number(question.question_number)]?.answer;
  if (match) return String(match);
  if (question.flowchart?.answers) {
    const index = Number(number) - Number(question.question_number);
    return String(question.flowchart.answers[index] || '');
  }
  return String(question.correct_answer || '');
}

export function answerChoices(answer) {
  if (Array.isArray(answer)) return answer.flatMap(answerChoices);
  const text = String(answer || '').trim();
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return answerChoices(parsed);
    } catch {
      /* Old answer strings can contain ordinary square brackets. */
    }
  }
  if (/^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i.test(text)) return [text.toUpperCase()];
  // Do not interpret the first letter of a normal word as an MCQ answer.
  return text.split(/\s*[/,&]\s*/).flatMap((part) => {
    const match = part.match(/^([A-J]|[ivx]+)(?:[.)\s]|$)/i);
    return match ? [match[1].toUpperCase()] : [];
  });
}

export function wrongOptions(explanation) {
  const correct = answerChoices(explanation?.correct_answer);
  return Object.fromEntries(
    Object.entries(explanation?.why_wrong || {}).filter(
      ([key]) => !correct.includes(key.trim().toUpperCase())
    )
  );
}

// A tempting answer must never be an accepted choice, including multi-select.
export function temptingAnswer(explanation) {
  const candidate = explanation?.tempting_answer;
  if (typeof candidate !== 'string' || !candidate.trim() || candidate.length > 80) return null;
  const normalized = candidate.trim().toUpperCase();
  const correct = answerChoices(explanation.correct_answer);
  if (correct.includes(normalized) || isAnswerCorrect(candidate, explanation.correct_answer || ''))
    return null;
  return candidate.trim();
}

export function flattenExplanationImport(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected an object keyed by question number.');
  }
  const entries = {};
  const add = (number, explanation) => {
    const key = String(number).replace(/^(gap_|blank_)/, '');
    if (
      !/^\d+$/.test(key) ||
      !explanation ||
      typeof explanation !== 'object' ||
      Array.isArray(explanation)
    ) {
      throw new Error(`Invalid explanation for question ${number}.`);
    }
    if (entries[key] && JSON.stringify(entries[key]) !== JSON.stringify(explanation)) {
      throw new Error(
        `Question ${key} has conflicting explanations. Keep one entry for each question.`
      );
    }
    entries[key] = explanation;
  };
  for (const [key, value] of Object.entries(parsed)) {
    if (value?.blanks) {
      if (typeof value.blanks !== 'object' || Array.isArray(value.blanks)) {
        throw new Error(`Invalid blanks object for question ${key}.`);
      }
      for (const [number, explanation] of Object.entries(value.blanks)) add(number, explanation);
    } else add(key, value);
  }
  return entries;
}

export function plainReadingPassage(text) {
  return String(text || '')
    .replace(/\[\/?(?:answer\b[^\]]*|center|image)\]/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateReadingExplanation(explanation, question, number, passage) {
  const prefix = `Q${number}: `;
  if (
    explanation.trap != null &&
    (typeof explanation.trap !== 'string' ||
      !explanation.trap.trim() ||
      explanation.trap.trim().length > 180)
  ) {
    throw new Error(prefix + 'Keep the trap to a short, clear note (180 characters maximum).');
  }
  if (
    /simulated passage|passage(?: text)?(?: (?:was|is))? (?:not provided|missing)|hypothetical passage/i.test(
      JSON.stringify(explanation)
    )
  ) {
    throw new Error(prefix + 'Use the actual passage; simulated evidence cannot be imported.');
  }
  if (
    typeof explanation.why_correct !== 'string' ||
    !explanation.why_correct.trim() ||
    /^N\/A\b/i.test(explanation.why_correct.trim())
  ) {
    throw new Error(
      prefix + 'Explain why the answer is supported; an answer label alone is not enough.'
    );
  }
  const evidence = plainReadingPassage(explanation.passage_highlight);
  if (!evidence || !plainReadingPassage(passage).includes(evidence)) {
    throw new Error(
      prefix + 'Passage evidence must be an exact excerpt from this question’s passage.'
    );
  }
  const answer = readingAnswer(question, number);
  if (!answer) throw new Error(prefix + 'Save a correct answer before importing its explanation.');
  if (explanation.tempting_answer != null) {
    const candidate = temptingAnswer({ ...explanation, correct_answer: answer });
    const options = question.matching_features?.options || question.options || [];
    const allowed =
      question.type === 'true_false_not_given'
        ? ['TRUE', 'FALSE', 'NOT GIVEN']
        : question.type === 'yes_no_not_given'
          ? ['YES', 'NO', 'NOT GIVEN']
          : ['multiple_choice', 'matching_features'].includes(question.type)
            ? options.map((_, index) =>
                question.matching_features?.style === 'ROMAN'
                  ? [
                      'I',
                      'II',
                      'III',
                      'IV',
                      'V',
                      'VI',
                      'VII',
                      'VIII',
                      'IX',
                      'X',
                      'XI',
                      'XII',
                      'XIII',
                      'XIV',
                      'XV',
                    ][index]
                  : String.fromCharCode(65 + index)
              )
            : [];
    const sourceTokens = plainReadingPassage(passage)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const candidateTokens = candidate
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const sourceWord = candidateTokens && ` ${sourceTokens} `.includes(` ${candidateTokens} `);
    const available = allowed.length ? allowed.includes(candidate?.toUpperCase()) : sourceWord;
    if (!candidate || !explanation.trap || !available) {
      throw new Error(
        prefix + 'Tempting answer must be an available wrong choice with a short trap note.'
      );
    }
  }
  if (
    explanation.synonym_map != null &&
    (!Array.isArray(explanation.synonym_map) ||
      explanation.synonym_map.some(
        (item) =>
          !item ||
          typeof item.question_keyword !== 'string' ||
          typeof item.passage_keyword !== 'string' ||
          (item.connection != null && typeof item.connection !== 'string')
      ))
  ) {
    throw new Error(prefix + 'Keyword mappings must be a list of question and passage phrases.');
  }
  if (
    explanation.why_wrong != null &&
    (typeof explanation.why_wrong !== 'object' ||
      Array.isArray(explanation.why_wrong) ||
      Object.values(explanation.why_wrong).some((reason) => typeof reason !== 'string'))
  ) {
    throw new Error(prefix + 'Wrong-option notes must map each option to a text explanation.');
  }
  const correct = answerChoices(answer);
  if (
    Object.keys(explanation.why_wrong || {}).some((key) =>
      correct.includes(key.trim().toUpperCase())
    )
  ) {
    throw new Error(
      prefix + 'A correct answer appears in why_wrong. Remove it from the wrong options.'
    );
  }
  return { ...explanation, correct_answer: answer };
}
