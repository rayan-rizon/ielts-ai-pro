import { describe, expect, it } from 'vitest';
import { splitFeedbackSentences } from '../../../supabase/functions/_shared/feedbackSentences';
import { compactText } from '@/features/testing/speaking/utils/speakingReportHelpers';

describe('feedback sentence boundaries', () => {
  it('preserves examples and decimal durations', () => {
    const text = 'Use correct plurals, e.g. books are useful. Speak for 1.5 minutes.';
    expect(splitFeedbackSentences(text)).toEqual([
      'Use correct plurals, e.g. books are useful.',
      'Speak for 1.5 minutes.',
    ]);
    expect(compactText(text, { maxSentences: 1 })).toBe(
      'Use correct plurals, e.g. books are useful.'
    );
    expect(
      compactText('Aim for Band 6.5, i.e. clearer development. Next point.', { maxSentences: 1 })
    ).toBe('Aim for Band 6.5, i.e. clearer development.');
  });
});
