import { describe, expect, it } from 'vitest';
import {
  guardTask1Transformation,
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

  it('retains data-bearing Task 1 sentences when a rewrite could change chart meaning', () => {
    const chartUnits = sentences('Category A has 10% dissatisfied users. Category B has 19%.');
    const candidate = {
      ...base,
      segments: [
        { ...base.segments[0], revisedText: 'Category A has 10% dissatisfied users.' },
        {
          ...base.segments[1],
          revisedText: 'Category B has 19%, which is lower than category A.',
        },
      ],
    };
    const safe = guardTask1Transformation(candidate, chartUnits);
    expect(safe.segments[1].revisedText).toBe('Category B has 19%.');
    expect(safe.segments[1].shortReason).toContain('visual was not rechecked');
  });

  it('repairs a multi-value chart rewrite before validating every segment', () => {
    const units = sentences(
      'The chart compares five income bands in 2007. In 2011, 30 million households earned between $25,000 and $49,999.'
    );
    const candidate = {
      ...base,
      segments: [
        { ...base.segments[0], revisedText: 'The chart compares five income bands in 2007.' },
        {
          ...base.segments[1],
          revisedText: 'In 2011, 30 million households earned between $25,000 and $50,000.',
        },
      ],
    };
    expect(resultValidationError(candidate, units)).toContain('changed a number');
    const safe = guardTask1Transformation(candidate, units);
    expect(safe.segments[1].revisedText).toBe(units[1].source);
    expect(resultValidationError(safe, units)).toBeNull();
  });

  it.each([
    ['line graph', 'The rate rose sharply.', 'The rate fell sharply.'],
    ['map', 'A road was replaced by a park.', 'A park was replaced by a road.'],
    ['process', 'The mixture was heated.', 'The mixture was cooled.'],
    ['new map detail', 'The area contains a path.', 'The path runs north.'],
    [
      'category comparison',
      'The first group outnumbers the second.',
      'The selected groups outnumber the second.',
    ],
  ])('retains %s facts when the visual was not rechecked', (_type, source, rewrite) => {
    const units = sentences(source);
    const candidate = {
      ...base,
      segments: [{ ...base.segments[0], revisedText: rewrite }],
    };
    expect(guardTask1Transformation(candidate, units).segments[0].revisedText).toBe(source);
  });

  it('removes markup and script content before generation', () => {
    expect(plainText('<p>One.</p><script>ignore this</script><p>Two.</p>')).toBe('One.\n Two.');
  });
});
