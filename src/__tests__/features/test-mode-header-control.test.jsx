import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TestModeHeaderControl from '@/features/testing/shared/components/TestModeHeaderControl';

const eligible = { eligible: true, reason: '' };

describe('TestModeHeaderControl', () => {
  it('changes the attempt mode without starting a session', () => {
    const onModeChange = vi.fn();
    const onStart = vi.fn();

    render(
      <TestModeHeaderControl
        selectedMode="practice"
        onModeChange={onModeChange}
        examEligibility={eligible}
        onStart={onStart}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Exam' }));

    expect(onModeChange).toHaveBeenCalledWith('exam');
    expect(onStart).not.toHaveBeenCalled();
  });

  it('starts with the currently selected mode', () => {
    const onStart = vi.fn();

    render(
      <TestModeHeaderControl
        selectedMode="exam"
        onModeChange={vi.fn()}
        examEligibility={eligible}
        onStart={onStart}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Start Test' }));

    expect(onStart).toHaveBeenCalledWith('exam');
  });

  it('disables Exam Mode and exposes the eligibility reason', () => {
    const reason = 'This test needs 40 questions.';

    render(
      <TestModeHeaderControl
        selectedMode="practice"
        onModeChange={vi.fn()}
        examEligibility={{ eligible: false, reason }}
        onStart={vi.fn()}
      />
    );

    const examOption = screen.getByRole('radio', { name: `Exam: ${reason}` });
    expect(examOption).toBeDisabled();
    expect(examOption).toHaveAttribute('title', reason);
  });

  it('renders guidance callout with responsive right alignment and allows dismissing', async () => {
    render(
      <TestModeHeaderControl
        selectedMode="practice"
        onModeChange={vi.fn()}
        examEligibility={eligible}
        onStart={vi.fn()}
        isAwaitingStart={true}
      />
    );

    const heading = screen.getByText('Choose Your Test Mode');
    expect(heading).toBeInTheDocument();

    const callout = heading.closest('.absolute');
    expect(callout).toHaveClass('right-0');

    const dismissBtn = screen.getByRole('button', { name: 'Close guidance callout' });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText('Choose Your Test Mode')).not.toBeInTheDocument();
    });
  });

  it('allows switching modes by clicking options inside the guidance callout', () => {
    const onModeChange = vi.fn();

    render(
      <TestModeHeaderControl
        selectedMode="practice"
        onModeChange={onModeChange}
        examEligibility={eligible}
        onStart={vi.fn()}
        isAwaitingStart={true}
      />
    );

    const examCard = screen
      .getByText('Strict IELTS timed test simulation & official score recording.')
      .closest('[role="button"]');
    expect(examCard).toBeInTheDocument();
    fireEvent.click(examCard);

    expect(onModeChange).toHaveBeenCalledWith('exam');
  });
});
