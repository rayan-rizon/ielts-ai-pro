import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TranscriptPanel from '@/features/testing/listening/components/ListeningTest/components/TranscriptPanel';

const listeningState = { showTranscript: true };

vi.mock(
  '@/features/testing/listening/components/ListeningTest/context/ListeningTestContext',
  () => ({
    useListeningTestState: () => listeningState,
    useListeningAudioTime: () => 0,
    useListeningTestDispatch: () => ({
      dispatch: vi.fn(),
      setAudioTimeRef: vi.fn(),
      ACTIONS: { TOGGLE_TRANSCRIPT: 'TOGGLE_TRANSCRIPT' },
    }),
  })
);

vi.mock('@/features/testing/listening/components/ListeningTest/components/AudioPlayer', () => ({
  default: React.forwardRef(function MockAudioPlayer(_props, _ref) {
    return <div>Audio controls</div>;
  }),
}));

const currentSection = {
  title: 'Newspaper Survey',
  audio_url: 'https://example.com/audio.mp3',
  transcript_highlights: [{ question_number: 1, phrase: 'newspaper' }],
  srt_content: [
    '1',
    '00:00:01,000 --> 00:00:04,000',
    'ANNOUNCER: Listen carefully.',
    '',
    '2',
    '00:00:04,000 --> 00:00:07,000',
    'SPEAKER: The answer is newspaper.',
  ].join('\n'),
};

const sharedProps = {
  audioPlayerRef: { current: null },
  currentSection,
  sectionQuestions: [{ question_number: 1, _displayStartNumber: 1, _displayEndNumber: 1 }],
  correctAnswersMap: {
    q1: { questionNumber: 1, correctAnswer: 'newspaper', isCorrect: true },
  },
};

describe('Listening TranscriptPanel exam visibility', () => {
  beforeEach(() => {
    listeningState.showTranscript = true;
  });

  it('keeps the audioscript and answers hidden during an active exam', () => {
    render(<TranscriptPanel {...sharedProps} examMode isFinished={false} />);

    expect(screen.getByText(/audioscripts are unavailable in exam mode/i)).toBeInTheDocument();
    expect(screen.queryByText('newspaper')).not.toBeInTheDocument();
  });

  it('shows the audioscript and numbered answer highlight after submission', () => {
    render(<TranscriptPanel {...sharedProps} examMode isFinished />);

    expect(screen.getByText('Audioscript')).toBeInTheDocument();
    expect(screen.getByText('Newspaper Survey')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer evidence 1')).toBeInTheDocument();
  });

  it('shows official source highlights during Practice Mode', () => {
    render(<TranscriptPanel {...sharedProps} examMode={false} isFinished={false} />);

    expect(screen.getByText('Newspaper Survey')).toBeInTheDocument();
    expect(screen.getByLabelText('Answer evidence 1')).toBeInTheDocument();
  });
});
