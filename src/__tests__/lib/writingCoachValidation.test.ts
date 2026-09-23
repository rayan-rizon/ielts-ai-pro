import { describe, expect, it } from 'vitest';
import {
  plainText,
  resultValidationError,
  sentences,
  validResult,
} from '../../../supabase/functions/_shared/writingCoachValidation';

describe('Band 8 example validation', () => {
  const units = sentences('The figure rose to 20%. It then fell to 10%.\nThe change was large.');
  const base = {
    schemaVersion: 1,
    targetBand: 8,
    segments: [
      {
        sourceSentenceIds: [1],
        revisedText: 'The figure increased to 20%.',
        changeTags: ['Vocabulary'],
        shortReason: 'More precise verb.',
      },
      {
        sourceSentenceIds: [2],
        revisedText: 'It then declined to 10%.',
        changeTags: ['Vocabulary'],
        shortReason: 'Varies language.',
      },
      {
        sourceSentenceIds: [3],
        revisedText: 'This was a considerable change.',
        changeTags: ['Clarity'],
        shortReason: 'Clearer reference.',
      },
    ],
    languageNotes: [],
    limitations: [],
  };

  it('accepts a complete ordered comparison', () => {
    expect(validResult(base, units)).toBe(true);
    expect(units[2].paragraph).toBe(1);
  });

  it('rejects missing sentences, changed figures and merged paragraphs', () => {
    expect(validResult({ ...base, segments: base.segments.slice(0, 2) }, units)).toBe(false);
    expect(
      validResult(
        {
          ...base,
          segments: [
            { ...base.segments[0], revisedText: 'The figure increased to 30%.' },
            ...base.segments.slice(1),
          ],
        },
        units
      )
    ).toBe(false);
    expect(
      validResult(
        {
          ...base,
          segments: [
            {
              sourceSentenceIds: [1, 2, 3],
              revisedText: 'The figure rose to 20% then fell to 10%. This was a large change.',
              changeTags: [],
              shortReason: '',
            },
          ],
        },
        units
      )
    ).toBe(false);
  });

  it('explains incomplete provider output without including essay text', () => {
    expect(resultValidationError({ ...base, segments: base.segments.slice(0, 2) }, units)).toBe(
      'the response covered 2 of 3 sentences'
    );
    expect(
      resultValidationError(
        {
          ...base,
          segments: [
            { ...base.segments[0], revisedText: 'The figure increased to 30%.' },
            ...base.segments.slice(1),
          ],
        },
        units
      )
    ).toContain('changed a number');
  });

  it('accepts numeric sentence ids returned as strings', () => {
    const withStringIds = {
      ...base,
      segments: base.segments.map((segment) => ({
        ...segment,
        sourceSentenceIds: segment.sourceSentenceIds.map(String),
      })),
    };
    expect(resultValidationError(withStringIds, units)).toBeNull();
  });

  it('removes markup and script content before generation', () => {
    expect(plainText('<p>One.</p><script>ignore this</script><p>Two.</p>')).toBe('One.\n Two.');
  });
});
