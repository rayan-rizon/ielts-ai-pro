import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnnotatedText from '@/components/writing/AnnotatedText';

describe('AnnotatedText focus', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('opens and scrolls to a requested annotation', () => {
    const annotation = {
      originalText: 'transport reduce',
      type: 'grammar',
      suggestion: 'transport reduces',
      explanation: 'A singular subject requires a singular verb.',
      severity: 'error',
    };

    render(
      <AnnotatedText
        text="Public transport reduce congestion when services are reliable."
        annotations={[annotation]}
        focusAnnotation={{ ...annotation, requestId: 1 }}
      />
    );

    expect(screen.getByText('Correction')).toBeInTheDocument();
    expect(screen.getByText('transport reduces')).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('groups vocabulary suggestions with word and linking patterns in the annotation panel', () => {
    const onSaveVocabularyWord = vi.fn().mockResolvedValue({ success: true });
    render(
      <AnnotatedText
        text="Rural jobs are important. Rural jobs support families. Rural jobs change."
        vocabularyEnhancements={[
          {
            original: 'important',
            alternatives: ['essential', 'a central factor'],
            context: 'Shows significance without exaggeration.',
          },
        ]}
        writingAnalysis={{
          repeated: [
            {
              word: 'rural',
              count: 3,
              inPrompt: true,
              examples: [
                'Rural jobs are important.',
                'Rural jobs support families.',
                'Rural jobs change local economies.',
              ],
            },
          ],
          linking: [
            {
              category: 'Addition',
              count: 1,
              phrases: ['also'],
              matches: [
                {
                  phrase: 'also',
                  sentence: 'Rural jobs also support families.',
                  previousSentence: 'Rural businesses create income.',
                },
              ],
            },
          ],
          paragraphCount: 1,
          paragraphOpenings: ['Rural jobs are important.'],
        }}
        onSaveVocabularyWord={onSaveVocabularyWord}
      />
    );

    expect(screen.getByText('Band 8 vocabulary & cohesion')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary ideas')).toBeInTheDocument();
    expect(screen.getByText('essential')).toBeInTheDocument();
    expect(screen.getByText('a central factor')).toBeInTheDocument();
    expect(
      screen.getByText('Shows significance without exaggeration.', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText('Repeated words')).toBeInTheDocument();
    expect(screen.getByText('How your ideas connect')).toBeInTheDocument();
    expect(screen.getByText('Paragraph flow')).toBeInTheDocument();
    expect(screen.getByText('1 paragraph')).toBeInTheDocument();
    expect(screen.getByText('3 occurrences')).toBeInTheDocument();
    expect(screen.getByText('1 use')).toBeInTheDocument();
    expect(screen.getByText('Why it fits:')).toBeInTheDocument();
    expect(screen.getByText('Full sentence')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add “essential” to your vocabulary list' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Add “essential” to your vocabulary list' })
    );
    expect(onSaveVocabularyWord).toHaveBeenCalledWith({
      word: 'essential',
      original: 'important',
      context: 'Shows significance without exaggeration.',
      example: 'Rural jobs are essential.',
    });
    fireEvent.click(screen.getByText('View sentence'));
    expect(screen.getByText('Previous idea:')).toBeInTheDocument();
    expect(screen.getByText('Rural businesses create income.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Paragraph flow'));
    expect(screen.getByLabelText('Paragraph 1')).toBeInTheDocument();
  });
});
