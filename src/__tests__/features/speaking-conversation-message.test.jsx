import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ConversationMessage from '@/features/testing/speaking/components/ConversationMessage';

describe('speaking conversation message', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the candidate transcript as a live streaming bubble', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'user',
          text: 'I enjoyed studying science at school.',
          isLoading: true,
          isLive: true,
          autoFinishCountdown: 2,
        }}
      />
    );

    expect(screen.getByText('I enjoyed studying science at school.')).toBeInTheDocument();
    expect(screen.getByText('Sending in 2s')).toBeInTheDocument();
    expect(screen.getByText('Keep speaking to cancel the countdown.')).toBeInTheDocument();
  });

  it('clearly shows when silence auto-send is paused', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'user',
          text: 'There are several reasons for this.',
          isLoading: true,
          isLive: true,
          autoSubmitPaused: true,
        }}
      />
    );

    expect(screen.getByText('Auto-send paused')).toBeInTheDocument();
    expect(screen.getByText('Silence will not send this answer.')).toBeInTheDocument();
  });

  it('shows a transcript-only loading state when no live words are available', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{ speaker: 'user', text: '', isLoading: true, isTranscriptDraft: false }}
      />
    );

    expect(screen.getByText('Preparing transcript')).toBeInTheDocument();
    expect(screen.queryByText('Answer captured')).not.toBeInTheDocument();
  });

  it('reveals the examiner question progressively while the voice is playing', async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'ai',
          text: 'How interested are young people in learning to drive?',
          isExaminerLive: true,
          isExaminerSpeaking: true,
          speechProgress: 0,
        }}
      />
    );

    expect(screen.getByText('British examiner · live')).toBeInTheDocument();
    expect(screen.getByText('How')).toBeInTheDocument();

    rerender(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'ai',
          text: 'How interested are young people in learning to drive?',
          isExaminerLive: true,
          isExaminerSpeaking: true,
          speechProgress: 1,
        }}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(
      screen.getByText('How interested are young people in learning to drive?')
    ).toBeInTheDocument();
  });

  it('shows a polished preparation state before examiner audio starts', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'ai',
          text: 'What do you enjoy about your hometown?',
          isExaminerLive: true,
          isExaminerPreparing: true,
          isExaminerSpeaking: false,
        }}
      />
    );

    expect(screen.getByText('Preparing examiner audio')).toBeInTheDocument();
    expect(screen.getByText('Getting the examiner voice ready…')).toBeInTheDocument();
  });
});
