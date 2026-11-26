// Pure helpers that turn a scored Practice Lab set into rows for the review UI.
//
// The scorer numbers questions from 1 inside the set (a set holding Q25-30 is
// scored as 1-6), and stores multi-select answers under `<id>_option_<n>`. Rows
// are therefore matched by key and position, never by the scorer's own number,
// and always displayed with the question's real number from the test.

const NOT_ANSWERED = 'Not answered';

function sameText(a, b) {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

export function answerText(answer) {
  if (Array.isArray(answer)) {
    const values = answer.map((value) => String(value ?? '').trim()).filter(Boolean);
    return values.length ? values.join(' / ') : NOT_ANSWERED;
  }
  if (typeof answer === 'string') return answer.trim() || NOT_ANSWERED;
  return answer == null ? NOT_ANSWERED : String(answer);
}

function matchingOptionLabel(question, value) {
  const options = question.matching_features?.options;
  if (!Array.isArray(options)) return value;
  const index = /^[A-Z]$/i.test(value) ? value.toUpperCase().charCodeAt(0) - 65 : -1;
  const option = options[index];
  return typeof option === 'string'
    ? `${value} — ${option.replace(/^[A-Z]\s*[.)]\s*/i, '')}`
    : value;
}

// The scorer upper-cases multi-select answers; show the original option wording.
function choiceOptionLabel(question, value) {
  if (!Array.isArray(question.options)) return value;
  const letter = /^[A-Z]$/i.test(value) ? value.toUpperCase() : null;
  const option = question.options.find(
    (candidate) =>
      typeof candidate === 'string' &&
      (sameText(candidate, value) || (letter && candidate.trim().toUpperCase().startsWith(letter)))
  );
  return typeof option === 'string' ? option.trim() : value;
}

export function reviewAnswerText(question, answer) {
  const value = answerText(answer);
  if (value === NOT_ANSWERED || value === '(not selected)') return NOT_ANSWERED;
  if (question.type === 'matching_features') return matchingOptionLabel(question, value);
  if (question.type === 'multiple_choice') return choiceOptionLabel(question, value);
  return value;
}

function selectionCount(question) {
  if (question.type !== 'multiple_choice' || !question.allow_multiple) return 1;
  const count = Number.parseInt(question.question_count, 10);
  return Number.isNaN(count) || count < 2 ? 2 : count;
}

function nestedQuestionList(question) {
  const nested =
    question.questions ||
    question.matching_features?.questions ||
    question.matching_data?.questions;
  return Array.isArray(nested) && nested.length > 0 ? nested : null;
}

export function questionSpan(question) {
  if (question.practice_items?.length) {
    return new Set(question.practice_items.map((item) => item.number)).size;
  }
  const nested = nestedQuestionList(question);
  if (nested) return nested.length;
  const paragraphs = question.matching_data?.paragraphs;
  return Array.isArray(paragraphs) ? paragraphs.length || 1 : selectionCount(question);
}

/** "Questions 25–30" for the questions in a set, or null when numbers are missing. */
export function questionRangeLabel(questions) {
  const numbers = (questions || []).flatMap((question) => {
    if (question.practice_items?.length) {
      return question.practice_items.map((item) => Number(item.number)).filter(Number.isFinite);
    }
    const start = Number(question.question_number);
    return start > 0 ? [start, start + questionSpan(question) - 1] : [];
  });
  if (!numbers.length) return null;
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `Question ${first}` : `Questions ${first}–${last}`;
}

function nestedItems(question) {
  const nested = nestedQuestionList(question);
  if (!nested) return null;
  return nested.map((item, index) => ({
    id: `${question.id}_${item.id || index}`,
    number: item.question_number ?? question.question_number + index,
    prompt: item.question_text || item.text || item.label || 'Question to review',
  }));
}

function paragraphItems(question) {
  const paragraphs = question.matching_data?.paragraphs;
  if (!Array.isArray(paragraphs)) return null;
  return paragraphs.map((item, index) => ({
    id: `${question.id}_${item.label}`,
    number: item.question_number ?? question.question_number + index,
    prompt: `Paragraph ${item.label}`,
  }));
}

function optionItems(question) {
  if (!question.type?.startsWith('matching') || !Array.isArray(question.options)) return null;
  return question.options.map((item, index) => ({
    id: `${question.id}_${String.fromCharCode(65 + index)}`,
    number: question.question_number + index,
    prompt: String(item).replace(/^\d+\.\s*/, ''),
  }));
}

function selectionItems(question) {
  const prompt = question.question_text || question.text || 'Question to review';
  return Array.from({ length: selectionCount(question) }, (_, index) => ({
    id: index === 0 ? question.id : `${question.id}_option_${index}`,
    number: question.question_number + index,
    prompt,
  }));
}

export function reviewItems(question) {
  if (question.practice_items?.length) {
    return question.practice_items.map((item) => ({
      ...item,
      prompt: question.question_text || `Question ${item.number}`,
    }));
  }
  return (
    nestedItems(question) ||
    paragraphItems(question) ||
    optionItems(question) ||
    selectionItems(question)
  );
}

export function numberedExplanations(text) {
  const source = String(text || '').trim();
  return new Map(
    [
      ...source.matchAll(
        /(?:^|\n+)\s*Question\s+(\d+)\s*:\s*([\s\S]*?)(?=(?:\n+\s*Question\s+\d+\s*:)|$)/gi
      ),
    ].map((match) => [Number(match[1]), match[2].trim()])
  );
}

function entriesFor(question, result) {
  return Object.entries(result?.answers || {}).filter(
    ([id]) =>
      id === question.id ||
      id.startsWith(`${question.id}_`) ||
      question.practice_items?.some((item) => item.id === id)
  );
}

function findEntry(entries, item, index, itemCount) {
  return (
    entries.find(([id]) => id === item.id) ||
    (entries.length === itemCount ? entries[index] : null) ||
    entries.find(([, answer]) => Number(answer.questionNumber) === Number(item.number)) ||
    (entries.length === 1 ? entries[0] : null) ||
    null
  );
}

function savedUserAnswer(question, item, [answerId, answer], answers) {
  if (Object.prototype.hasOwnProperty.call(answer, 'userAnswer')) return answer.userAnswer;
  return answers?.[answerId] ?? answers?.[item.id] ?? answers?.[question.id];
}

function explanationFor(explanation, item, index, itemCount) {
  const text = String(explanation || '');
  const numbered = numberedExplanations(text).get(Number(item.number));
  if (numbered) return numbered;
  if (itemCount === 1) return text;
  // One shared explanation covers a multi-answer question: show it once, on the first row.
  return index === 0 && numberedExplanations(text).size === 0 ? text : '';
}

/**
 * Rows for the review list. Each row is one answer the learner gave:
 * { key, number, prompt, userText, correctText, isCorrect, answered, why }.
 */
export function buildReviewRows({ questions, result, answers, explanations = [] }) {
  return (questions || []).flatMap((question) => {
    const items = reviewItems(question);
    const entries = entriesFor(question, result);
    const explanation = explanations.find((entry) => entry.id === question.id)?.text || '';
    return items.flatMap((item, index) => {
      const found = findEntry(entries, item, index, items.length);
      if (!found) return [];
      const answer = found[1];
      const userAnswer = savedUserAnswer(question, item, found, answers);
      const userText = reviewAnswerText(question, userAnswer);
      return [
        {
          key: `${question.id}:${item.id}`,
          number: item.number,
          // A multi-answer question shares one prompt; print it once.
          prompt: index > 0 && item.prompt === items[index - 1].prompt ? null : item.prompt,
          userText,
          correctText: reviewAnswerText(question, answer.correctAnswer),
          correctAnswer: answer.correctAnswer,
          isCorrect: Boolean(answer.isCorrect),
          answered: userText !== NOT_ANSWERED,
          why: explanationFor(explanation, item, index, items.length),
        },
      ];
    });
  });
}
