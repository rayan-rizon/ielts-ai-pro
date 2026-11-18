import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiCoach from '@/features/ai-coach/pages/AiCoach';
import {
  bootstrapCoach,
  loadCoachHistory,
  sendCoachMessage,
} from '@/features/ai-coach/services/aiCoachService';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Alex Learner', avatar_url: '/avatar.png' } }),
}));

vi.mock('@/features/ai-coach/services/aiCoachService', () => ({
  bootstrapCoach: vi.fn(),
  loadCoachHistory: vi.fn(),
  sendCoachMessage: vi.fn(),
  checkCoachExercise: vi.fn(),
  confirmCoachAction: vi.fn(),
  deleteCoachConversation: vi.fn(),
  executeConfirmedClientAction: vi.fn(),
}));

describe('AI Coach conversation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bootstrapCoach.mockResolvedValue({
      status: { enabled: true, budgetAvailable: true, remainingDailyReplies: 20 },
      preferredLanguage: 'en',
      conversations: [
        {
          id: 'reading-chat',
          title: 'Reading matching headings',
          last_message_at: new Date().toISOString(),
        },
        {
          id: 'writing-chat',
          title: 'Writing task 2 essay',
          last_message_at: new Date().toISOString(),
        },
      ],
    });
    loadCoachHistory.mockResolvedValue({
      messages: [
        {
          id: 'question',
          role: 'user',
          content: 'Help with my writing essay',
          created_at: new Date().toISOString(),
        },
        {
          id: 'answer',
          role: 'assistant',
          content: 'Start with a clear position and one idea per paragraph.',
          response_language: 'en',
          follow_ups: [
            'Can you help me state my position on this essay topic?',
            'How should I build the first body paragraph?',
          ],
          created_at: new Date().toISOString(),
        },
      ],
      nextBefore: null,
    });
    sendCoachMessage.mockResolvedValue({
      conversationId: 'writing-chat',
      messageId: 'next-answer',
      answer: 'Try a clear topic sentence.',
      responseLanguage: 'en',
      followUps: ['Can you show a topic sentence for my first body paragraph?'],
      remainingDailyReplies: 19,
    });
  });

  it('shows the profile avatar, filters history, and sends a contextual follow-up', async () => {
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Search conversations' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search recent conversations' }), {
      target: { value: 'writing' },
    });
    expect(screen.getByRole('button', { name: 'Open Writing task 2 essay' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open Reading matching headings' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Writing task 2 essay' }));
    const followUps = await screen.findByRole('group', { name: 'Suggested follow-up questions' });
    expect(document.querySelector('article img[src="/avatar.png"]')).toBeInTheDocument();
    fireEvent.click(
      within(followUps).getByRole('button', {
        name: 'Can you help me state my position on this essay topic?',
      })
    );
    await waitFor(() =>
      expect(sendCoachMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'writing-chat',
          message: 'Can you help me state my position on this essay topic?',
        })
      )
    );
    expect(
      await screen.findByRole('button', {
        name: 'Can you show a topic sentence for my first body paragraph?',
      })
    ).toBeInTheDocument();
  });

  it('formats numbered steps, emphasis, and a template heading in saved answers', async () => {
    loadCoachHistory.mockResolvedValueOnce({
      messages: [
        { id: 'question', role: 'user', content: 'Show me an introduction template.' },
        {
          id: 'answer',
          role: 'assistant',
          content:
            'Use two clear parts.\n\n1️⃣ *Position sentence* – State your stance.\n\n2️⃣ *Overview sentence* – Name your points.\n\n**Template**\n*Position:* I *disagree* with this view.',
          response_language: 'en',
        },
      ],
      nextBefore: null,
    });

    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Open Writing task 2 essay' }));

    expect(await screen.findByRole('heading', { name: 'Template' })).toBeInTheDocument();
    expect(document.querySelectorAll('.coach-answer ol')).toHaveLength(1);
    expect(document.querySelectorAll('.coach-answer ol li')).toHaveLength(2);
    expect(document.querySelector('.coach-answer')).toHaveTextContent('Position: I disagree');
    expect(document.querySelector('.coach-answer')).not.toHaveTextContent('*Position:*');
  });

  it('clears an unsent draft when starting a new conversation', async () => {
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    const composer = await screen.findByRole('textbox', { name: 'Ask Ava' });
    fireEvent.change(composer, { target: { value: 'Explain my essay' } });
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    expect(composer).toHaveValue('');
  });

  it('opens the exact result cited in a saved reply', async () => {
    loadCoachHistory.mockResolvedValueOnce({
      messages: [
        {
          id: 'reply',
          role: 'assistant',
          content: 'Review the missing detail.',
          evidence_refs: [
            {
              id: 'session:0f7d3b5e-9a52-4c1d-8d7e-3a1b2c4d5e6f',
              claim: 'Listening practice result · band 6',
              resultModule: 'listening',
            },
          ],
        },
      ],
    });
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Open Writing task 2 essay' }));
    expect(
      await screen.findByRole('link', { name: /open listening practice result/i })
    ).toHaveAttribute(
      'href',
      '/listening-test/0f7d3b5e-9a52-4c1d-8d7e-3a1b2c4d5e6f?view-results=true'
    );
  });

  it('opens saved conversations in a dismissible drawer from the Chats control', async () => {
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    const history = await screen.findByRole('complementary');
    history.scrollIntoView = () => {};
    fireEvent.click(screen.getByRole('button', { name: 'Chats', exact: true }));
    const drawer = await screen.findByRole('dialog', { name: 'Saved conversations' });
    fireEvent.click(within(drawer).getByRole('button', { name: 'Open Writing task 2 essay' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      await screen.findByText('Start with a clear position and one idea per paragraph.')
    ).toBeInTheDocument();
  });
  it('keeps a displayed chat selected if loading another chat fails', async () => {
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Open Writing task 2 essay' }));
    expect(
      await screen.findByText('Start with a clear position and one idea per paragraph.')
    ).toBeInTheDocument();

    loadCoachHistory.mockRejectedValueOnce(new Error('Could not open chat'));
    fireEvent.click(screen.getByRole('button', { name: 'Open Reading matching headings' }));
    await waitFor(() =>
      expect(screen.queryByText('Opening conversation…')).not.toBeInTheDocument()
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Ask Ava' }), {
      target: { value: 'Explain the next paragraph' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() =>
      expect(sendCoachMessage).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'writing-chat' })
      )
    );
  });
  it('reveals the quota reset time from the compact reply counter', async () => {
    bootstrapCoach.mockResolvedValueOnce({
      status: {
        enabled: true,
        budgetAvailable: true,
        remainingDailyReplies: 20,
        quotaResetsAt: '2026-11-20T00:00:00Z',
      },
      preferredLanguage: 'en',
      conversations: [],
    });
    render(
      <MemoryRouter>
        <AiCoach />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: '20 replies left' }));
    expect(await screen.findByText(/Resets/)).toBeVisible();
  });
});
