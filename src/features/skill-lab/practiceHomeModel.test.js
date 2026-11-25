import { describe, expect, it } from 'vitest';
import {
  answeredCount,
  questionSlots,
  sessionSummary,
  startedAgo,
  typeStatus,
} from './practiceHomeModel';

const marks = (slots) => slots.map((slot) => [slot.number, slot.answered]);
const multi = {
  id: 'm',
  type: 'multiple_choice',
  allow_multiple: true,
  question_count: 2,
  question_number: 11,
};

describe('typeStatus', () => {
  it('groups a type by its recent correct ratio', () => {
    expect(typeStatus(undefined)).toBe('untried');
    expect(typeStatus({ correct: 0, total: 16 })).toBe('needs_work');
    expect(typeStatus({ correct: 1, total: 2 })).toBe('getting_there');
    expect(typeStatus({ correct: 4, total: 5 })).toBe('strong');
  });
});

describe('answeredCount', () => {
  it('counts each chosen item and ignores blanks', () => {
    expect(answeredCount({ a: 'A', b: '  ', c: [], d: ['B', 'C'], e: null })).toBe(3);
    expect(answeredCount({ multi: 'A, C' })).toBe(2);
    expect(answeredCount({ text: 'books, pens' })).toBe(1);
  });
  it('never exceeds the set size', () => {
    expect(answeredCount({ d: ['A', 'B', 'C'] }, 2)).toBe(2);
  });
});

describe('startedAgo', () => {
  const now = new Date(2026, 10, 25, 12).getTime();
  it('uses calendar days', () => {
    expect(startedAgo(new Date(2026, 10, 25, 1), now)).toBe('Started today');
    expect(startedAgo(new Date(2026, 10, 24, 23), now)).toBe('Started yesterday');
    expect(startedAgo(new Date(2026, 10, 21, 12), now)).toBe('Started 4 days ago');
    expect(startedAgo('nonsense', now)).toBe('');
  });
});

describe('sessionSummary', () => {
  it('drops the total when the set no longer exists', () => {
    expect(sessionSummary({ focus: 'reading:x', answers: { a: 'A' } }, undefined, 0)).toBe(
      'Reading · 1 answered'
    );
  });
  it('shows title and progress', () => {
    const group = { title: 'IELTS 17, Test 3', total: 4 };
    expect(sessionSummary({ focus: 'listening:x', answers: { a: 'A', b: 'B' } }, group, 0)).toBe(
      'Listening · IELTS 17, Test 3 · 2 of 4 answered'
    );
    expect(sessionSummary({ focus: 'listening:x' }, group, 0)).toContain('Not started');
  });
});

describe('questionSlots', () => {
  it('fills multi-select slots from every stored answer shape', () => {
    for (const answers of [{ m: ['A'] }, { m: 'A' }, { m_option_1: 'B' }]) {
      expect(marks(questionSlots([multi], answers))).toEqual([
        [11, true],
        [12, false],
      ]);
    }
    expect(marks(questionSlots([multi], { m: 'A, C' }))).toEqual([
      [11, true],
      [12, true],
    ]);
  });
  const nested = (extra) => ({ type: 'matching_features', question_number: 21, ...extra });
  const pair = [{ id: 'one' }, { id: 'two' }];

  it.each([
    ['nested items', nested({ id: 'n', questions: pair }), { n_one: 'A' }],
    [
      'listening sub-question ids',
      nested({ id: 'q1', matching_features: { questions: pair } }),
      { one: 'A' },
    ],
  ])('tracks %s separately', (_, question, answers) => {
    expect(marks(questionSlots([question], answers))).toEqual([
      [21, true],
      [22, false],
    ]);
  });
  it('gives paragraph-mode matching one slot per placeholder', () => {
    const summary = {
      id: 'q2',
      type: 'matching_features',
      question_number: 20,
      matching_features: { mode: 'paragraph', text: 'First [20] then [21].' },
    };
    expect(marks(questionSlots([summary], { q2_21: 'B' }))).toEqual([
      [20, false],
      [21, true],
    ]);
  });
});
