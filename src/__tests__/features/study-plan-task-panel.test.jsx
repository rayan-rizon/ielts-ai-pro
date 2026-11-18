import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TaskPanel from '@/features/learning/components/dashboard/TaskPanel';

const day = (dateKey) => ({ dateKey, date: new Date(`${dateKey}T12:00:00`), tasks: [] });
const days = Array.from({ length: 14 }, (_, index) =>
  day(`2026-10-${String(6 + index).padStart(2, '0')}`)
);
const base = {
  id: 'row-1',
  activity_key: 'v2:2026-10-08:repair:reading:x:primary',
  title: 'Matching Features repair',
  module: 'reading',
  estimated_time: 40,
  scheduled_date: '2026-10-08',
  completion_policy: 'verified',
  success_criterion: 'Complete the set at 80%+ accuracy with steady timing.',
};
const renderPanel = (task, overrides = {}) =>
  render(
    <TaskPanel
      task={task}
      day={days[2]}
      days={days}
      todayKey="2026-10-06"
      canReschedule
      onStart={vi.fn()}
      onToggle={vi.fn()}
      onReschedule={vi.fn()}
      {...overrides}
    />
  );

describe('TaskPanel session checklist', () => {
  it('shows pending steps that cannot be ticked by hand', () => {
    renderPanel(base);
    expect(screen.getByText('In this session')).toBeVisible();
    expect(screen.getAllByRole('img', { name: 'To do' })).toHaveLength(2);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByText('Ticks automatically from your results.')).toBeVisible();
  });

  it('ticks the attempt and shows a missed goal with the real result', () => {
    renderPanel({ ...base, is_completed: true, outcome_accuracy: 60 });
    expect(screen.getByRole('img', { name: 'Done' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Goal not reached' })).toBeInTheDocument();
    expect(screen.getByText('60% · goal 80%')).toBeVisible();
  });

  it('offers a date picker for any day of a longer plan, not just the next seven', () => {
    const onReschedule = vi.fn();
    renderPanel(base, { onReschedule });
    const picker = screen.getByLabelText('Move to another day in your plan');
    expect(picker).toHaveAttribute('max', '2026-10-19');
    fireEvent.change(picker, { target: { value: '2026-10-15' } });
    expect(onReschedule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'row-1' }),
      '2026-10-15'
    );
  });
});
