import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiCoach from '@/features/ai-coach/pages/AiCoach';
import { COACH_DRAFT_KEY } from '@/features/ai-coach/config';
import {
  bootstrapCoach,
  getCoachSourcePreview,
  sendCoachMessage,
} from '@/features/ai-coach/services/aiCoachService';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { full_name: 'Alex Learner' } }),
}));

vi.mock('@/features/ai-coach/services/aiCoachService', () => ({
  bootstrapCoach: vi.fn(),
  loadCoachHistory: vi.fn(),
  sendCoachMessage: vi.fn(),
  checkCoachExercise: vi.fn(),
  confirmCoachAction: vi.fn(),
  deleteCoachConversation: vi.fn(),
  executeConfirmedClientAction: vi.fn(),
  getCoachSourcePreview: vi.fn(),
}));

const SESSION = '0f7d3b5e-9a52-4c1d-8d7e-3a1b2c4d5e6f';

const renderCoach = () =>
  render(
    <MemoryRouter>
      <AiCoach />
    </MemoryRouter>
  );

const preview = {
  title: 'Reading result',
  facts: [
    { label: 'Band', value: '6.5' },
    { label: 'Correct', value: '24/40' },
    { label: 'Weakest type', value: 'true false not given 0/3' },
  ],
  suggestions: [
    { message: 'Why was my answer to question 3 wrong?', questionNumber: 3 },
    { message: 'What mistakes do my wrong answers have in common?' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  bootstrapCoach.mockResolvedValue({
    status: { enabled: true, budgetAvailable: true, remainingDailyReplies: 5 },
    preferredLanguage: 'bn',
    conversations: [],
  });
  getCoachSourcePreview.mockResolvedValue({ preview });
  sendCoachMessage.mockResolvedValue({
    conversationId: 'c1',
    messageId: 'm1',
    answer: 'Final answer.',
    responseLanguage: 'bn',
    followUps: [],
    remainingDailyReplies: 4,
  });
});

describe('streamed replies', () => {
  it('shows validated sentences while Ava is still writing, then the saved answer', async () => {
    let finish;
    sendCoachMessage.mockImplementationOnce(({ onDelta, onReset }) => {
      onDelta('First sentence. ');
      return new Promise((resolve) => {
        finish = (result) => resolve(result);
        // Make onReset reachable for the test below.
        sendCoachMessage.onReset = onReset;
        sendCoachMessage.onDelta = onDelta;
      });
    });
    renderCoach();
    const box = await screen.findByLabelText(/Ask Ava/);
    fireEvent.change(box, { target: { value: 'How do I plan an essay?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(/First sentence\./)).toBeInTheDocument();
    expect(screen.queryByText('Checking your learning evidence…')).not.toBeInTheDocument();

    act(() => sendCoachMessage.onDelta('Second sentence.'));
    expect(screen.getByText(/First sentence\. Second sentence\./)).toBeInTheDocument();

    // A superseded draft is retracted rather than left on screen.
    act(() => sendCoachMessage.onReset());
    expect(screen.queryByText(/First sentence\./)).not.toBeInTheDocument();

    await act(async () =>
      finish({
        conversationId: 'c1',
        messageId: 'm1',
        answer: 'Final answer.',
        responseLanguage: 'en',
        followUps: [],
        remainingDailyReplies: 4,
      })
    );
    expect(await screen.findByText('Final answer.')).toBeInTheDocument();
    expect(screen.getAllByText('Final answer.')).toHaveLength(1);
  });

  it('shows the spinner until the first validated sentence arrives', async () => {
    sendCoachMessage.mockImplementationOnce(() => new Promise(() => {}));
    renderCoach();
    fireEvent.change(await screen.findByLabelText(/Ask Ava/), { target: { value: 'Hello coach' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Checking your learning evidence…')).toBeInTheDocument();
  });

  it('puts the question back and clears the draft reply when streaming fails', async () => {
    sendCoachMessage.mockImplementationOnce(({ onDelta }) => {
      onDelta('Half an answer. ');
      return Promise.reject(new Error('Ava could not verify an answer to that.'));
    });
    renderCoach();
    const box = await screen.findByLabelText(/Ask Ava/);
    fireEvent.change(box, { target: { value: 'Promise me band 8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(box).toHaveValue('Promise me band 8'));
    expect(screen.queryByText(/Half an answer/)).not.toBeInTheDocument();
  });
});

describe('language hint for app-written drafts', () => {
  it('asks for the saved language when an unedited starter is sent', async () => {
    renderCoach();
    fireEvent.click(await screen.findByRole('button', { name: 'Review my latest result' }));
    const box = screen.getByLabelText(/Ask Ava/);
    expect(box).toHaveValue('Review my latest result');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalledTimes(1));
    expect(sendCoachMessage.mock.calls[0][0]).toMatchObject({
      message: 'Review my latest result',
      languageHint: 'preference',
      preferredLanguage: 'bn',
    });
  });

  it('lets the wording decide the language again once the learner edits the starter', async () => {
    renderCoach();
    fireEvent.click(await screen.findByRole('button', { name: 'Give me a speaking topic' }));
    fireEvent.change(screen.getByLabelText(/Ask Ava/), {
      target: { value: 'Give me a speaking topic about travel' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalledTimes(1));
    expect(sendCoachMessage.mock.calls[0][0].languageHint).toBeUndefined();
  });

  it('treats a draft handed over from an "Ask Ava" button the same way', async () => {
    window.sessionStorage.setItem(
      COACH_DRAFT_KEY,
      JSON.stringify({
        message: 'Explain question 3 and what I should learn from my answer.',
        sourceReference: { type: 'test_session', id: SESSION, questionNumber: 3 },
        canned: true,
      })
    );
    renderCoach();
    const box = await screen.findByLabelText(/Ask Ava/);
    await waitFor(() =>
      expect(box).toHaveValue('Explain question 3 and what I should learn from my answer.')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalled());
    expect(sendCoachMessage.mock.calls[0][0]).toMatchObject({
      languageHint: 'preference',
      sourceReference: { type: 'test_session', id: SESSION, questionNumber: 3 },
    });
  });
});

describe('attached result summary', () => {
  const attach = () =>
    window.sessionStorage.setItem(
      COACH_DRAFT_KEY,
      JSON.stringify({
        message: 'Explain the most important lesson from my completed Reading result.',
        sourceReference: { type: 'test_session', id: SESSION },
        canned: true,
      })
    );

  it('shows the deterministic facts and question chips without spending a reply', async () => {
    attach();
    renderCoach();
    const card = await screen.findByLabelText('Attached result summary');
    expect(getCoachSourcePreview).toHaveBeenCalledWith(SESSION);
    expect(within(card).getByText('Reading result')).toBeInTheDocument();
    expect(within(card).getByText('24/40')).toBeInTheDocument();
    expect(within(card).getByText('true false not given 0/3')).toBeInTheDocument();
    expect(sendCoachMessage).not.toHaveBeenCalled();
  });

  it('sends a chip about question 3 with that question attached', async () => {
    attach();
    renderCoach();
    const card = await screen.findByLabelText('Attached result summary');
    fireEvent.click(
      within(card).getByRole('button', { name: 'Why was my answer to question 3 wrong?' })
    );
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalledTimes(1));
    expect(sendCoachMessage.mock.calls[0][0]).toMatchObject({
      message: 'Why was my answer to question 3 wrong?',
      languageHint: 'preference',
      sourceReference: { type: 'test_session', id: SESSION, questionNumber: 3 },
    });
  });

  it('keeps the result attached for follow-up questions in the same conversation', async () => {
    attach();
    renderCoach();
    const box = await screen.findByLabelText(/Ask Ava/);
    fireEvent.change(box, { target: { value: 'And what about question 4?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('Final answer.');
    fireEvent.change(screen.getByLabelText(/Ask Ava/), { target: { value: 'And question 5?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(sendCoachMessage).toHaveBeenCalledTimes(2));
    expect(sendCoachMessage.mock.calls[1][0].sourceReference).toMatchObject({
      type: 'test_session',
      id: SESSION,
    });
  });

  it('still lets the learner remove the attachment, and degrades quietly if the summary fails', async () => {
    attach();
    getCoachSourcePreview.mockRejectedValueOnce(new Error('offline'));
    renderCoach();
    const remove = await screen.findByRole('button', { name: 'Remove result' });
    expect(screen.queryByLabelText('Attached result summary')).not.toBeInTheDocument();
    fireEvent.click(remove);
    expect(screen.queryByRole('button', { name: 'Remove result' })).not.toBeInTheDocument();
  });
});

describe('sidebar', () => {
  it('shows saved conversations only, with no explainer cards under them', async () => {
    renderCoach();
    expect(await screen.findByText('Saved conversations')).toBeInTheDocument();
    expect(screen.queryByText('Evidence first')).not.toBeInTheDocument();
    expect(screen.queryByText('What Ava remembers')).not.toBeInTheDocument();
  });
});
