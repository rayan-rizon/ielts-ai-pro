import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TestHeader from '@/features/testing/speaking/components/TestHeader';

describe('Speaking test header', () => {
  it('describes a completed part as complete and ready for the next part', () => {
    render(
      <TestHeader
        currentPartNumber={1}
        currentPart={{ title: 'Introduction', questions: 'Question one\nQuestion two' }}
        totalParts={3}
        currentQuestionIndex={1}
        timeLeft={300}
        testTitle="Speaking Test"
        isMuted={false}
        setIsMuted={vi.fn()}
        isPart2Prep={false}
        isPartComplete
        onShowExitDialog={vi.fn()}
      />
    );

    expect(screen.getByText('Part 1 complete')).toBeInTheDocument();
    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
    expect(screen.getByText('Ready for Part 2')).toBeInTheDocument();
    expect(screen.queryByText('Part 1 is active')).not.toBeInTheDocument();
    expect(screen.getAllByText('Practice room').length).toBeGreaterThan(0);
    expect(screen.queryByText('Your responses are saved automatically')).not.toBeInTheDocument();
  });

  it('renders exam badge when in exam mode', () => {
    render(
      <TestHeader
        currentPartNumber={1}
        currentPart={{ title: 'Introduction', questions: 'Question one' }}
        totalParts={3}
        currentQuestionIndex={0}
        timeLeft={300}
        testTitle="Speaking Test"
        isMuted={false}
        setIsMuted={vi.fn()}
        isPart2Prep={false}
        isPartComplete={false}
        onShowExitDialog={vi.fn()}
        speakingMode="exam"
      />
    );

    expect(screen.getAllByText('Exam room').length).toBeGreaterThan(0);
    expect(screen.queryByText('Practice room')).not.toBeInTheDocument();
  });
});
