import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SyncedTranscript from '@/features/testing/listening/components/ListeningTest/components/SyncedTranscript';

describe('SyncedTranscript', () => {
  it('hides silence, keeps timing, and renders source-style answer highlights', () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'You will hear a telephone conversation.',
      '',
      '2',
      '00:00:03,000 --> 00:00:05,000',
      '[Silence]',
      '',
      '3',
      '00:00:05,000 --> 00:00:08,000',
      'ANDREA: I read about you in the newspaper.',
    ].join('\n');

    render(
      <SyncedTranscript
        srtContent={srt}
        currentTime={6}
        onSegmentClick={vi.fn()}
        showAnswerHighlights
        correctAnswersMap={{
          q2: { questionNumber: 2, correctAnswer: 'newspaper', isCorrect: true },
        }}
      />
    );

    expect(screen.queryByText(/silence/i)).not.toBeInTheDocument();
    expect(screen.getByText('ANNOUNCER')).toBeInTheDocument();
    expect(screen.getByText('ANDREA')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer evidence 2')).toBeInTheDocument();
  });

  it('renders a labelled static audioscript without clickable timing claims', () => {
    render(
      <SyncedTranscript
        srtContent=""
        plainTranscript={'ANNOUNCER: Part 1. Listen carefully.\nJULIE: Hello?'}
      />
    );

    expect(screen.getByText(/sentence timing is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText('JULIE')).toBeInTheDocument();
    expect(screen.getByText('Hello?')).toHaveClass('cursor-text');
  });
});
