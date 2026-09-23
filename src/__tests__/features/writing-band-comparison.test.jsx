import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BandComparison } from '@/features/testing/writing/components/WritingTest/components/WritingCoach';

describe('Writing practice coaching interface', () => {
  it('shows the requested Band 8.0 label and compares the learner sentence side by side', () => {
    render(
      <BandComparison
        original="The figure rose."
        generate={vi.fn()}
        transformation={{
          sourceSentences: [{ id: 1, paragraph: 0, source: 'The figure rose.' }],
          segments: [
            {
              sourceSentenceIds: [1],
              revisedText: 'The figure increased.',
              changeTags: ['Vocabulary'],
              shortReason: 'More precise.',
            },
          ],
          languageNotes: [],
          limitations: [],
        }}
      />
    );
    expect(screen.getByText('Your answer and Band 8.0 example')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element.tagName === 'P' && element.textContent === 'The figure rose.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element.tagName === 'P' && element.textContent === 'The figure increased.'
      )
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Read complete Band 8.0 example' }));
    expect(
      screen.getAllByText(
        (_, element) => element.tagName === 'P' && element.textContent === 'The figure increased.'
      )
    ).toHaveLength(2);
  });

  it('requests the example only when the student asks for it', () => {
    const generate = vi.fn();
    render(<BandComparison original="The figure rose." generate={generate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show Band 8.0 example' }));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not offer a broken request when the coaching service is unavailable', () => {
    const generate = vi.fn();
    render(
      <BandComparison
        original="The figure rose."
        generate={generate}
        disabledReason="Band 8.0 examples are temporarily unavailable."
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('temporarily unavailable');
    expect(screen.getByRole('button', { name: 'Show Band 8.0 example' })).toBeDisabled();
    expect(generate).not.toHaveBeenCalled();
  });
});
