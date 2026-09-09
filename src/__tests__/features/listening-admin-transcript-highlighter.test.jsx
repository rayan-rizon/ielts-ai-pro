import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ListeningTranscriptHighlighter, {
  parseManualQuestionNumbers,
} from '@/components/admin/tests/creation/ListeningTranscriptHighlighter';
import { serializeListeningSections } from '@/components/admin/tests/creation/listeningEditorSerialization';
import SyncedTranscript from '@/features/testing/listening/components/ListeningTest/components/SyncedTranscript';

const SRT = [
  '1',
  '00:00:01,000 --> 00:00:04,000',
  'MIA: The lecture focused on long-term issues.',
  '',
  '2',
  '00:00:04,000 --> 00:00:07,000',
  'LEO: That was the strongest answer.',
].join('\n');

function selectNodeContents(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

describe('Listening admin transcript highlighter', () => {
  it('accepts individual and grouped question numbers safely', () => {
    expect(parseManualQuestionNumbers('21, 22 and 22', 21, 30)).toEqual([21, 22]);
    expect(parseManualQuestionNumbers('20, 31', 21, 30)).toEqual([]);
  });

  it('persists manual transcript highlights in the listening passage content', () => {
    const [section] = serializeListeningSections([
      {
        title: 'Part 3',
        audio_url: 'https://example.com/part-3.mp3',
        transcript: '',
        srt_content: SRT,
        transcript_highlights: [
          {
            question_number: 21,
            question_numbers: [21, 22],
            phrase: 'The lecture focused on long-term issues.',
          },
        ],
        groups: [],
      },
    ]);

    expect(section.transcript_highlights).toEqual([
      {
        question_number: 21,
        question_numbers: [21, 22],
        phrase: 'The lecture focused on long-term issues.',
      },
    ]);
  });

  it('hides timestamps in highlight mode and keeps raw SRT available', () => {
    render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={[]}
        onSrtChange={vi.fn()}
        onHighlightsChange={vi.fn()}
        questionStart={21}
        questionEnd={30}
      />
    );

    expect(screen.getByText('The lecture focused on long-term issues.')).toBeInTheDocument();
    expect(screen.queryByDisplayValue(SRT)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit srt/i }));

    expect(screen.getByLabelText('Raw SRT transcript')).toHaveValue(SRT);
  });

  it('shows previously saved answer evidence when the admin editor reopens', () => {
    render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={[
          {
            question_number: 21,
            question_numbers: [21, 22],
            phrase: 'The lecture focused on long-term issues.',
          },
        ]}
        onSrtChange={vi.fn()}
        onHighlightsChange={vi.fn()}
        questionStart={21}
        questionEnd={30}
      />
    );

    expect(screen.getByLabelText('Answer evidence 21,22')).toBeInTheDocument();
    expect(screen.getByText('Saved evidence · 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove answer evidence 21,22' })
    ).toBeInTheDocument();
  });

  it('edits a saved highlight straight from the transcript without scrolling to the list', () => {
    const onHighlightsChange = vi.fn();
    render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={[
          {
            question_number: 21,
            phrase: 'The lecture focused on long-term issues.',
            source_index: 0,
          },
        ]}
        onSrtChange={vi.fn()}
        onHighlightsChange={onHighlightsChange}
        questionStart={21}
        questionEnd={30}
      />
    );

    fireEvent.click(screen.getByLabelText('Answer evidence 21'));
    fireEvent.change(screen.getByLabelText('Question numbers'), { target: { value: '23,24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save answer highlight' }));

    expect(onHighlightsChange.mock.calls.at(-1)[0]).toEqual([
      {
        question_number: 23,
        question_numbers: [23, 24],
        phrase: 'The lecture focused on long-term issues.',
        source_index: 0,
      },
    ]);
  });

  it('removes a saved highlight from the transcript popover', () => {
    const onHighlightsChange = vi.fn();
    render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={[
          {
            question_number: 21,
            phrase: 'The lecture focused on long-term issues.',
            source_index: 0,
          },
          { question_number: 22, phrase: 'That was the strongest answer.', source_index: 1 },
        ]}
        onSrtChange={vi.fn()}
        onHighlightsChange={onHighlightsChange}
        questionStart={21}
        questionEnd={30}
      />
    );

    fireEvent.click(screen.getByLabelText('Answer evidence 21'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove this answer highlight' }));

    expect(onHighlightsChange.mock.calls.at(-1)[0]).toEqual([
      { question_number: 22, phrase: 'That was the strongest answer.', source_index: 1 },
    ]);
  });

  it('removes every chunk of a multi-segment highlight together', () => {
    const onHighlightsChange = vi.fn();
    const grouped = [
      {
        question_number: 21,
        phrase: 'The lecture focused on long-term issues.',
        source_index: 0,
        show_badge: false,
      },
      { question_number: 21, phrase: 'That was the strongest answer.', source_index: 1 },
    ];

    render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={grouped}
        onSrtChange={vi.fn()}
        onHighlightsChange={onHighlightsChange}
        questionStart={21}
        questionEnd={30}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove answer evidence 21' })[0]);

    expect(onHighlightsChange.mock.calls.at(-1)[0]).toEqual([]);
  });

  it('saves selected evidence and renders it through the learner transcript contract', () => {
    const onHighlightsChange = vi.fn();
    const { unmount } = render(
      <ListeningTranscriptHighlighter
        srtContent={SRT}
        highlights={[]}
        onSrtChange={vi.fn()}
        onHighlightsChange={onHighlightsChange}
        questionStart={21}
        questionEnd={30}
      />
    );

    const selectedSentence = screen.getByText('The lecture focused on long-term issues.');
    selectNodeContents(selectedSentence);
    fireEvent.mouseUp(screen.getByLabelText('Timestamp-free transcript highlighter'));
    fireEvent.change(screen.getByLabelText('Question numbers'), { target: { value: '21,22' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add answer highlight' }));

    const savedHighlights = onHighlightsChange.mock.calls.at(-1)[0];
    expect(savedHighlights).toEqual([
      {
        question_number: 21,
        question_numbers: [21, 22],
        phrase: 'The lecture focused on long-term issues.',
        source_index: 0,
      },
    ]);

    unmount();
    render(
      <SyncedTranscript
        srtContent={SRT}
        currentTime={0}
        showAnswerHighlights
        sourceHighlights={savedHighlights}
      />
    );

    expect(screen.getByLabelText('Answer evidence 21,22')).toBeInTheDocument();
  });
});
