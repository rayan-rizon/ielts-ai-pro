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
