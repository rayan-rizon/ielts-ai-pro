import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SpeakingConversationPanel from '@/features/testing/speaking/components/SpeakingConversationPanel';

const examinerQuestion = 'What do you enjoy about your hometown?';

function buildProps(overrides = {}) {
  return {
    currentPartNumber: 1,
    currentPart: { title: 'Introduction & Interview' },
    allParts: { 1: { title: 'Introduction & Interview' } },
    conversation: [{ speaker: 'ai', text: examinerQuestion }],
    authUser: { full_name: 'Candidate' },
    testStarted: true,
    isPartComplete: false,
    moveToNextPart: vi.fn(),
    conversationContainerRef: { current: null },
    isPart2Prep: false,
    cueCardTopic: null,
    prepTimeLeft: 60,
    handleStartPart2Speaking: vi.fn(),
    isListening: false,
    isRecording: false,
    isProcessing: false,
    isSpeaking: false,
    isTTSLoading: false,
    activeSpeechText: '',
    isPlaybackActive: false,
    speechProgress: null,
    processingStatus: '',
    micError: null,
    liveTranscript: '',
    autoFinishCountdown: null,
    autoSubmitPaused: false,
    handsFreeEnabled: false,
    timerExpiredRef: { current: false },
    startListening: vi.fn(),
    stopListening: vi.fn(),
    setAutoSubmitPaused: vi.fn(),
    handleStartTest: vi.fn(),
    ...overrides,
  };
}

describe('speaking conversation panel examiner streaming', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('streams only the exact examiner utterance being played', async () => {
    vi.useFakeTimers();
    const instruction = 'Welcome to Part 1. Listen to the first question.';
    const conversation = [
      { speaker: 'ai', text: instruction },
      { speaker: 'ai', text: examinerQuestion },
    ];
    const { rerender } = render(
      <SpeakingConversationPanel
        {...buildProps({
          activeSpeechText: instruction,
          conversation,
          isSpeaking: true,
          isTTSLoading: true,
        })}
      />
    );

    expect(screen.getByText('Preparing examiner audio')).toBeInTheDocument();
    expect(screen.queryByText(instruction)).not.toBeInTheDocument();
    expect(screen.getByText(examinerQuestion)).toBeInTheDocument();

    rerender(
      <SpeakingConversationPanel
        {...buildProps({
          activeSpeechText: instruction,
          conversation,
          isSpeaking: true,
          isTTSLoading: false,
          isPlaybackActive: true,
          speechProgress: 0,
        })}
      />
    );

    expect(screen.getByText('British examiner · live')).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText(examinerQuestion)).toBeInTheDocument();

    rerender(
      <SpeakingConversationPanel
        {...buildProps({
          activeSpeechText: instruction,
          conversation,
          isSpeaking: true,
          isTTSLoading: false,
          isPlaybackActive: true,
          speechProgress: 1,
        })}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText(instruction)).toBeInTheDocument();
  });

  it('renders an existing examiner message normally when no utterance is active', () => {
    vi.useFakeTimers();
    render(<SpeakingConversationPanel {...buildProps()} />);

    act(() => {
      vi.advanceTimersByTime(950);
    });

    expect(screen.getByText(examinerQuestion)).toBeInTheDocument();
    expect(screen.queryByText('Preparing examiner audio')).not.toBeInTheDocument();
  });
});
