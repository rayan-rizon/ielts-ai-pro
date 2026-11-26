import { describe, expect, it } from 'vitest';
import { rankPracticeNeeds } from '../../../supabase/functions/_shared/skill-lab/libraryPractice.js';

const now = new Date('2026-09-20T12:00:00Z');
const day = (number) => `2026-09-${String(number).padStart(2, '0')}T12:00:00Z`;
const right = (id) => ({ questionId: id, userAnswer: 'A', isCorrect: true });
const wrong = (id) => ({ questionId: id, userAnswer: 'B', isCorrect: false });
const blank = (id, userAnswer = '') => ({ questionId: id, userAnswer, isCorrect: false });

const attempt = (session, completed, responses, extra = {}) => ({
  focus: 'reading:matching_information',
  sessionId: session,
  groupId: 'group',
  sourceId: 'passage',
  title: 'IELTS 11 Academic Test 2',
  completedAt: day(completed),
  correct: responses.filter((response) => response.isCorrect).length,
  total: responses.length,
  responses,
  ...extra,
});
const practice = (session, completed, responses, extra = {}) =>
  attempt(session, completed, responses, { practice: true, ...extra });
const needFrom = (...attempts) => rankPracticeNeeds(attempts, now)[0];

describe('blank answers', () => {
  it('are never counted as mistakes', () => {
    const need = needFrom(
      attempt('t', 1, [blank('1'), blank('2', '(not selected)'), blank('3', null), wrong('4')])
    );
    expect(need).toMatchObject({ correct: 0, total: 1 });
    expect(need.mistakes.map((mistake) => mistake.questionId)).toEqual(['4']);
  });
  it('leave no suggestion or history for a full test group nobody answered', () => {
    expect(rankPracticeNeeds([attempt('t', 1, [blank('1'), blank('2')])], now)).toEqual([]);
  });
  it('in a newer attempt do not erase an earlier real answer', () => {
    const need = needFrom(
      attempt('first', 1, [right('1')]),
      attempt('later', 2, [blank('1'), wrong('2')])
    );
    expect(need).toMatchObject({ correct: 1, total: 2 });
  });
});

describe('practice that counts', () => {
  it('includes a familiar passage whose questions were never answered', () => {
    const need = needFrom(
      attempt('t', 1, [blank('1'), blank('2')]),
      practice('p', 2, [right('1'), wrong('2')], { familiar: true })
    );
    expect(need).toMatchObject({ correct: 1, total: 2 });
  });
  it('includes a set that was opened before but never finished', () => {
    expect(needFrom(practice('p', 2, [right('1')], { repeated: true }))).toMatchObject({
      total: 1,
    });
  });
  it('skips only the questions already answered in an earlier test', () => {
    const need = needFrom(
      attempt('t', 1, [wrong('1'), blank('2')]),
      practice('p', 2, [right('1'), right('2')], { familiar: true })
    );
    // Question 1 keeps the first honest answer; question 2 is new evidence.
    expect(need).toMatchObject({ correct: 1, total: 2 });
    expect(need.mistakes.map((mistake) => mistake.sessionId)).toEqual(['t']);
  });
  it('skips a retake of a completed set, even if the first try was blank', () => {
    const need = needFrom(practice('first', 1, [blank('1')]), practice('again', 2, [right('1')]));
    expect(need).toMatchObject({ correct: 0, total: 0 });
  });
  it('is not affected by a full test taken afterwards', () => {
    const need = needFrom(practice('p', 1, [right('1')]), attempt('t', 2, [blank('1')]));
    expect(need).toMatchObject({ correct: 1, total: 1 });
  });
});

describe('due for review', () => {
  const old = () => practice('old', 1, [wrong('1')], { nextReviewAt: day(3) });
  it('is due when the latest practice has reached its review date', () => {
    expect(needFrom(old()).due).toBe(true);
  });
  it('clears after practising again, even though an older date has passed', () => {
    const fresh = practice('new', 19, [wrong('2')], { groupId: 'other', nextReviewAt: day(21) });
    expect(needFrom(old(), fresh).due).toBe(false);
  });
  it('is not cleared by handing in a blank set', () => {
    const empty = practice('new', 19, [blank('2')], { groupId: 'other', nextReviewAt: day(21) });
    expect(needFrom(old(), empty).due).toBe(true);
  });
});

describe('history', () => {
  it('shows one row per full test, without the groups nobody answered', () => {
    const need = needFrom(
      attempt('t', 1, [wrong('1'), blank('2')], { groupId: 'a' }),
      attempt('t', 1, [right('3')], { groupId: 'b' }),
      attempt('t', 1, [blank('4'), blank('5')], { groupId: 'c' })
    );
    expect(need.history).toHaveLength(1);
    expect(need.history[0]).toMatchObject({
      correct: 1,
      total: 3,
      answered: 2,
      status: 'counted',
    });
    expect(need.sources[0]).toMatchObject({ sessionId: 't', title: 'IELTS 11 Academic Test 2' });
  });
  it('says why a practice result is left out of the suggestion', () => {
    const need = needFrom(
      attempt('t', 1, [wrong('1')], { groupId: 'a' }),
      practice('repeat', 2, [right('1')]),
      practice('empty', 3, [blank('9')], { groupId: 'b' }),
      practice('helped', 4, [right('8')], { groupId: 'c', assisted: true })
    );
    const status = Object.fromEntries(
      need.sources.map((source, index) => [source.sessionId, need.history[index].status])
    );
    expect(status).toEqual({ t: 'counted', repeat: 'repeat', empty: 'blank', helped: 'assisted' });
  });
  it('counts only the latest five results', () => {
    const attempts = [1, 2, 3, 4, 5, 6].map((number) =>
      practice(`p${number}`, number, [wrong(`q${number}`)], { groupId: `g${number}` })
    );
    const need = rankPracticeNeeds(attempts, now)[0];
    expect(need.total).toBe(5);
    expect(need.history).toHaveLength(5);
    expect(need.history.every((entry) => entry.status === 'counted')).toBe(true);
  });
});
