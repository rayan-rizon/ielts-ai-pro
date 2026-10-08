import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimelineStep from '@/features/onboarding/components/steps/TimelineStep';

describe('onboarding exam-date calendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 9, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('carries the calendar to the estimated month and counts down to it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TimelineStep onChangeTimeline={onChange} />);
    expect(screen.getByText('October')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /within 2 months/i }));
    expect(onChange).toHaveBeenCalledWith({
      timeline_type: 'estimated',
      estimated_weeks: 8,
      test_date: null,
    });

    rerender(
      <TimelineStep timelineType="estimated" estimatedWeeks={8} onChangeTimeline={onChange} />
    );
    expect(screen.getByText('December')).toBeInTheDocument();
    expect(screen.getByText('Estimated exam')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  it('records a tapped day as a confirmed exam date', () => {
    const onChange = vi.fn();
    render(<TimelineStep onChangeTimeline={onChange} />);
    fireEvent.click(screen.getByRole('gridcell', { name: '20' }));
    const update = onChange.mock.calls[0][0];
    expect(update.timeline_type).toBe('specific');
    expect(update.estimated_weeks).toBeNull();
    expect(update.test_date).toEqual(new Date(2026, 9, 20));
  });

  it('does not let the learner go back before the current month', () => {
    render(<TimelineStep onChangeTimeline={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled();
  });
});
