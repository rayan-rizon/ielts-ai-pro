import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudyTimeStep from '@/features/onboarding/components/steps/StudyTimeStep';
import { getWeeklyCapacity } from '../../../supabase/functions/_shared/learningPathV2';

describe('onboarding study presets', () => {
  const availability = { version: 1, timezone: 'Asia/Dhaka', days: { monday: 45, saturday: 90 } };

  it.each([
    ['1–3 hours', 120],
    ['4–7 hours', 300],
    ['8–12 hours', 600],
  ])('maps %s to real daily limits while retaining timezone', (name, capacity) => {
    const onChange = vi.fn();
    render(
      <StudyTimeStep
        studyAvailability={availability}
        studyHoursGoal={2}
        onChangeAvailability={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
    const result = onChange.mock.calls[0][0];
    expect(result.timezone).toBe('Asia/Dhaka');
    expect(result.version).toBe(1);
    expect(getWeeklyCapacity(result)).toBe(capacity);
    expect(Object.values(result.days).every((minutes) => minutes >= 20 && minutes <= 240)).toBe(
      true
    );
  });

  it('opens custom scheduling without silently replacing existing days', () => {
    const onChange = vi.fn();
    render(
      <StudyTimeStep
        studyAvailability={availability}
        studyHoursGoal={2}
        onChangeAvailability={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /my own schedule/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('monday available minutes')).toHaveValue(45);
    expect(screen.getByLabelText('saturday available minutes')).toHaveValue(90);
    fireEvent.change(screen.getByLabelText('monday available minutes'), {
      target: { value: '60' },
    });
    expect(onChange).toHaveBeenCalledWith({ ...availability, days: { monday: 60, saturday: 90 } });
  });
});
