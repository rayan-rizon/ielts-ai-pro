import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PartCompleteCard from '@/features/testing/speaking/components/PartCompleteCard';

describe('speaking part complete card', () => {
  it('automatically prepares the final report without a manual report button', () => {
    render(
      <PartCompleteCard
        isPartComplete
        currentPartNumber={3}
        allParts={{ 1: {}, 2: {}, 3: {} }}
        onMoveToNext={vi.fn()}
      />
    );

    expect(screen.getByText('Analysing your performance')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /generate final report/i })
    ).not.toBeInTheDocument();
  });

  it('keeps the learner-controlled transition between test parts', () => {
    const onMoveToNext = vi.fn();
    render(
      <PartCompleteCard
        isPartComplete
        currentPartNumber={1}
        allParts={{ 1: {}, 2: {}, 3: {} }}
        onMoveToNext={onMoveToNext}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /proceed to part 2/i }));
    expect(onMoveToNext).toHaveBeenCalledOnce();
  });

  it('locks the transition button while Part 2 is opening', () => {
    render(
      <PartCompleteCard
        isPartComplete
        currentPartNumber={1}
        allParts={{ 1: {}, 2: {}, 3: {} }}
        onMoveToNext={vi.fn()}
        isTransitioning
      />
    );

    expect(screen.getByRole('button', { name: /opening part 2/i })).toBeDisabled();
  });
});
