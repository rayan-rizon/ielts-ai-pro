import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PlanSignalsCard from '@/features/learning/components/dashboard/PlanSignalsCard';

describe('Learning Path plan guide', () => {
  const nextTask = {
    title: 'Timed listening practice',
    module: 'listening',
    activity_type: 'timed_assessment',
  };

  it('turns the checkpoint into an actionable, evidence-aware guide', () => {
    const onStart = vi.fn();
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
        nextTask={nextTask}
        onStart={onStart}
        onCustomize={onCustomize}
        planUpdateAvailable
      />
    );

    expect(
      screen.getByRole('heading', { name: 'What changed, and what to do next' })
    ).toBeVisible();
    expect(screen.getByText('Evidence received')).toBeVisible();
    expect(screen.getByText('Your checkpoint')).toBeVisible();
    expect(screen.getByText('Your path updates')).toBeVisible();
    expect(screen.getByText('Test Completed')).toBeVisible();
    expect(screen.getByText('Timed listening practice')).toBeVisible();
    expect(screen.getByText('New evidence ready')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Update plan' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open next task' }));
    expect(onStart).toHaveBeenCalledWith(nextTask);

    fireEvent.click(screen.getByRole('button', { name: 'Review goals' }));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });

  it('keeps the guide useful when no planned task is available yet', () => {
    const onCustomize = vi.fn();

    render(
      <PlanSignalsCard
        checkpoint={{ title: 'Writing scored level check' }}
        onCustomize={onCustomize}
      />
    );

    expect(screen.queryByRole('button', { name: 'Open next task' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Writing scored level check')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Review goals' }));
    expect(onCustomize).toHaveBeenCalledTimes(1);
  });
});
