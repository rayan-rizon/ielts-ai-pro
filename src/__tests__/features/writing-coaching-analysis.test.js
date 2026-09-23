import { describe, expect, it } from 'vitest';
import { analyzeWriting, plainWritingText } from '@/features/testing/writing/utils/writingCoaching';

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

  it('keeps hyphenated task terms together and reports paragraph openings', () => {
    const result = analyzeWriting(
      'Full-time students attend. Full-time students read. Full-time students learn.\n\nHowever, part-time students also attend.'
    );
    expect(result.repeated.some((item) => item.word === 'time')).toBe(false);
    expect(result.paragraphCount).toBe(2);
    expect(result.paragraphOpenings[1]).toMatch(/^However/);
  });
});
