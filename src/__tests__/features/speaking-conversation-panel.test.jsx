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
    timeExpired: false,
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

  it('does not replay a delivered question when a placeholder shifts the indices', async () => {
    vi.useFakeTimers();
    // The examiner speaks, the learner answers, and the loading placeholder is
    // dropped when the transcript arrives — renumbering every later entry.
    const withPlaceholder = [
      { speaker: 'ai', text: examinerQuestion },
      { speaker: 'user', text: '', isLoading: true },
    ];
    const { rerender } = render(
      <SpeakingConversationPanel {...buildProps({ conversation: withPlaceholder })} />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.queryByText('British examiner · live')).not.toBeInTheDocument();

    rerender(
      <SpeakingConversationPanel
        {...buildProps({
          conversation: [
            { speaker: 'user', text: 'I like the parks.' },
            { speaker: 'ai', text: examinerQuestion },
          ],
        })}
      />
    );

    // Same text, new position: it must stay a settled message, not stream again.
    expect(screen.queryByText('British examiner · live')).not.toBeInTheDocument();
    expect(screen.getByText(examinerQuestion)).toBeInTheDocument();
  });

  it('follows the transcript from inside the panel that owns the scroll container', () => {
    vi.useFakeTimers();
    // Driving this from the page could not work: the page renders a loader
    // until the session loads, so the container ref was still null when its
    // mount effect ran and the observers were never attached.
    const containerRef = { current: null };
    const { rerender } = render(
      <SpeakingConversationPanel {...buildProps({ conversationContainerRef: containerRef })} />
    );

    // The regression itself: the panel must hand the live element to the hook.
    expect(containerRef.current).not.toBeNull();
    const scrollTop = vi.spyOn(containerRef.current, 'scrollTop', 'set');

    rerender(
      <SpeakingConversationPanel
        {...buildProps({
          conversationContainerRef: containerRef,
          conversation: [
            { speaker: 'ai', text: examinerQuestion },
            { speaker: 'user', text: 'The parks, mostly.' },
          ],
        })}
      />
    );

    expect(scrollTop).toHaveBeenCalled();
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

  it("shows a clear time's-up transition before the final report starts", () => {
    render(
      <SpeakingConversationPanel
        {...buildProps({
          currentPartNumber: 3,
          allParts: { 1: {}, 2: {}, 3: {} },
          timeExpired: true,
        })}
      />
    );

    expect(screen.getAllByText("Time's up").length).toBeGreaterThan(0);
    expect(screen.getByText('Part 3 has finished')).toBeInTheDocument();
    expect(
      screen.getByText('Your answer is saved. Preparing your speaking report now.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start recording answer' })
    ).not.toBeInTheDocument();
  });
});
