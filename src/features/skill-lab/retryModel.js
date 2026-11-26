// "Retry your mistake": which earlier questions to ask again, and how the new try compares.
import { isAnswerCorrect } from '@/lib/ieltsAnswerValidation';
import { buildReviewRows, reviewAnswerText, reviewItems } from './practiceReview';

const RETRY_LIMIT = 2;

const rowsFor = (mistake, questions, answers) =>
  buildReviewRows({
    questions,
    result: mistake.result,
    answers,
    explanations: mistake.explanations,
  });

const missedRows = (mistake, question) =>
  // A blank is not a mistake: the learner never tried that question.
  rowsFor(mistake, [question], mistake.answers).filter((row) => row.answered && !row.isCorrect);

/** Up to two missed questions. A block with several answers is shown on its own. */
export function retryQuestions(mistake, upcoming) {
  if (!mistake?.questions) return [];
  const next = new Set((upcoming || []).map((question) => question.id));
  // Showing an answer to a question that is about to be tested defeats the test.
  if (mistake.questions.some((question) => next.has(question.id))) return [];
  const missed = mistake.questions.filter((question) => missedRows(mistake, question).length);
  const first = missed[0];
  if (!first) return [];
  const isBlock = (question) => reviewItems(question).length > 1;
  if (isBlock(first)) return [first];
  return missed.filter((question) => !isBlock(question)).slice(0, RETRY_LIMIT);
}

const filled = (value) => String(value ?? '').trim() !== '';

const isSelection = (items) => items.some((item) => String(item.id).includes('_option_'));

/** Every key an answer input may have written this row under. */
function candidateKeys(question, itemId) {
  const items = reviewItems(question);
  if (isSelection(items) || items.length === 1) {
    return [question.id, ...items.map((item) => item.id)];
  }
  const nested = question.matching_features?.questions || [];
  return [itemId, nested.find((sub) => `${question.id}_${sub.id}` === itemId)?.id];
}

function pickedValues(question, itemId, answers) {
  const value = candidateKeys(question, itemId)
    .map((key) => answers[key])
    .find((entry) => filled(entry));
  if (value === undefined) return [];
  const isLetterList = typeof value === 'string' && isSelection(reviewItems(question));
  return [isLetterList ? value.split(',') : value].flat().filter(filled);
}

const letterOf = (value) => /^\s*([A-Z])(?:[.)]|\s*$)/i.exec(String(value))?.[1]?.toUpperCase();

function matches(question, value, row) {
  if (isAnswerCorrect(String(value), String(row.correctAnswer ?? ''))) return true;
  const letter = letterOf(value);
  if (letter && letter === letterOf(row.correctAnswer)) return true;
  return reviewAnswerText(question, value) === row.correctText;
}

/** The rows missed last time, each with the new try beside the earlier answer. */
export function retryRows(mistake, questions, answers) {
  return questions.flatMap((question) =>
    missedRows(mistake, question).map((row) => {
      const itemId = row.key.slice(`${question.id}:`.length);
      const values = pickedValues(question, itemId, answers);
      return {
        ...row,
        lastText: row.userText,
        nowText: values
          .map((value) => reviewAnswerText(question, String(value).trim()))
          .join(' / '),
        nowCorrect: values.some((value) => matches(question, String(value).trim(), row)),
      };
    })
  );
}
