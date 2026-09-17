import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlanSignalsCard from '@/features/learning/components/dashboard/PlanSignalsCard';

describe('Learning Path plan guide', () => {
  it('turns the checkpoint into an evidence-aware guide with one refresh action and one edit action', () => {
    const onRefresh = vi.fn();
    const onCustomize = vi.fn();

    render(
      <PlanSignalsCard
        trigger="test_completed"
        changeReason="A newly completed listening test changed the evidence used by your plan."
        checkpoint={{
          type: 'timed_check',
          title: 'Next phase checkpoint',
          progress_definition: 'Complete two timed modules within official time limits.',
        }}
        onRefresh={onRefresh}
        onCustomize={onCustomize}
        planUpdateAvailable
      />
    );

    expect(screen.getByRole('heading', { name: 'Your plan guide' })).toBeVisible();
    expect(screen.getByText(/Check below to see why each task helps/)).toBeVisible();
    expect(screen.getByText('Evidence received')).toBeVisible();
    expect(screen.getByText('Your checkpoint')).toBeVisible();
    expect(screen.getByText('Your path updates')).toBeVisible();
    expect(screen.getByText('Test Completed')).toBeVisible();
    expect(screen.getByText('Next phase checkpoint')).toBeVisible();
    expect(screen.getByText('Update needed')).toBeVisible();
    // Starting the recommended task is not this card's job — that lives in the
    // "Do this next" tile beside it. This card owns exactly refresh + edit.
    expect(screen.queryByRole('button', { name: /open next task/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Update plan' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });

  it('offers a quiet, cost-safe update check when no update is pending', () => {
    const onRefresh = vi.fn();
    const onCustomize = vi.fn();

    render(
      <PlanSignalsCard
        checkpoint={{ title: 'Writing scored level check' }}
        onRefresh={onRefresh}
        onCustomize={onCustomize}
      />
    );

    expect(screen.getByText('Writing scored level check')).toBeVisible();
    expect(screen.getByText('Saved plan')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Update plan' })).not.toBeInTheDocument();

    const checkButton = screen.getByRole('button', { name: 'Check for updates' });
    expect(checkButton).toHaveAttribute(
      'title',
      'Checks your latest results; reuses the saved plan when nothing changed'
    );
    fireEvent.click(checkButton);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Edit plan' }));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });
});
