import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmExitDialog from '@/shared/ui/ConfirmExitDialog';

describe('ConfirmExitDialog component', () => {
  it('renders exit dialog with Learner Panel Design System styling, badge, and reassurance strip', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmExitDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Exit Test?"
        description="Your progress will be saved. You can resume this test later from your dashboard."
        confirmLabel="Exit"
        cancelLabel="Continue Test"
      />
    );

    expect(screen.getByText('Exit Test?')).toBeInTheDocument();
    expect(screen.getByText('Active Test')).toBeInTheDocument();
    expect(screen.getByText('Progress Preserved')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your progress will be saved. You can resume this test later from your dashboard.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument();
  });

  it('triggers onConfirm and onOpenChange when user clicks Exit', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmExitDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('triggers onCancel and closes dialog when user clicks Continue Test', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmExitDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue Test' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows saving spinner and disables buttons when isConfirming is true', () => {
    render(
      <ConfirmExitDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isConfirming={true}
        confirmingLabel="Saving…"
      />
    );

    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Test' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });
});
