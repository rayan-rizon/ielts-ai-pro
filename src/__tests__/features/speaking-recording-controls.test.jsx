import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecordingControls from '@/features/testing/speaking/components/RecordingControls';

const readyProps = {
  testStarted: true,
  isPart2Prep: false,
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  isTTSLoading: false,
  processingStatus: '',
  micError: null,
  liveTranscript: '',
  recordingStartedAt: null,
  autoFinishCountdown: null,
  hasDetectedSpeech: false,
  handsFreeEnabled: true,
  timerExpiredRef: { current: false },
  onStartListening: vi.fn(),
  onStopListening: vi.fn(),
  onStartTest: vi.fn(),
};

describe('speaking recording controls', () => {
  it('shows the hands-free fallback while waiting to auto-start', () => {
    const onStartListening = vi.fn();
    render(<RecordingControls {...readyProps} onStartListening={onStartListening} />);

    expect(screen.getByText('Microphone starting')).toBeInTheDocument();
    expect(
      screen.getByText('Hands-free mode starts after each question. Start now is only a fallback.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start recording answer' }));
    expect(onStartListening).toHaveBeenCalledOnce();
  });

  it('returns to explicit start and finish controls in manual mode', () => {
    render(<RecordingControls {...readyProps} handsFreeEnabled={false} />);

    expect(screen.getByText('Ready for your answer')).toBeInTheDocument();
    expect(
      screen.getByText('Start and finish each answer when you are ready.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start recording answer' })).toHaveTextContent(
      'Start answer'
    );
  });

  it('shows live captions and a cancellable smart-finish countdown while recording', () => {
    render(
      <RecordingControls
        {...readyProps}
        isListening
        liveTranscript="I know the capital city quite well."
        recordingStartedAt={Date.now() - 5000}
        autoFinishCountdown={2}
        hasDetectedSpeech
      />
    );

    expect(screen.getByText('Live answer')).toBeInTheDocument();
    expect(screen.getByText('I know the capital city quite well.')).toBeInTheDocument();
    expect(screen.getByText(/Finishing in 2s/)).toBeInTheDocument();
    expect(
      screen.getByText('Live transcript preview. Final wording may be refined after you finish.')
    ).toBeInTheDocument();
  });

  it('keeps manual finish as a fallback and labels the submitted action clearly', () => {
    const onStopListening = vi.fn();
    render(
      <RecordingControls
        {...readyProps}
        isListening
        recordingStartedAt={Date.now()}
        onStopListening={onStopListening}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Finish and send answer' }));
    expect(onStopListening).toHaveBeenCalledWith('manual');
  });
});
