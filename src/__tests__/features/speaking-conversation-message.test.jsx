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

    expect(screen.getByText('Timer & auto-send paused')).toBeInTheDocument();
    expect(screen.getByText('Test time and silence sending are paused.')).toBeInTheDocument();
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

  it('turns the practice coach hint into an actionable card with the captured evidence', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'coach',
          code: 'develop_detail',
          partNumber: 2,
          evidenceQuote: 'The trip was memorable.',
          text: 'Develop one idea with a concrete detail.',
        }}
      />
    );

    expect(screen.getByText('Turn the idea into a scene')).toBeInTheDocument();
    expect(
      screen.getByText(
        'For your long turn: Your main point is clear. Add one memorable detail about the place, activity, person, or feeling.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('“The trip was memorable.”')).toBeInTheDocument();
    expect(screen.getByText(/One moment I clearly remember is/)).toBeInTheDocument();
  });

  it('marks a final practice transcript as captured after recognition settles', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'user',
          text: 'I enjoy visiting the park with my family.',
          isTranscript: true,
        }}
      />
    );

    expect(screen.getByText('Captured transcript')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
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

  it('does not reveal examiner words ahead of stalled audio progress', async () => {
    vi.useFakeTimers();
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'ai',
          text: 'When did you first become interested in learning English?',
          isExaminerLive: true,
          isExaminerSpeaking: true,
          speechProgress: 0,
        }}
      />
    );

    expect(screen.getByText('When')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_200);
    });

    expect(screen.getByText('When')).toBeInTheDocument();
    expect(screen.queryByText(/When did you first/)).not.toBeInTheDocument();
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
