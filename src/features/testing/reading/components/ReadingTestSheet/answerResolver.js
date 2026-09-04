import { isAnswerCorrect } from '@/lib/ieltsAnswerValidation';

export function checkAnswer(userAns, correctAns) {
  if (!correctAns) return false;
  if (!userAns || String(userAns).trim() === '') return false;
  return isAnswerCorrect(userAns, correctAns);
}

export function formatAnswerValue(val) {
  if (!val) return null;
  let v = val;
  try {
    if (typeof val === 'string' && val.trim().startsWith('[')) {
      v = JSON.parse(val);
    }
  } catch (e) {
    // Keep original string if JSON parse fails
  }
  const vArr = Array.isArray(v) ? v : String(v).split(',');
  const letters = vArr.map((item) => {
    const str = String(item).trim();
    return str.match(/^[A-E](?:\.|\s|$)/i) ? str.substring(0, 1).toUpperCase() : str;
  });
  return letters.join(', ');
}

function resolveGapFillAnswer(q, subId) {
  if (!q.gap_fill?.answers || subId == null) return null;
  const num = parseInt(subId.toString().replace('gap_', '').replace('blank_', ''));
  return !isNaN(num) ? q.gap_fill.answers[num] : null;
}

function resolveCorrectAnswersArray(q, subId) {
  if (!q.correct_answers || subId == null) return null;
  const idxStr = subId.toString().replace('blank_', '').replace('gap_', '');
  const subIndex = parseInt(idxStr);
  return q.correct_answers[subIndex] ?? q.correct_answers[subId] ?? null;
}

function resolveMatchingFeaturesAnswer(q, subId) {
  if (q.type !== 'matching_features' || subId == null) return null;
  if (q.matching_features?.answers) {
    return q.matching_features.answers[subId] ?? null;
  }
  if (q.matching_features?.questions) {
    const subQ = q.matching_features.questions.find((sq) => sq.id === subId);
    return subQ ? subQ.answer : null;
  }
  return null;
}

export function resolveCorrectAnswer(q, subId, correctAnswer) {
  if (correctAnswer != null && correctAnswer !== '') return correctAnswer;

  const gapAns = resolveGapFillAnswer(q, subId);
  if (gapAns != null && gapAns !== '') return gapAns;

  const arrayAns = resolveCorrectAnswersArray(q, subId);
  if (arrayAns != null && arrayAns !== '') return arrayAns;

  const mfAns = resolveMatchingFeaturesAnswer(q, subId);
  if (mfAns != null && mfAns !== '') return mfAns;

  return q.correct_answer ?? null;
}

/**
 * Reduce an MCQ answer to its option letter.
 * Imported Cambridge questions store the full option text ("C. greater water-storage
 * capacity") while the test UI stores just the letter, so both sides have to be
 * reduced to the letter before they can be compared.
 */
export function toChoiceLetter(value) {
  const str = String(value ?? '').trim();
  const match = str.match(/^([A-Z])(?:[.)]|\s|$)/i);
  return match ? match[1].toUpperCase() : str;
}

export function parseChoiceList(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Legacy imports may use a comma-separated answer string.
    }
  }

  return trimmed.split(',').map((answer) => answer.trim());
}

/**
 * Grade a multi-select MCQ group the same way the score calculator does: letters
 * are compared as a set, so the order the candidate ticked the boxes in never
 * changes the outcome. Correct letters the candidate missed are handed to the
 * remaining boxes so each one shows a letter that is actually still missing.
 */
export function resolveMultiSelectReview(q, userAnswers) {
  const correctLetters = parseChoiceList(q.correct_answers ?? q.correct_answer)
    .map(toChoiceLetter)
    .filter(Boolean);
  const userLetters = userAnswers.map(toChoiceLetter);

  const unmatchedCorrect = [...correctLetters];
  const matches = userLetters.map((letter) => {
    if (!letter) return false;
    const index = unmatchedCorrect.indexOf(letter);
    if (index === -1) return false;
    unmatchedCorrect.splice(index, 1);
    return true;
  });

  let nextMissing = 0;
  const expected = matches.map((matched, index) =>
    matched
      ? userLetters[index]
      : (unmatchedCorrect[nextMissing++] ?? correctLetters[index] ?? null)
  );

  return { matches, expected, correctLetters };
}
