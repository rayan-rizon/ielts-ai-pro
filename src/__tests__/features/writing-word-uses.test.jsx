import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WordsAndLinking from '@/components/writing/WordsAndLinking';
import { snippetAround } from '@/features/testing/writing/utils/repeatedWordAdvice';
import { reportT } from '@/features/testing/writing/report/reportStrings';

const sentence =
  'The chart shows how many people used the new library on the north side of the town centre, as the number of weekend visitors rose steadily.';

const show = (words) =>
  render(
    <WordsAndLinking
      t={reportT('en')}
      text={sentence}
      newWords={[]}
      repeatedWords={words}
      isVisualTask
      writingAnalysis={{ linking: [], paragraphCount: 1, paragraphOpenings: ['The diagram'] }}
    />
  );

describe('the words used a lot', () => {
  it('keeps only the few words around each use', () => {
    expect(snippetAround(sentence, 'side')).toBe('…library on the north side of the town centre,…');
    expect(snippetAround('Side effects matter.', 'side')).toBe('Side effects matter.');
  });

  it('says what to do once, with no paragraph inside each word', () => {
    const { container } = show([
      { word: 'side', count: 5, examples: [sentence] },
      { word: 'library', count: 3, examples: [sentence] },
    ]);
    expect(screen.getAllByText('Change a few, not all. Keep chart labels.')).toHaveLength(1);
    expect(container).not.toHaveTextContent(/Examiners notice|shows a wider range|Try “it”/);
    expect(screen.getByText('5 times')).toBeInTheDocument();
  });

  it('shows where a repeated word was used, briefly', () => {
    const { container } = show([{ word: 'side', count: 5, examples: [sentence] }]);
    fireEvent.click(screen.getByRole('button', { name: /See where you used it/ }));
    expect(container).toHaveTextContent('…library on the north side of the town centre,…');
    expect(container).not.toHaveTextContent('The chart shows');
  });
});
