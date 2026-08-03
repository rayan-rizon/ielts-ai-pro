import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfettiCelebration from '@/components/ConfettiCelebration';

describe('ConfettiCelebration', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps one completion timer when its parent rerenders', () => {
    vi.useFakeTimers();
    const firstComplete = vi.fn();
    const latestComplete = vi.fn();
    const { rerender } = render(
      <ConfettiCelebration show particleCount={3} onComplete={firstComplete} />
    );

    rerender(<ConfettiCelebration show particleCount={3} onComplete={latestComplete} />);

    act(() => vi.advanceTimersByTime(4600));

    expect(firstComplete).not.toHaveBeenCalled();
    expect(latestComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('confetti-celebration')).not.toBeInTheDocument();
  });

  it('creates a new celebration after the previous result is dismissed', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { rerender } = render(
      <ConfettiCelebration show particleCount={3} onComplete={onComplete} />
    );

    act(() => vi.advanceTimersByTime(4600));
    rerender(<ConfettiCelebration show={false} particleCount={3} onComplete={onComplete} />);
    rerender(<ConfettiCelebration show particleCount={3} onComplete={onComplete} />);
    act(() => vi.advanceTimersByTime(4600));

    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
