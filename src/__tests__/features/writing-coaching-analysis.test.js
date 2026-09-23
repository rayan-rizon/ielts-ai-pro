import { describe, expect, it } from 'vitest';
import {
  analyzeWriting,
  clarifyVocabularySuggestion,
  plainWritingText,
} from '@/features/testing/writing/utils/writingCoaching';

describe('Writing coaching text and pattern analysis', () => {
  it('keeps paragraph breaks while removing editor markup', () => {
    expect(plainWritingText('<p>First idea.</p><p>Second idea.</p>')).toContain('\n');
    expect(plainWritingText('<p>First idea.</p><p>Second idea.</p>')).not.toContain('<p>');
  });

  it('reports repetition without treating question terms as errors', () => {
    const result = analyzeWriting(
      'Transport is useful. Transport can change cities. Transport needs planning.',
      'Discuss transport.'
    );
    expect(result.repeated).toContainEqual(
      expect.objectContaining({ word: 'transport', count: 3, inPrompt: true })
    );
    expect(result.repeated.some((item) => item.word === 'is')).toBe(false);
  });

  it('classifies a result linker as a result, not reference', () => {
    const result = analyzeWriting('The cost rose. Consequently, demand fell.');
    expect(result.linking).toContainEqual(
      expect.objectContaining({ category: 'Result', count: 1 })
    );
  });

  it('shows complete sentence context and the preceding idea for connectors', () => {
    const result = analyzeWriting(
      'Rural jobs support families. By contrast, rural towns lose workers.\n\nIn conclusion, planning matters. Specifically, it should protect services.'
    );
    const contrast = result.linking.find((item) => item.category === 'Contrast');
    const summary = result.linking.find((item) => item.category === 'Overview');
    const clarification = result.linking.find((item) => item.category === 'Clarification');

    expect(contrast.matches[0]).toEqual({
      phrase: 'by contrast',
      sentence: 'By contrast, rural towns lose workers.',
      previousSentence: 'Rural jobs support families.',
    });
    expect(summary.count).toBe(1);
    expect(clarification.count).toBe(1);
    expect(result.linking.some((item) => item.category === 'Sequence')).toBe(false);
  });

  it('keeps hyphenated task terms together and reports paragraph openings', () => {
    const result = analyzeWriting(
      'Full-time students attend. Full-time students read. Full-time students learn.\n\nHowever, part-time students also attend.'
    );
    expect(result.repeated.some((item) => item.word === 'time')).toBe(false);
    expect(result.paragraphCount).toBe(2);
    expect(result.paragraphOpenings[1]).toMatch(/^However/);
  });

  it('corrects two legacy vocabulary suggestions whose wording changes the nuance', () => {
    expect(
      clarifyVocabularySuggestion({
        original: 'forced upward',
        alternatives: ['is lifted over the mountain'],
        context: 'A concise process description.',
      })
    ).toMatchObject({
      alternatives: ['driven upwards'],
      context: 'The mountain still forces the air upward.',
    });

    expect(
      clarifyVocabularySuggestion({
        original: 'little to no rainfall',
        alternatives: ['minimal precipitation'],
        context: 'A precise formal phrase.',
      })
    ).toMatchObject({
      alternatives: ['negligible rainfall'],
      context: expect.stringContaining('almost no rain'),
    });
  });
});
