import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import WritingAnalysis from '@/features/testing/writing/components/WritingTest/components/WritingAnalysis';

describe('WritingAnalysis component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.clearAllTimers();
    });
    vi.useRealTimers();
  });

  it('renders correctly with initial criteria steps, header, and logo', () => {
    render(<WritingAnalysis loadingMessage="Analyzing vocabulary..." />);

    expect(screen.getByText(/IELTS Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluating Your Writing/i)).toBeInTheDocument();
    expect(screen.getByText(/Grammar & Accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/Lexical Resource/i)).toBeInTheDocument();
    expect(screen.getByText(/Coherence & Cohesion/i)).toBeInTheDocument();
    expect(screen.getByText(/Task & Band Calibration/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluated against official IELTS band criteria/i)).toBeInTheDocument();
  });

  it('progresses through steps as timers advance without rendering raw numbers', () => {
    render(<WritingAnalysis />);

    expect(screen.getByText(/Reviewing grammar & accuracy.../i)).toBeInTheDocument();

    // Advance through the first step (~1700ms)
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(screen.getByText(/Reviewing lexical resource.../i)).toBeInTheDocument();

    // Advance through all steps
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(
      screen.getByText(/Calibrating band scores and finalizing feedback.../i)
    ).toBeInTheDocument();
  });
});
