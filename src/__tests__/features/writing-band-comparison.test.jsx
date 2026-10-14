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
          limitations: [
            'The task visual was not checked for this language example; use your scored feedback to review data accuracy.',
          ],
        }}
      />
    );
    expect(screen.getByText('Your answer and Band 8.0 example')).toBeInTheDocument();
    expect(
      screen.getByText('Compare your sentence with the Band 8.0 example. Each change has a reason.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The visual was not rechecked. Check factual details against the original visual.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/AI-generated example is for practice/)).not.toBeInTheDocument();
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
    expect(screen.getByText('1 of 1 sentences changed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Read complete Band 8.0 example' }));
    expect(
      screen.getAllByText(
        (_, element) => element.tagName === 'P' && element.textContent === 'The figure increased.'
      )
    ).toHaveLength(2);
  });

  it('hides Task 1 sentences the coach kept unchanged until the learner asks for them', () => {
    render(
      <BandComparison
        taskType="Task 1"
        original="The chart shows sales. Sales rose to 40% in 2020. The trend was clear."
        generate={vi.fn()}
        transformation={{
          sourceSentences: [
            { id: 1, paragraph: 0, source: 'The chart shows sales.' },
            { id: 2, paragraph: 0, source: 'Sales rose to 40% in 2020.' },
            { id: 3, paragraph: 0, source: 'The trend was clear.' },
          ],
          segments: [
            {
              sourceSentenceIds: [1],
              revisedText: 'The chart shows sales.',
              changeTags: [],
              shortReason: '',
            },
            {
              sourceSentenceIds: [2],
              revisedText: 'Sales climbed to 40% in 2020.',
              changeTags: ['Vocabulary'],
              shortReason: 'Data kept.',
            },
            {
              sourceSentenceIds: [3],
              revisedText: 'The overall trend was unmistakable.',
              changeTags: ['Vocabulary'],
              shortReason: 'More precise.',
            },
          ],
          languageNotes: [],
          limitations: [],
        }}
      />
    );

    // Sentence 2 carries a number, so the Task 1 guard keeps it verbatim too.
    expect(screen.getByText('1 of 3 sentences changed')).toBeInTheDocument();
    expect(screen.queryByText('Your sentence 1')).not.toBeInTheDocument();
    expect(screen.getByText('Your sentence 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show the 2 unchanged sentences too' }));
    expect(screen.getByText('Your sentence 1')).toBeInTheDocument();
    expect(screen.queryAllByText(/Kept as you wrote it/)).toHaveLength(0);
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

  it('does not blame the student when example generation fails', () => {
    render(
      <BandComparison
        taskType="Task 1"
        original="The chart shows three years."
        status="failed"
        generate={vi.fn()}
      />
    );
    expect(screen.getByText(/example service could not prepare this answer/i)).toBeInTheDocument();
    expect(screen.queryByText(/revise your answer/i)).not.toBeInTheDocument();
  });
});
