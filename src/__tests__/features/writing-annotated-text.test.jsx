import React from 'react';
import { render, screen } from '@testing-library/react';
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
            { word: 'rural', count: 3, inPrompt: true, examples: ['Rural jobs are important.'] },
          ],
          linking: [{ category: 'Addition', count: 1, phrases: ['also'] }],
          paragraphCount: 1,
          paragraphOpenings: ['Rural jobs are important.'],
        }}
      />
    );

    expect(screen.getByText('Band 8 vocabulary & cohesion')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary ideas from your answer')).toBeInTheDocument();
    expect(screen.getByText('essential')).toBeInTheDocument();
    expect(screen.getByText('a central factor')).toBeInTheDocument();
    expect(
      screen.getByText('Shows significance without exaggeration.', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText('Words used several times')).toBeInTheDocument();
    expect(screen.getByText('How you connect ideas')).toBeInTheDocument();
    expect(screen.getByText('3 uses')).toBeInTheDocument();
    expect(screen.getByText('1 use')).toBeInTheDocument();
    expect(screen.getAllByText('“Rural jobs are important.”')).toHaveLength(2);
  });
});
