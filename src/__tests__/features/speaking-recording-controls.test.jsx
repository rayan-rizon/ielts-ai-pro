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
  isPlaybackActive: false,
  processingStatus: '',
  micError: null,
  liveTranscript: '',
  recordingStartedAt: null,
  autoFinishCountdown: null,
  autoSubmitPaused: false,
  hasDetectedSpeech: false,
  handsFreeEnabled: true,
  timerExpiredRef: { current: false },
  onStartListening: vi.fn(),
  onStopListening: vi.fn(),
  onAutoSubmitPausedChange: vi.fn(),
  onStartTest: vi.fn(),
};

describe('speaking recording controls', () => {
  it('keeps recording unavailable until examiner audio has actually ended', () => {
    render(<RecordingControls {...readyProps} isPlaybackActive />);

    expect(screen.getByRole('button', { name: 'Start recording answer' })).toBeDisabled();
    expect(screen.queryByText('Microphone ready')).not.toBeInTheDocument();
  });

  it('shows the hands-free fallback while waiting to auto-start', () => {
    const onStartListening = vi.fn();
    render(<RecordingControls {...readyProps} onStartListening={onStartListening} />);

    expect(screen.getByText('Microphone ready')).toBeInTheDocument();
    expect(screen.queryByText(/Hands-free mode starts/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start recording answer' }));
    expect(onStartListening).toHaveBeenCalledOnce();
  });

  it('returns to explicit start and finish controls in manual mode', () => {
    render(<RecordingControls {...readyProps} handsFreeEnabled={false} />);

    expect(screen.getByText('Ready for your answer')).toBeInTheDocument();
    expect(
      screen.queryByText('Start and finish each answer when you are ready.')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start recording answer' })).toHaveTextContent(
      'Start answer'
    );
  });

  it('keeps recording controls compact while the transcript streams in chat', () => {
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

    expect(screen.queryByText('Transcript streaming in chat')).not.toBeInTheDocument();
    expect(screen.queryByText('I know the capital city quite well.')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Pause test timer and automatic answer sending' })
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

  it('lets the learner pause and resume silence auto-send without stopping recording', () => {
    const onAutoSubmitPausedChange = vi.fn();
    const { rerender } = render(
      <RecordingControls
        {...readyProps}
        isListening
        onAutoSubmitPausedChange={onAutoSubmitPausedChange}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Pause test timer and automatic answer sending' })
    );
    expect(onAutoSubmitPausedChange).toHaveBeenCalledWith(true);

    rerender(
      <RecordingControls
        {...readyProps}
        isListening
        autoSubmitPaused
        onAutoSubmitPausedChange={onAutoSubmitPausedChange}
      />
    );
    expect(screen.queryByText('Timer & auto-send paused')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Resume test timer and automatic answer sending' })
    );
    expect(onAutoSubmitPausedChange).toHaveBeenLastCalledWith(false);
  });
});
