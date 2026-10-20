import { describe, expect, it } from 'vitest';
import {
  acceptedAnswers,
  checkTypedAnswer,
  isSuccess,
  shouldPrefill,
  stripMarkdown,
} from '@/features/grammar/components/guide/practiceCheck';

describe('practice answer checking', () => {
  it('reads workbook markdown, alternatives and trailing notes into accepted answers', () => {
    expect(acceptedAnswers('_Answer one._ / _Answer two._ (Make clear who it is.)')).toEqual([
      'answer one',
      'answer two',
    ]);
    expect(stripMarkdown('**[blank]** \\_\\_\\_ _a_')).toBe('[blank] ___ a');
  });

  it('ignores case, spacing, trailing punctuation and curly apostrophes', () => {
    const answer = '_The government’s decision affected many companies._';
    expect(checkTypedAnswer("the  government's decision affected many companies", answer)).toBe(
      'match'
    );
    expect(checkTypedAnswer('The government’s decision affected many companies!', answer)).toBe(
      'match'
    );
  });

  it('still requires the punctuation that is inside the sentence', () => {
    const answer = '_Although the policy was unpopular, it reduced waste._';
    expect(checkTypedAnswer('Although the policy was unpopular it reduced waste.', answer)).toBe(
      'different'
    );
  });

  it('accepts any listed alternative and never calls a different answer wrong', () => {
    const answer =
      '_Car ownership was twice as high as in 2000._ / _Car ownership was double the level in 2000._';
    expect(checkTypedAnswer('Car ownership was double the level in 2000', answer)).toBe('match');
    expect(checkTypedAnswer('Car ownership was twice higher than in 2000', answer)).toBe(
      'different'
    );
    expect(checkTypedAnswer('   ', answer)).toBe('empty');
  });

  it('forgives spacing and commas in short multi-part answers', () => {
    expect(checkTypedAnswer('— a', '—, a')).toBe('match');
    expect(checkTypedAnswer('The,the', 'The, the')).toBe('match');
    expect(checkTypedAnswer('will  use', 'will use')).toBe('match');
    expect(checkTypedAnswer('an, the', '—, a')).toBe('different');
  });

  it('prefills only correction exercises that have no blank and no options', () => {
    const sentence = { question: 'The report provides several useful advices.' };
    expect(shouldPrefill(sentence, 'Correct each error.')).toBe(true);
    expect(shouldPrefill(sentence, 'Combine each pair with the word given.')).toBe(false);
    expect(shouldPrefill({ question: 'Fill the **[blank]**' }, 'Correct each error.')).toBe(false);
    expect(shouldPrefill({ ...sentence, options: ['a', 'b'] }, 'Correct each error.')).toBe(false);
  });

  it('counts matched and self-marked answers as correct, nothing else', () => {
    expect(isSuccess({ status: 'correct' })).toBe(true);
    expect(isSuccess({ status: 'got' })).toBe(true);
    ['incorrect', 'compare', 'review', 'revealed', undefined].forEach((status) =>
      expect(isSuccess({ status })).toBe(false)
    );
    expect(isSuccess(undefined)).toBe(false);
  });
});
