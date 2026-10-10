import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GridMetaBar, TestRowBadge } from '@/features/testing/speaking/SpeakingCardComponents';

describe('speaking library score states', () => {
  it('labels an unscored completed report in grid and volume views', () => {
    render(
      <>
        <GridMetaBar duration={15} isCompleted displayScore={null} />
        <TestRowBadge isCompleted score={null} />
      </>
    );
    expect(screen.getAllByText('Score not available')).toHaveLength(2);
    expect(screen.queryByText('/ 9.0')).not.toBeInTheDocument();
    expect(screen.queryByText('Your score')).not.toBeInTheDocument();
  });
  it('preserves an actual zero score', () => {
    render(<GridMetaBar duration={15} isCompleted displayScore={0} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.queryByText('Score not available')).not.toBeInTheDocument();
  });
});
