import { describe, expect, it } from 'vitest';
import { calculateGlobalQuestionNumber } from '@/features/testing/reading/components/ReadingTest/utils/helpers';
import { numberRange, withTestNumbers } from './practiceNumbering';

describe('practice numbering', () => {
  it('shows the number from the source test, not the position in the set', () => {
    const [question] = withTestNumbers([{ id: 'm', question_number: 33 }]);
    expect(calculateGlobalQuestionNumber([question], 'm')).toBe(33);
  });
  it('leaves full-test numbering alone', () => {
    expect(calculateGlobalQuestionNumber([{ id: 'm', question_number: 33 }], 'm')).toBe(1);
  });
  it('writes a run as a range and gaps as a list', () => {
    expect(numberRange([33, 34, 35])).toBe('Questions 33–35');
    expect(numberRange([34, 36])).toBe('Questions 34, 36');
    expect(numberRange([7])).toBe('Question 7');
  });
});
