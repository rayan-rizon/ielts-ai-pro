import { describe, expect, it } from 'vitest';
import { writingHeaderAction } from '@/features/testing/writing/writingHeaderAction';

const base = {
  locked: false,
  hasFeedback: false,
  openHere: false,
  reviewed: false,
  activeType: 'Task 2',
  hasTask2: true,
  testMode: 'practice',
};
const action = (over) => writingHeaderAction({ ...base, ...over });

describe('writingHeaderAction', () => {
  it('asks for feedback on the task that is still open, not for the next task', () => {
    expect(action({ openHere: true, reviewed: true, activeType: 'Task 1' })).toBe('feedback');
  });

  it('keeps the first-time path from Task 1 to Task 2', () => {
    expect(action({ activeType: 'Task 1' })).toBe('next');
    expect(action({})).toBe('feedback');
  });

  it('shows the report of a finished task', () => {
    expect(action({ locked: true, hasFeedback: true, reviewed: true })).toBe('view');
  });

  it('shows the report, not a dead button, on a reviewed exam task left empty', () => {
    expect(action({ locked: true, reviewed: true, testMode: 'exam' })).toBe('view');
  });

  it('offers analysis for a submitted exam not yet reviewed', () => {
    expect(action({ locked: true, testMode: 'exam' })).toBe('analyze');
  });

  it('submits a running exam from Task 2 and offers a redo after a failed review', () => {
    expect(action({ testMode: 'exam' })).toBe('submit');
    expect(action({ hasFeedback: true })).toBe('redo');
  });
});
