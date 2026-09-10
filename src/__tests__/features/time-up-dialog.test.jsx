import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TimeUpDialog from '@/shared/ui/TimeUpDialog';

describe('TimeUpDialog component', () => {
  it('renders time up dialog with instrument-panel styling and copy', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <TimeUpDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        onCancel={onCancel}
        answeredCount={28}
        totalQuestions={40}
      />
    );

    expect(screen.getByText("Time's Up")).toBeInTheDocument();
    expect(screen.getByText('Time Expired')).toBeInTheDocument();
    expect(screen.getByText('Responses auto-saved')).toBeInTheDocument();
    expect(screen.getByText('28 / 40')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answers' })).toBeInTheDocument();
  });

  it('triggers onConfirm when user clicks Check answers', () => {
    const onConfirm = vi.fn();

    render(
      <TimeUpDialog open={true} onOpenChange={vi.fn()} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('triggers onCancel when user clicks Cancel', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TimeUpDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders evaluating state and disables actions when isSubmitting is true', () => {
    render(
      <TimeUpDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} isSubmitting={true} />
    );

    expect(screen.getByText('Evaluating…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
