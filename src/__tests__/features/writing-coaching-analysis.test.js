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

  it('shows complete sentence context and the preceding idea for connectors', () => {
    const result = analyzeWriting(
      'Rural jobs support families. By contrast, rural towns lose workers.\n\nIn conclusion, planning matters. Specifically, it should protect services.'
    );
    const contrast = result.linking.find((item) => item.category === 'Contrast');
    const conclusion = result.linking.find((item) => item.category === 'Conclusion');
    const clarification = result.linking.find((item) => item.category === 'Clarification');

    expect(contrast.matches[0]).toEqual({
      phrase: 'by contrast',
      sentence: 'By contrast, rural towns lose workers.',
      previousSentence: 'Rural jobs support families.',
    });
    expect(conclusion.count).toBe(1);
    expect(clarification.count).toBe(1);
    expect(result.linking.some((item) => item.category === 'Sequence')).toBe(false);
  });

  it('keeps within-sentence contrasts separate from the preceding sentence', () => {
    const result = analyzeWriting('Formal lessons matter. I agree, although children need play.');
    expect(result.linking.find((item) => item.category === 'Contrast').matches[0]).toMatchObject({
      phrase: 'although',
      previousSentence: '',
    });
  });

  it('reports repeated chart wording as a count without diagnosing it', () => {
    const result = analyzeWriting(
      'Rainfall rose. Rainfall peaked. Rainfall then fell.',
      'Describe the rainfall chart.'
    );
    expect(result.repeated).toContainEqual(
      expect.objectContaining({ word: 'rainfall', count: 3, inPrompt: true })
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
