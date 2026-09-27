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
});
