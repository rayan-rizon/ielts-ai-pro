import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FirstTestPanel from '@/features/learning/components/dashboard/FirstTestPanel';

describe('first Learning Path visit', () => {
  it('explains actual-test personalization and opens every subject in Practice Mode', () => {
    const navigate = vi.fn();
    render(<FirstTestPanel navigate={navigate} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Start with a test');
    expect(screen.getByText(/based on your actual IELTS test results/)).toBeVisible();
    for (const subject of ['reading', 'listening', 'writing', 'speaking']) {
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(`Start ${subject} practice`) })
      );
      expect(navigate).toHaveBeenLastCalledWith(`/${subject}?mode=practice`);
    }
    expect(screen.queryByText(/diagnostic|predicted band/i)).not.toBeInTheDocument();
  });
  it('distinguishes pending scores from an empty history', () => {
    render(<FirstTestPanel navigate={vi.fn()} awaitingScore />);
    expect(screen.getByText(/does not have a completed score yet/)).toBeVisible();
  });
});
