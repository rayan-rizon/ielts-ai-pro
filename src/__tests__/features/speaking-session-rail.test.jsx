import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SpeakingSessionRail from '@/features/testing/speaking/components/SpeakingSessionRail';

const allParts = {
  1: { title: 'Introduction & Interview' },
  2: { title: 'Long Turn' },
  3: { title: 'Two-way Discussion' },
};

describe('speaking session rail', () => {
  it('shows the persisted hands-free setting in the guidance rail', () => {
    const onHandsFreeChange = vi.fn();
    render(
      <SpeakingSessionRail
        allParts={allParts}
        currentPartNumber={1}
        testStarted
        isPart2Prep={false}
        handsFreeEnabled
        onHandsFreeChange={onHandsFreeChange}
      />
    );

    expect(screen.getAllByText('Hands-free answers')).toHaveLength(2);
    expect(screen.getAllByText('Auto')).toHaveLength(2);

    const [compactSwitch] = screen.getAllByRole('switch', {
      name: 'Toggle hands-free answers',
    });
    expect(compactSwitch).toBeChecked();

    fireEvent.click(compactSwitch);
    expect(onHandsFreeChange).toHaveBeenCalledWith(false);
  });
});
