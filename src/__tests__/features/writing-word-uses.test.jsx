import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WordsAndLinking from '@/components/writing/WordsAndLinking';
import { reportT } from '@/features/testing/writing/report/reportStrings';

describe('opening the details under Words and linking', () => {
  it('shows where a repeated word was used, and the paragraph openings', () => {
    render(
      <WordsAndLinking
        t={reportT('en')}
        text="People help people."
        newWords={[]}
        repeatedWords={[{ word: 'people', count: 6, examples: ['People help people.'] }]}
        writingAnalysis={{ linking: [], paragraphCount: 1, paragraphOpenings: ['People help'] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /See where you used it/ }));
    expect(screen.getAllByText(/help/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Paragraph flow/ }));
    expect(screen.getByText(/Hide openings/)).toBeTruthy();
  });
});
