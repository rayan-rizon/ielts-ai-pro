import { describe, expect, it } from 'vitest';
import { retryQuestions, retryRows } from './retryModel';

const choice = (id, number) => ({
  id,
  type: 'multiple_choice',
  question_number: number,
  question_text: `Prompt ${number}`,
  options: ['A. One', 'B. Two'],
});
const scored = (isCorrect) => ({ userAnswer: 'B', correctAnswer: 'A', isCorrect });
const mistake = (questions, answers) => ({ questions, result: { answers }, explanations: [] });
const old = mistake([choice('a', 1), choice('b', 2), choice('c', 3), choice('d', 4)], {
  a: scored(true),
  b: scored(false),
  c: scored(false),
  d: scored(false),
});
const ids = (questions) => questions.map((question) => question.id);

describe('retryQuestions', () => {
  it('takes the first two missed questions', () => {
    expect(ids(retryQuestions(old, [choice('new', 1)]))).toEqual(['b', 'c']);
  });
  it('skips the retry when any old question is about to be practised', () => {
    expect(retryQuestions(old, [choice('a', 1)])).toEqual([]);
  });
  it('has nothing to retry without a mistake or a wrong answer', () => {
    expect(retryQuestions(null, [])).toEqual([]);
    expect(retryQuestions(mistake([choice('a', 1)], { a: scored(true) }), [])).toEqual([]);
  });
  it('shows a block with several answers on its own', () => {
    const block = {
      id: 'm',
      type: 'matching_features',
      question_number: 5,
      questions: [{ id: 'one' }, { id: 'two' }],
    };
    const both = mistake([block, choice('b', 7)], {
      m_one: scored(false),
      m_two: scored(true),
      b: scored(false),
    });
    expect(ids(retryQuestions(both, []))).toEqual(['m']);
  });
});

describe('retryRows', () => {
  const [question] = old.questions.slice(1);
  it('compares the new answer with the key and keeps the earlier one', () => {
    const [row] = retryRows(old, [question], { b: 'A. One' });
    expect(row).toMatchObject({ number: 2, nowText: 'A. One', nowCorrect: true });
    expect(row.lastText).toBe('B. Two');
  });
  it('leaves an unanswered row blank', () => {
    expect(retryRows(old, [question], {})[0]).toMatchObject({ nowText: '', nowCorrect: false });
  });
  it('reads multi-select picks stored under the question id', () => {
    const multi = { ...choice('x', 8), allow_multiple: true, question_count: 2 };
    const previous = mistake([multi], {
      x_option_0: scored(false),
      x_option_1: { userAnswer: 'B', correctAnswer: 'B', isCorrect: true },
    });
    const [row] = retryRows(previous, [multi], { x: 'A, B' });
    expect(row.nowCorrect).toBe(true);
  });
});

describe('retry after a blank answer', () => {
  const question = {
    id: 'q',
    type: 'multiple_choice',
    question_number: 4,
    question_text: 'Prompt',
    options: ['A. One', 'B. Two'],
  };
  const earlier = (userAnswer) => ({
    questions: [question],
    result: { answers: { q: { userAnswer, correctAnswer: 'A', isCorrect: false } } },
  });

  it('is not offered, because the learner never tried the question', () => {
    expect(retryQuestions(earlier(''), [])).toEqual([]);
    expect(retryQuestions(earlier('(not selected)'), [])).toEqual([]);
    expect(retryRows(earlier(''), [question], {})).toEqual([]);
  });
  it('is still offered for a wrong answer', () => {
    expect(retryQuestions(earlier('B'), [])).toHaveLength(1);
  });
});
