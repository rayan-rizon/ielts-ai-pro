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
      replacementText: 'transport reduces',
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

    expect(screen.getByText('Change to')).toBeInTheDocument();
    expect(screen.getByText('transport reduces')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use in my draft' })).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('shows advice without an apply action when no replacement phrase was verified', () => {
    render(
      <AnnotatedText
        text="Students clearly outnumber staff."
        annotations={[
          {
            originalText: 'Students clearly outnumber staff',
            type: 'clarity',
            suggestion: 'Compare only categories defined in the chart.',
            explanation: 'Check the group labels.',
            severity: 'suggestion',
          },
        ]}
        focusAnnotation={{ originalText: 'Students clearly outnumber staff', requestId: 2 }}
        onApplyCorrection={vi.fn()}
      />
    );
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use in my draft' })).not.toBeInTheDocument();
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

    expect(screen.getByText('Words and linking')).toBeInTheDocument();
    expect(screen.getByText('Better words for this essay')).toBeInTheDocument();
    expect(screen.getByText('essential')).toBeInTheDocument();
    expect(screen.getByText('a central factor')).toBeInTheDocument();
    expect(
      screen.getByText('Shows significance without exaggeration.', { exact: false })
    ).toBeInTheDocument();
    // "rural" is a word from the question, so it is not listed as overused.
    expect(screen.queryByText('Words you used a lot')).not.toBeInTheDocument();
    expect(screen.getByText('Linking words you used')).toBeInTheDocument();
    expect(screen.getByText('Adds a point')).toBeInTheDocument();
    expect(screen.getByText('also')).toBeInTheDocument();
    expect(screen.getByText('Paragraph flow')).toBeInTheDocument();
    expect(screen.getByText('1 paragraph')).toBeInTheDocument();
    expect(screen.getByText('Why it is better:', { exact: false })).toBeInTheDocument();
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
      example: '',
    });
    fireEvent.click(screen.getByText('Paragraph flow'));
    expect(screen.getByLabelText('Paragraph 1')).toBeInTheDocument();
  });

  it("keeps the learner's paragraphs instead of joining the essay into one block", () => {
    const { container } = render(
      <AnnotatedText
        text="<p>First paragraph about transport.</p><p>Second paragraph with people is wrong.</p>"
        annotations={[
          {
            originalText: 'people is',
            type: 'grammar',
            suggestion: 'people are',
            replacementText: 'people are',
            explanation: 'Plural subject.',
            severity: 'error',
          },
        ]}
      />
    );
    const paragraphs = container.querySelectorAll('p.font-serif');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('First paragraph about transport.');
    expect(paragraphs[1].textContent).toBe('Second paragraph with people is wrong.');
    // No margin column: paragraphs keep their full width.
    expect(screen.queryByText('1 thing to fix')).not.toBeInTheDocument();
  });

  it('keeps a mistake that sits inside a longer highlight reachable in the same popover', () => {
    const inner = {
      originalText: 'people is',
      type: 'grammar',
      suggestion: 'people are',
      replacementText: 'people are',
      explanation: 'A plural subject needs a plural verb.',
      severity: 'error',
    };
    const outer = {
      originalText: 'When people is not paying for buses they drive',
      type: 'clarity',
      suggestion: 'Split the cause and the result.',
      replacementText: '',
      explanation: 'One idea per sentence is easier to follow.',
      severity: 'warning',
    };
    render(
      <AnnotatedText
        text="When people is not paying for buses they drive less."
        annotations={[outer, inner]}
        focusAnnotation={{ ...outer, requestId: 3 }}
      />
    );
    // The more specific mistake is the highlight; the clarity note is listed with it.
    expect(screen.getByText('people are')).toBeInTheDocument();
    expect(screen.getByText('Also in this part')).toBeInTheDocument();
    expect(screen.getByText(/Split the cause and the result/)).toBeInTheDocument();
  });

  it('marks a passage the report points to even when it has no note of its own', () => {
    const { container } = render(
      <AnnotatedText
        text="The government can take money from other things."
        annotations={[]}
        focusAnnotation={{ originalText: 'take money from other things', requestId: 4 }}
      />
    );
    expect(container.querySelector('mark')?.textContent).toBe('take money from other things');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("shows the marker's note directly under the paragraph it describes", () => {
    render(
      <AnnotatedText
        text="<p>Nowadays many people agree with this.</p><p>Firstly free transport reduces traffic.</p>"
        annotations={[]}
        paragraphNotes={[
          { opening: 'Firstly free transport reduces', note: 'Good reason; add an example.' },
        ]}
      />
    );
    const note = screen.getByText('Good reason; add an example.');
    expect(note.previousElementSibling?.textContent).toBe(
      'Firstly free transport reduces traffic.'
    );
  });

  it('leaves chart labels out of overused words in Task 1', () => {
    render(
      <AnnotatedText
        text="Users were very satisfied with staff. People praised staff and people stayed."
        annotations={[]}
        isVisualTask
        chartText="Staff helpfulness has the highest very-satisfied percentage."
        writingAnalysis={{
          repeated: [
            { word: 'satisfied', count: 8, inPrompt: false, examples: [] },
            { word: 'staff', count: 5, inPrompt: false, examples: [] },
            { word: 'people', count: 4, inPrompt: false, examples: [] },
          ],
          linking: [],
          paragraphCount: 1,
          paragraphOpenings: [],
        }}
      />
    );
    expect(screen.queryByText('satisfied')).not.toBeInTheDocument();
    expect(screen.queryByText('staff')).not.toBeInTheDocument();
    expect(screen.getByText('people')).toBeInTheDocument();
    expect(screen.getByText('individuals')).toBeInTheDocument();
    expect(screen.getByText(/labels from the chart are left out/)).toBeInTheDocument();
  });
});
