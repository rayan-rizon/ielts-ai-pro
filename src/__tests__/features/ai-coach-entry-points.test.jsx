import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExplanationBody } from '@/features/testing/reading/components/DeepDivePopover';
import { CoachSourceProvider } from '@/features/ai-coach/CoachSourceContext';
import AskAiCoachButton from '@/features/ai-coach/components/AskAiCoachButton';
import { COACH_DRAFT_KEY, takeCoachDraft } from '@/features/ai-coach/config';

const SESSION = '0f7d3b5e-9a52-4c1d-8d7e-3a1b2c4d5e6f';
const entries = [
  {
    key: '12',
    data: {
      correct_answer: 'B',
      why_correct: 'The writer contrasts two views.',
      trap: 'Option C.',
    },
  },
];

const renderBody = (sessionId) =>
  render(
    <MemoryRouter>
      <CoachSourceProvider sessionId={sessionId}>
        <ExplanationBody entries={entries} userAnswer="C" />
      </CoachSourceProvider>
    </MemoryRouter>
  );

describe('Ask Ava entry points', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('offers "Ask Ava about this question" inside a completed review', () => {
    renderBody(SESSION);
    const button = screen.getByRole('link', { name: /Ask Ava about this question/ });
    expect(button).toHaveAttribute('href', '/ai-coach');
    fireEvent.click(button);
    expect(takeCoachDraft()).toEqual({
      message: 'Explain question 12 and what I should learn from my answer.',
      sourceReference: { type: 'test_session', id: SESSION, questionNumber: 12 },
      canned: true,
    });
  });

  it('shows nothing outside a completed review, so an unfinished test cannot reach the coach', () => {
    renderBody(null);
    expect(screen.queryByRole('link', { name: /Ask Ava/ })).not.toBeInTheDocument();
    expect(screen.getByText('The writer contrasts two views.')).toBeInTheDocument();
  });

  it('keeps a plain button working: no question number leaves the source untouched', () => {
    render(
      <MemoryRouter>
        <AskAiCoachButton
          draft="Review my result"
          sourceReference={{ type: 'test_session', id: SESSION }}
        />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: /Ask AI Coach/ }));
    expect(JSON.parse(window.sessionStorage.getItem(COACH_DRAFT_KEY)).sourceReference).toEqual({
      type: 'test_session',
      id: SESSION,
    });
  });
});
